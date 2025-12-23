import { useState } from "react";

const CandidateModal = ({ candidate, onClose }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-300";
    if (score >= 60) return "text-amber-300";
    return "text-red-300";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-panel w-full max-w-lg mx-4 rounded-2xl border border-[color:var(--border)]">
        <div className="border-b border-[color:var(--border)] px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--text)]">Candidate Details</h2>
          <button
            onClick={onClose}
            className="text-[var(--muted)] hover:text-[var(--text)] text-xl"
          >
            x
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Name</p>
              <p className="text-sm font-medium text-[var(--text)]">{candidate.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Email</p>
              <p className="text-sm text-[var(--text)]">{candidate.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Score</p>
              <p className={`text-sm font-semibold ${getScoreColor(candidate.score)}`}>
                {candidate.score}/100
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Stage</p>
              <p className="text-sm text-[var(--text)]">{candidate.stage}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {candidate.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-[11px] bg-[color:var(--surface)] text-[var(--text)] border border-[color:var(--border)] rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-wide mb-2">AI Highlights</p>
            <ul className="text-sm text-[var(--text)] space-y-1">
              {candidate.highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2 text-[color:var(--accent)]">-</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[color:var(--border)] px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-[color:var(--accent)]/25 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CandidateTable = ({ candidates, onUpdateStage }) => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const stages = ["Draft", "Interview", "Rejected"];

  const getStageColor = (stage) => {
    switch (stage) {
      case "Draft":
        return "bg-white/5 text-slate-200 border border-white/10";
      case "Interview":
        return "bg-sky-500/15 text-sky-200 border border-sky-400/40";
      case "Rejected":
        return "bg-red-500/10 text-red-200 border border-red-500/40";
      default:
        return "bg-white/5 text-slate-200 border border-white/10";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (candidates.length === 0) {
    return (
      <div className="bg-[color:var(--surface)] border border-[color:var(--border)] p-8 text-center rounded-xl">
        <p className="text-[var(--muted)]">No candidates for this job yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] overflow-hidden rounded-xl shadow-xl">
      <table className="w-full">
        <thead className="bg-[color:var(--surface-2)] border-b border-[color:var(--border)]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              Score
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              Stage
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              AI Highlights
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-[0.14em]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--border)]">
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="hover:bg-[color:var(--surface-2)] transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">
                <div className="flex items-center gap-2">
                  <span>{candidate.name}</span>
                  <button
                    onClick={() => setSelectedCandidate(candidate)}
                    className="px-2 py-1 text-[11px] btn-ghost rounded-md"
                  >
                    View
                  </button>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-[var(--muted)]">{candidate.email}</td>
              <td className={`px-4 py-3 text-sm font-semibold ${getScoreColor(candidate.score)}`}>
                {candidate.score}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium ${getStageColor(candidate.stage)}`}>
                  {candidate.stage}
                </span>
              </td>
              <td className="px-4 py-3">
                <ul className="text-xs text-[var(--muted)] space-y-1">
                  {candidate.highlights.slice(0, 2).map((highlight, idx) => (
                    <li key={idx}>- {highlight}</li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {stages.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => onUpdateStage(candidate.id, stage)}
                      disabled={candidate.stage === stage}
                      className={`px-2.5 py-1 text-[11px] border rounded-md transition-colors ${
                        candidate.stage === stage
                          ? "bg-[color:var(--surface-2)] text-[var(--muted)] border-[color:var(--border)] cursor-not-allowed"
                          : "btn-ghost hover:-translate-y-[1px]"
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
};

export default CandidateTable;
