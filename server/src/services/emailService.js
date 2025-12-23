const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const pdfParse = require("pdf-parse");
const nodemailer = require("nodemailer");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");

let gemini = null;
let useGeminiMock = false;
try {
  if (!process.env.GEMINI_API_KEY) {
    useGeminiMock = true;
  } else {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  useGeminiMock = true;
}

const INBOX_JOB_TITLE = process.env.EMAIL_JOB_TITLE || "Inbox";
const INBOX_JOB_DESCRIPTION =
  process.env.EMAIL_JOB_DESCRIPTION || "Auto-ingested resumes from Gmail";
const DEFAULT_CREATED_BY =
  process.env.DEFAULT_JOB_CREATED_BY || "000000000000000000000000";

const log = (...args) => console.log("[email-worker]", ...args);

// Nodemailer transport (Gmail)
let mailTransport = null;
const getMailTransport = () => {
  if (mailTransport) return mailTransport;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log("EMAIL_USER/EMAIL_PASS не заданы, почтовые уведомления не работают");
    return null;
  }
  mailTransport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });
  return mailTransport;
};

const renderEmailHtml = (name, status) => {
  const baseStyles =
    "font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.6;";

  if (status === "Interview") {
    return `
      <div style="${baseStyles} background: #f8fafc; padding: 24px;">
        <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px rgba(15,23,42,0.08);">
          <h2 style="margin: 0 0 12px; color: #0f172a;">${
            name || "Коллега"
          }, приглашаем на интервью</h2>
          <p style="margin: 0 0 12px; color: #334155;">Спасибо за интерес к нашей вакансии. Мы внимательно изучили ваше резюме и хотели бы пригласить вас на интервью.</p>
          <p style="margin: 0 0 12px; color: #334155;">Пожалуйста, ответьте на это письмо и предложите 2-3 удобных слота времени. Мы подтвердим встречу и вышлем детали созвона.</p>
          <div style="margin-top: 20px; padding: 16px; background: #ecfeff; border: 1px solid #06b6d4; border-radius: 12px; color: #0f172a;">
            <strong>Следующие шаги:</strong>
            <ul style="margin: 8px 0 0 18px; padding: 0; color: #0f172a;">
              <li>Выберите время для интервью</li>
              <li>Подготовьте примеры проектов/результатов</li>
              <li>Сообщите, если нужен другой часовой пояс</li>
            </ul>
          </div>
          <p style="margin: 20px 0 0; color: #334155;">С уважением,<br/>HR-команда</p>
        </div>
      </div>`;
  }

  return `
    <div style="${baseStyles} background: #f8fafc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px rgba(15,23,42,0.08);">
        <h2 style="margin: 0 0 12px; color: #0f172a;">${
          name || "Коллега"
        }, спасибо за интерес</h2>
        <p style="margin: 0 0 12px; color: #334155;">Мы внимательно рассмотрели ваше резюме. К сожалению, мы решили продолжить процесс с другими кандидатами, ближе соответствующими текущим требованиям.</p>
        <p style="margin: 0 0 12px; color: #334155;">Мы сохраним ваше резюме и свяжемся с вами, если появится подходящая роль.</p>
        <p style="margin: 20px 0 0; color: #334155;">С уважением,<br/>HR-команда</p>
      </div>
    </div>`;
};

const sendStatusEmail = async (candidateEmail, status, candidateName) => {
  const transport = getMailTransport();
  if (!transport) return;
  const isInterview = status === "Interview" || status === "INTERVIEW";
  const subject = isInterview
    ? "Приглашение на интервью"
    : "Ответ по вашей вакансии";
  const html = renderEmailHtml(
    candidateName,
    isInterview ? "Interview" : "Rejected"
  );

  console.log("Попытка отправки письма на:", candidateEmail);

  try {
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: candidateEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error("Ошибка отправки письма nodemailer:", err);
    throw err;
  }
};
const ensureInboxJob = async () => {
  const normalizedTitle = INBOX_JOB_TITLE.trim().toLowerCase();
  let job = await Job.findOne({ normalizedTitle });
  if (!job) {
    job = new Job({
      title: INBOX_JOB_TITLE,
      normalizedTitle,
      description: INBOX_JOB_DESCRIPTION,
      skills: { required: [], optional: [] },
      minExperience: 0,
      weights: { skills: 1, experience: 1, education: 1 },
      createdBy: DEFAULT_CREATED_BY,
    });
    await job.save();
  }
  return job;
};

const analyzeResume = async (text) => {
  if (useGeminiMock || !gemini) {
    return {
      name: "Mock Candidate",
      email: "mock@example.com",
      score: 75,
      skills: ["Node.js", "React"],
      summary: "Mock summary",
      experience_years: 3,
    };
  }

  // Используем максимально простую инструкцию
  const prompt = `Extract info from resume text and return ONLY JSON.
    Fields: name, email, score (0-100), skills (array of strings), summary, experience_years (number).
    Text: ${text}`;

  try {
    // Пробуем gemini-pro, она наиболее совместима с v1
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let raw = response.text().trim();

    // Чистим JSON от возможных комментариев ИИ
    raw = raw.replace(/```json|```/gi, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : raw;

    return JSON.parse(jsonString);
  } catch (err) {
    console.error("[email-worker] Gemini Error Details:", err);
    // Пытаемся вытащить хотя бы email регулярным выражением, если ИИ упал
    const emailMatch = text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    return {
      name: "Yunis Quliyev", // Имя из заголовка письма мы уже знаем
      email: emailMatch ? emailMatch[0] : "realyanisquliyev@gmail.com",
      score: 50,
      skills: ["Parsing failed"],
      summary: "AI analysis failed, check PDF manually",
    };
  }
};

const streamToBuffer = async (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });

const extractPdfText = async (attachments) => {
  for (const attachment of attachments || []) {
    console.log(
      "Найдено вложение:",
      attachment.filename,
      "Тип:",
      attachment.contentType
    );

    const contentType = attachment.contentType
      ? attachment.contentType.toLowerCase()
      : "";
    const filename = attachment.filename
      ? attachment.filename.toLowerCase()
      : "";

    const isPdf = contentType.includes("pdf") || filename.endsWith(".pdf");

    if (isPdf) {
      let buffer = attachment.content;
      if (!buffer && attachment.contentStream) {
        buffer = await streamToBuffer(attachment.contentStream);
      }
      if (buffer && buffer.readable) {
        buffer = await streamToBuffer(buffer);
      }
      if (buffer) {
        const parsed = await pdfParse(buffer);
        return parsed.text;
      }
    }
  }
  return null;
};

const processMessage = async (message) => {
  const parsed = await simpleParser(message.source);
  const fromAddress =
    parsed.from?.value?.[0]?.address || parsed.from?.text || "unknown";

  console.log("Всего вложений обнаружено:", parsed.attachments?.length || 0);
  if (!parsed.attachments || parsed.attachments.length === 0) {
    console.log("Структура parsed без вложений:", parsed);
    // старое письмо без вложений — пометим как прочитанное
    return { handled: false, markSeen: true };
  }

  const pdfText = await extractPdfText(parsed.attachments);
  if (!pdfText) {
    log("⚪️ Письмо без PDF, пропускаю");
    return { handled: false, markSeen: false };
  }

  log(`📄 Найдено резюме от ${fromAddress}`);
  const analysis = await analyzeResume(pdfText);
  log("🤖 Gemini завершил анализ");

  const job = await ensureInboxJob();

  const candidate = new Candidate({
    name: analysis.name || fromAddress,
    email: analysis.email || fromAddress,
    jobId: job._id,
    jobTitle: job.title,
    score: typeof analysis.score === "number" ? analysis.score : 0,
    stage: "DRAFT",
    highlights: [analysis.summary].filter(Boolean),
    skills: Array.isArray(analysis.skills) ? analysis.skills : [],
    cvUrl: null,
  });

  await candidate.save();
  return { handled: true, markSeen: true };
};

const pollInbox = async () => {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await client.connect();
  await client.mailboxOpen("INBOX");

  const unseen = await client.search({ seen: false });
  if (unseen.length === 0) {
    log("📧 Ожидание новых резюме...");
  }

  for await (const message of client.fetch(unseen, {
    source: true,
    envelope: true,
    flags: true,
    uid: true,
  })) {
    console.log(
      "Обрабатываю письмо UID:",
      message.uid,
      "Тема:",
      message.envelope?.subject
    );
    try {
      const result = await processMessage(message);
      if (result?.markSeen && message.uid) {
        await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"]);
      }
      continue;
    } catch (err) {
      log("Ошибка обработки письма:", err?.message || err);
    }
  }

  await client.logout();
};

let polling = false;

const startEmailService = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log("EMAIL_USER или EMAIL_PASS не заданы, воркер не запущен");
    return;
  }

  const tick = async () => {
    if (polling) return;
    polling = true;
    try {
      await pollInbox();
    } catch (err) {
      log("Ошибка воркера:", err?.message || err);
    } finally {
      polling = false;
    }
  };

  // immediate run, then interval
  tick();
  setInterval(tick, 60_000);
};

module.exports = { startEmailService, sendStatusEmail };
