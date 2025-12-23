const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  normalizedTitle: { type: String, required: true },
  description: { type: String, required: true },
  skills: {
    required: [{ type: String }],
    optional: [{ type: String }],
  },
  minExperience: { type: Number, required: true },
  weights: {
    skills: { type: Number, default: 1 },
    experience: { type: Number, default: 1 },
    education: { type: Number, default: 1 },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", JobSchema);
