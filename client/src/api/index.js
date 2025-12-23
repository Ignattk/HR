import api from "./axios";

const handleApiError = (label, error) => {
  console.error(`${label} failed:`, error?.response?.data || error?.message || error);
  throw error;
};

// Jobs API
export const getJobs = async () => {
  try {
    const response = await api.get("/jobs");
    return response.data;
  } catch (error) {
    handleApiError("getJobs", error);
  }
};

export const createJob = async (jobData) => {
  try {
    // Transform frontend format to backend format
    const backendJobData = {
      title: jobData.title,
      description: jobData.description,
      skills: {
        required: jobData.requiredSkills || [],
        optional: jobData.optionalSkills || [],
      },
      minExperience: jobData.minExperience || 0,
      createdBy: "000000000000000000000000", // Placeholder - should be replaced with actual user ID
    };
    const response = await api.post("/jobs", backendJobData);
    return response.data;
  } catch (error) {
    handleApiError("createJob", error);
  }
};

// Candidates API
export const getAllCandidates = async () => {
  try {
    const response = await api.get("/candidates");
    return response.data;
  } catch (error) {
    handleApiError("getAllCandidates", error);
  }
};

export const getCandidatesByJob = async (jobId) => {
  try {
    const response = await api.get(`/jobs/${jobId}/candidates`);
    return response.data;
  } catch (error) {
    handleApiError("getCandidatesByJob", error);
  }
};

export const updateCandidateStatus = async (candidateId, stage) => {
  try {
    // Transform frontend stage format to backend format
    const stageMap = {
      Draft: "DRAFT",
      Interview: "INTERVIEW",
      Rejected: "REJECTED",
    };
    const backendStage = stageMap[stage] || stage.toUpperCase();
    const response = await api.patch(`/candidates/${candidateId}/status`, {
      stage: backendStage,
    });
    return response.data;
  } catch (error) {
    handleApiError("updateCandidateStatus", error);
  }
};

// Data transformation helpers
export const transformJob = (backendJob) => {
  return {
    id: (backendJob._id || backendJob.id).toString(),
    title: backendJob.title,
    description: backendJob.description,
    requiredSkills: backendJob.skills?.required || [],
    optionalSkills: backendJob.skills?.optional || [],
    minExperience: backendJob.minExperience || 0,
  };
};

export const transformCandidate = (backendCandidate) => {
  // Transform backend stage format to frontend format
  const stageMap = {
    DRAFT: "Draft",
    INTERVIEW: "Interview",
    REJECTED: "Rejected",
  };
  
  // Handle jobId - it can be an ObjectId string, populated object with _id, or the id itself
  let jobId = backendCandidate.jobId;
  if (jobId && typeof jobId === 'object' && jobId._id) {
    jobId = jobId._id.toString();
  } else if (jobId) {
    jobId = jobId.toString();
  }
  
  return {
    id: (backendCandidate._id || backendCandidate.id).toString(),
    jobId: jobId,
    name: backendCandidate.name,
    email: backendCandidate.email,
    score: backendCandidate.score || 0,
    stage: stageMap[backendCandidate.stage] || backendCandidate.stage || "Draft",
    highlights: backendCandidate.highlights || [],
    skills: backendCandidate.skills || [],
    cvUrl: backendCandidate.cvUrl,
  };
};

export { default as api } from "./axios";
