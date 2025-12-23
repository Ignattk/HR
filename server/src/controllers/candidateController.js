const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const { scoreCV } = require("../utils/ai");
const parseCV = require("../utils/parseCV");
const path = require("path");
const fs = require("fs");
const { sendStatusEmail } = require("../services/emailService");

// POST /candidates/upload
exports.uploadCandidate = async (req, res) => {
  try {
    const { name, email, jobTitle } = req.body;
    if (
      !req.file ||
      !name ||
      typeof name !== "string" ||
      !email ||
      typeof email !== "string" ||
      !jobTitle ||
      typeof jobTitle !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields or file" });
    }
    const normalizedTitle = jobTitle.trim().toLowerCase();
    const job = await Job.findOne({ normalizedTitle });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const cvPath = req.file.path;
    const cvText = await parseCV(cvPath);
    const aiResult = await scoreCV(cvText, job);

    const candidate = new Candidate({
      name,
      email,
      jobId: job._id,
      jobTitle: job.title,
      score: aiResult.finalScore,
      scoreBreakdown: {
        skills: aiResult.skillsMatch,
        experience: aiResult.experienceMatch,
        education: aiResult.educationMatch,
      },
      stage: "DRAFT",
      cvUrl: `/uploads/${path.basename(cvPath)}`,
      highlights: aiResult.highlights,
    });
    await candidate.save();
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /jobs/:jobId/candidates
exports.getCandidatesByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidates = await Candidate.find({ jobId });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /candidates/:id
exports.updateCandidateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    if (!["DRAFT", "INTERVIEW", "REJECTED"].includes(stage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }
    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { stage },
      { new: true }
    );
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /candidates/:id/status - update stage and notify candidate
exports.updateCandidateStatusAndNotify = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    if (!["DRAFT", "INTERVIEW", "REJECTED"].includes(stage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      { stage },
      { new: true }
    );
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    try {
      await sendStatusEmail(candidate.email, stage, candidate.name);
    } catch (notifyErr) {
      console.error("Failed to send status email:", notifyErr);
      // Do not fail the main request because of email issues
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /candidates/:id
exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByIdAndDelete(id);
    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });
    // Optionally delete file
    if (candidate.cvUrl) {
      const filePath = path.join(__dirname, "../../", candidate.cvUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /candidates/:id/cv
exports.downloadCV = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findById(id);
    if (!candidate || !candidate.cvUrl)
      return res.status(404).json({ error: "CV not found" });
    const filePath = path.join(__dirname, "../../", candidate.cvUrl);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ error: "File not found" });
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /candidates/n8n - For n8n webhook to submit candidate data
exports.createCandidateFromN8n = async (req, res) => {
  try {
    const {
      name,
      email,
      jobTitle,
      score,
      scoreBreakdown,
      highlights,
      skills,
      cvUrl,
    } = req.body;

    if (!name || !email || !jobTitle) {
      return res.status(400).json({
        error: "Missing required fields: name, email, jobTitle",
      });
    }

    // Find job by normalized title
    const normalizedTitle = jobTitle.trim().toLowerCase();
    let job = await Job.findOne({ normalizedTitle });

    if (!job) {
      return res.status(404).json({
        error: `Job not found with title: ${jobTitle}`,
      });
    }

    const candidate = new Candidate({
      name,
      email,
      jobId: job._id,
      jobTitle: job.title,
      score: score || 0,
      scoreBreakdown: scoreBreakdown || {
        skills: 0,
        experience: 0,
        education: 0,
      },
      stage: "DRAFT",
      cvUrl: cvUrl || null,
      highlights: highlights || [],
      skills: skills || [],
    });

    await candidate.save();
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /candidates - Get all candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
