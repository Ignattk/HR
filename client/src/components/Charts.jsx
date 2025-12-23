import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ jobs, candidates }) => {
  // Candidates per stage
  const stages = ["Draft", "Interview", "Rejected"];
  const candidatesPerStage = stages.map(
    (stage) => candidates.filter((c) => c.stage === stage).length
  );

  const stageChartData = {
    labels: stages,
    datasets: [
      {
        label: "Candidates",
        data: candidatesPerStage,
        backgroundColor: ["#93c5fd", "#2563eb", "#1d4ed8"],
        borderWidth: 0,
      },
    ],
  };

  // Average score per job
  const avgScorePerJob = jobs.map((job) => {
    const jobCandidates = candidates.filter((c) => c.jobId === job.id);
    if (jobCandidates.length === 0) return 0;
    return Math.round(
      jobCandidates.reduce((sum, c) => sum + c.score, 0) / jobCandidates.length
    );
  });

  const scoreChartData = {
    labels: jobs.map((j) => j.title),
    datasets: [
      {
        label: "Average Score",
        data: avgScorePerJob,
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        tension: 0.1,
        fill: false,
      },
    ],
  };

  // Skills coverage - aggregate all required skills across jobs
  const allSkills = [...new Set(jobs.flatMap((j) => j.requiredSkills))];
  const skillsCoverage = allSkills.map((skill) => {
    const candidatesWithSkill = candidates.filter((c) =>
      c.skills?.includes(skill)
    ).length;
    return candidatesWithSkill;
  });

  const skillsChartData = {
    labels: allSkills,
    datasets: [
      {
        label: "Candidates with Skill",
        data: skillsCoverage,
        backgroundColor: "#6B7280",
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.25)",
        },
        ticks: { color: "#cbd5e1" },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: { color: "#cbd5e1" },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        max: 100,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="glass-panel panel-3d rounded-2xl p-5 border border-[color:var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Candidates per Stage</h3>
          <span className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Pipeline</span>
        </div>
        <div className="h-48">
          <Bar data={stageChartData} options={chartOptions} />
        </div>
      </div>

      <div className="glass-panel panel-3d rounded-2xl p-5 border border-[color:var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Average Score per Job</h3>
          <span className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Quality</span>
        </div>
        <div className="h-48">
          <Line data={scoreChartData} options={lineChartOptions} />
        </div>
      </div>

      <div className="glass-panel panel-3d rounded-2xl p-5 border border-[color:var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Skills Coverage</h3>
          <span className="text-[11px] text-[var(--muted)] uppercase tracking-wide">Supply</span>
        </div>
        <div className="h-48">
          <Bar data={skillsChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
