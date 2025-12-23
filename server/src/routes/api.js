const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

const candidateController = require("../controllers/candidateController");
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");

// Example route
router.get("/status", (req, res) => {
  res.json({ status: "API is working!" });
});

// Job endpoints
router.post("/jobs", jobController.createJob);
router.get("/jobs", jobController.getJobs);

// Candidate endpoints
router.get("/candidates", candidateController.getAllCandidates);
router.get("/jobs/:jobId/candidates", candidateController.getCandidatesByJob);
router.post(
  "/candidates/upload",
  auth,
  upload.single("cv"),
  candidateController.uploadCandidate
);
router.post("/candidates/n8n", candidateController.createCandidateFromN8n);
router.patch("/candidates/:id", candidateController.updateCandidateStage);
router.patch(
  "/candidates/:id/status",
  candidateController.updateCandidateStatusAndNotify
);
router.delete("/candidates/:id", candidateController.deleteCandidate);
router.get("/candidates/:id/cv", candidateController.downloadCV);

module.exports = router;
