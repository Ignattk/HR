import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CandidateTable from "./components/CandidateTable";
import Charts from "./components/Charts";
import JobForm from "./components/JobForm";
import {
  getJobs,
  createJob as createJobAPI,
  getAllCandidates,
  updateCandidateStage as updateCandidateStageAPI,
  transformJob,
  transformCandidate,
} from "./api";

const App = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [stageFilter, setStageFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState("All");
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch jobs and candidates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [jobsData, candidatesData] = await Promise.all([
          getJobs(),
          getAllCandidates(),
        ]);

        const transformedJobs = jobsData.map(transformJob);
        const transformedCandidates = candidatesData.map(transformCandidate);

        setJobs(transformedJobs);
        setCandidates(transformedCandidates);

        // Select first job if available
        if (transformedJobs.length > 0 && !selectedJobId) {
          setSelectedJobId(transformedJobs[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selectedJobId when jobs are loaded
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);
  
  // Refresh candidates after creating a job or updating stage
  const refreshCandidates = async () => {
    try {
      const candidatesData = await getAllCandidates();
      const transformedCandidates = candidatesData.map(transformCandidate);
      setCandidates(transformedCandidates);
    } catch (err) {
      console.error("Error refreshing candidates:", err);
    }
  };

  const filteredCandidates = candidates
    .filter((c) => c.jobId === selectedJobId)
    .filter((c) => stageFilter === "All" || c.stage === stageFilter)
    .filter((c) => {
      if (scoreFilter === "All") return true;
      if (scoreFilter === "High") return c.score >= 80;
      if (scoreFilter === "Medium") return c.score >= 60 && c.score < 80;
      if (scoreFilter === "Low") return c.score < 60;
      return true;
    });

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const handleSelectJob = (jobId) => {
    setSelectedJobId(jobId);
  };

  const handleCreateJob = () => {
    setShowJobForm(true);
  };

  const handleSubmitJob = async (newJob) => {
    try {
      setError(null);
      const createdJob = await createJobAPI(newJob);
      const transformedJob = transformJob(createdJob);
      setJobs((prev) => [...prev, transformedJob]);
      setSelectedJobId(transformedJob.id);
      setShowJobForm(false);
      // Refresh candidates in case any were associated with this job
      await refreshCandidates();
    } catch (err) {
      console.error("Error creating job:", err);
      setError(err.response?.data?.error || err.message || "Failed to create job");
    }
  };

  const handleUpdateStage = async (candidateId, newStage) => {
    try {
      setError(null);
      const updatedCandidate = await updateCandidateStageAPI(
        candidateId,
        newStage
      );
      const transformedCandidate = transformCandidate(updatedCandidate);
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? transformedCandidate : c
        )
      );
    } catch (err) {
      console.error("Error updating candidate stage:", err);
      setError(err.response?.data?.error || err.message || "Failed to update candidate stage");
    }
  };


  const themeClass = isDark ? "theme-dark" : "theme-light";

  if (loading) {
    return (
      <div className={`${themeClass} min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-lg text-[var(--text)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className={`${themeClass} min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-lg text-red-400">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${themeClass} min-h-screen bg-[var(--bg)] text-[var(--text)]`}>
      <div className="flex h-screen">
        <Sidebar
          jobs={jobs}
          candidates={candidates}
          selectedJobId={selectedJobId}
          onSelectJob={handleSelectJob}
          onCreateJob={handleCreateJob}
        />

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              {error && (
                <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={() => setIsDark((prev) => !prev)}
                className="px-3 py-1.5 text-sm rounded-lg btn-ghost ml-auto"
              >
                {isDark ? "Light Mode" : "Dark Mode"}
              </button>
            </div>

            {selectedJob ? (
              <div className="glass-panel panel-3d rounded-2xl p-6 border border-[var(--border)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Current Role
                    </p>
                    <h2 className="text-2xl font-semibold text-[var(--text)] mt-1">
                      {selectedJob.title}
                    </h2>
                    <p className="text-sm text-[var(--muted)] mt-2 max-w-3xl">
                      {selectedJob.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--muted)]">
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                        Min Exp: {selectedJob.minExperience} yrs
                      </span>
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                        Required: {selectedJob.requiredSkills.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-2">
                    <div className="accent-bar w-32" />
                    <p className="text-xs text-[var(--muted)]">Serious talent pipeline</p>
                  </div>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="glass-panel panel-3d rounded-2xl p-6 border border-[var(--border)] text-center">
                <p className="text-[var(--muted)]">No jobs available. Create your first job to get started.</p>
              </div>
            ) : null}

            <Charts jobs={jobs} candidates={candidates} />

            <div className="glass-panel panel-3d rounded-2xl p-6 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-[0.14em]">
                  Candidates ({filteredCandidates.length})
                </h3>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)]">Stage:</label>
                    <select
                      value={stageFilter}
                      onChange={(e) => setStageFilter(e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="All">All</option>
                      <option value="Draft">Draft</option>
                      <option value="Interview">Interview</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--muted)]">Score:</label>
                    <select
                      value={scoreFilter}
                      onChange={(e) => setScoreFilter(e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="All">All</option>
                      <option value="High">High (80+)</option>
                      <option value="Medium">Medium (60-79)</option>
                      <option value="Low">Low (0-59)</option>
                    </select>
                  </div>
                </div>
              </div>
              <CandidateTable
                candidates={filteredCandidates}
                onUpdateStage={handleUpdateStage}
              />
            </div>
          </div>
        </main>

        {showJobForm && (
          <JobForm
            onSubmit={handleSubmitJob}
            onCancel={() => setShowJobForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;