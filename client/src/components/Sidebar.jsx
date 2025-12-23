const Sidebar = ({ jobs, candidates, selectedJobId, onSelectJob, onCreateJob }) => {
  const getCandidateCount = (jobId) => candidates.filter((c) => c.jobId === jobId).length;

  return (
    <aside className="w-72 min-w-72 glass-panel panel-3d h-screen flex flex-col border-r border-[var(--border)]">
      <div className="p-5 border-b border-[var(--border)]">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Control Room</p>
        <h1 className="text-2xl font-semibold text-[var(--text)] mt-1">HR Dashboard</h1>
      </div>
      <div className="p-5 overflow-y-auto">
        <h2 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.18em] mb-4">
          Jobs
        </h2>
        <button
          onClick={onCreateJob}
          className="w-full mb-5 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        >
          + Create Job
        </button>
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              onClick={() => onSelectJob(job.id)}
              className={`p-4 cursor-pointer rounded-lg border transition-all ${
                selectedJobId === job.id
                  ? "border-[var(--accent)] bg-[var(--surface)] shadow-md"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/60"
              }`}
            >
              <p className="font-medium text-[var(--text)]">{job.title}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {getCandidateCount(job.id)} candidates
              </p>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
