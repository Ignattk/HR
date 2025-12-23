let gemini = null;
let useMock = false;
try {
  if (
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY === "your-gemini-api-key-here"
  ) {
    useMock = true;
  } else {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (e) {
  useMock = true;
}

async function scoreCV(cvText, jobProfile) {
  const prompt = `You are an AI assistant for CV screening. Given the following job profile and candidate CV, strictly return a JSON object with this format:\n\n{\n  "skillsMatch": number (0-100),\n  "experienceMatch": number (0-100),\n  "educationMatch": number (0-100),\n  "finalScore": number (0-100),\n  "highlights": array of strings\n}\n\nJob Profile: ${JSON.stringify(
    jobProfile,
    null,
    2
  )}\n\nCV Text: ${cvText}\n\nReturn only the JSON object, no explanation.`;
  if (useMock) {
    // Return mock data for development
    return {
      skillsMatch: 80,
      experienceMatch: 70,
      educationMatch: 90,
      finalScore: 80,
      highlights: [
        "Mock: Skill matched",
        "Mock: Experience matched",
        "Mock: Education matched",
      ],
    };
  }
  try {
    // Gemini prompt
    const model = gemini.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    return json;
  } catch (err) {
    // fallback: keyword matching
    return fallbackScore(cvText, jobProfile);
  }
}

function fallbackScore(cvText, jobProfile) {
  // Simple keyword and experience matching fallback
  const skills = jobProfile.skills?.required || [];
  const optionalSkills = jobProfile.skills?.optional || [];
  let skillsMatch = 0;
  let experienceMatch = 0;
  let educationMatch = 50;
  let highlights = [];

  const lowerCV = cvText.toLowerCase();
  let foundSkills = 0;
  skills.forEach((skill) => {
    if (lowerCV.includes(skill.toLowerCase())) {
      foundSkills++;
      highlights.push(`Skill matched: ${skill}`);
    }
  });
  skillsMatch = Math.round((foundSkills / skills.length) * 100);

  // Optional skills
  optionalSkills.forEach((skill) => {
    if (lowerCV.includes(skill.toLowerCase())) {
      highlights.push(`Optional skill matched: ${skill}`);
    }
  });

  // Experience (very basic: look for years)
  const expMatch = lowerCV.match(/(\d+)\s+years?/);
  if (expMatch) {
    const years = parseInt(expMatch[1], 10);
    experienceMatch = Math.min(
      100,
      Math.round((years / (jobProfile.minExperience || 1)) * 100)
    );
    highlights.push(`Experience found: ${years} years`);
  } else {
    experienceMatch = 30;
  }

  // Education (very basic)
  if (/bachelor|master|phd|degree/.test(lowerCV)) {
    educationMatch = 100;
    highlights.push("Degree found");
  }

  // Weighted final score
  const weights = jobProfile.weights || {
    skills: 1,
    experience: 1,
    education: 1,
  };
  const totalWeight = weights.skills + weights.experience + weights.education;
  const finalScore = Math.round(
    (skillsMatch * weights.skills +
      experienceMatch * weights.experience +
      educationMatch * weights.education) /
      totalWeight
  );

  return {
    skillsMatch,
    experienceMatch,
    educationMatch,
    finalScore,
    highlights,
  };
}

module.exports = { scoreCV };
