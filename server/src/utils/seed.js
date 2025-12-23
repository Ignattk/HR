require("dotenv").config();
const mongoose = require("mongoose");
const Job = require("../models/Job");
const Candidate = require("../models/Candidate");

const jobs = [
  {
    title: "Frontend Developer",
    normalizedTitle: "frontend developer",
    description: "Develop and maintain web applications.",
    skills: {
      required: ["JavaScript", "React", "HTML", "CSS"],
      optional: ["Redux", "TypeScript"],
    },
    minExperience: 2,
    weights: { skills: 2, experience: 1, education: 1 },
    createdBy: new mongoose.Types.ObjectId(),
  },
  {
    title: "Backend Developer",
    normalizedTitle: "backend developer",
    description: "Build and maintain server-side logic.",
    skills: {
      required: ["Node.js", "Express", "MongoDB"],
      optional: ["Docker", "Redis"],
    },
    minExperience: 3,
    weights: { skills: 2, experience: 2, education: 1 },
    createdBy: new mongoose.Types.ObjectId(),
  },
];

const candidates = [
  {
    name: "Alice Smith",
    email: "alice@example.com",
    jobTitle: "Frontend Developer",
    score: 85,
    scoreBreakdown: { skills: 90, experience: 80, education: 85 },
    stage: "DRAFT",
    cvUrl: "/uploads/alice-smith.pdf",
    highlights: ["Strong React skills", "Good CSS knowledge"],
  },
  {
    name: "Bob Johnson",
    email: "bob@example.com",
    jobTitle: "Backend Developer",
    score: 78,
    scoreBreakdown: { skills: 80, experience: 75, education: 70 },
    stage: "INTERVIEW",
    cvUrl: "/uploads/bob-johnson.pdf",
    highlights: ["Node.js expert", "Experience with MongoDB"],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Job.deleteMany();
  await Candidate.deleteMany();
  const jobDocs = await Job.insertMany(jobs);
  candidates[0].jobId = jobDocs[0]._id;
  candidates[1].jobId = jobDocs[1]._id;
  await Candidate.insertMany(candidates);
  console.log("Seed data inserted");
  await mongoose.disconnect();
}

seed();
