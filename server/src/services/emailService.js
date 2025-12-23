const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const pdfParse = require("pdf-parse");
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
  const prompt = `Ты HR-ассистент. Проанализируй текст резюме и верни ТОЛЬКО JSON:
{
  "name": "Имя Фамилия",
  "email": "email@example.com",
  "score": 0-100,
  "skills": ["...", "..."],
  "summary": "краткое описание",
  "experience_years": 0
}
Текст резюме:
${text}`;

  if (useGeminiMock) {
    return {
      name: "Mock Candidate",
      email: "mock@example.com",
      score: 75,
      skills: ["Node.js", "React"],
      summary: "Mock summary",
      experience_years: 3,
    };
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim();
    raw = raw.replace(/```json|```/gi, "").trim(); // strip markdown fences if present
    const jsonString = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
    return JSON.parse(jsonString);
  } catch (err) {
    log("Gemini parse error:", err?.message || err);
    throw err;
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

module.exports = { startEmailService };
