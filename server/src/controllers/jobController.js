const Job = require("../models/Job");

exports.createJob = async (req, res) => {
  try {
    const { title, description, skills, minExperience, weights, createdBy } =
      req.body;
    if (
      !title ||
      typeof title !== "string" ||
      !description ||
      typeof description !== "string" ||
      !skills ||
      typeof skills !== "object" ||
      !Array.isArray(skills.required) ||
      !Array.isArray(skills.optional) ||
      typeof minExperience !== "number" ||
      !createdBy
    ) {
      return res
        .status(400)
        .json({ error: "Invalid or missing required fields" });
    }
    const normalizedTitle = title.trim().toLowerCase();
    const job = new Job({
      title,
      normalizedTitle,
      description,
      skills,
      minExperience,
      weights,
      createdBy,
    });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
