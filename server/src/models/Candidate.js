const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  jobTitle: { type: String, required: true },
  score: { type: Number },
  scoreBreakdown: {
    skills: { type: Number },
    experience: { type: Number },
    education: { type: Number },
  },
  stage: {
    type: String,
    enum: ["DRAFT", "INTERVIEW", "REJECTED"],
    default: "DRAFT",
  },
  cvUrl: { type: String },
  highlights: [{ type: String }],
  skills: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Candidate", CandidateSchema);
