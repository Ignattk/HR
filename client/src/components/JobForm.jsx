import { useState } from "react";

const JobForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    optionalSkills: "",
    minExperience: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newJob = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      requiredSkills: formData.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      optionalSkills: formData.optionalSkills.split(",").map((s) => s.trim()).filter(Boolean),
      minExperience: parseInt(formData.minExperience) || 0,
    };

    onSubmit(newJob);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass-panel w-full max-w-lg mx-4 rounded-2xl border border-[color:var(--border)]">
        <div className="border-b border-[color:var(--border)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text)]">Create New Job</h2>
          <span className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Serious Mode</span>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[color:var(--accent)]"
              placeholder="e.g. Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Job Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[color:var(--accent)] resize-none"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Required Skills
            </label>
            <input
              type="text"
              name="requiredSkills"
              value={formData.requiredSkills}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[color:var(--accent)]"
              placeholder="e.g. React, JavaScript, CSS (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Optional Skills
            </label>
            <input
              type="text"
              name="optionalSkills"
              value={formData.optionalSkills}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[color:var(--accent)]"
              placeholder="e.g. TypeScript, Tailwind (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1">
              Minimum Experience (years)
            </label>
            <input
              type="number"
              name="minExperience"
              value={formData.minExperience}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 rounded-lg bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[var(--text)] focus:outline-none focus:border-[color:var(--accent)]"
              placeholder="e.g. 2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:shadow-[color:var(--accent)]/25 transition-all"
            >
              Create Job
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg btn-ghost text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
