import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronDown, RotateCcw, Download } from "lucide-react";
import { generateAuditPdf } from "./generatePdf";
import "./Dashboard.css";

const BAND_COLORS = {
  Healthy: "#16A34A",
  "Needs Attention": "#D97706",
  Critical: "#DC2626",
};

function ScoreGauge({ score, band }) {
  const color = BAND_COLORS[band] || "#666";
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="dash-gauge-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#EAF0FF" strokeWidth="12" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="76" textAnchor="middle" fontSize="32" fontWeight="700" fill="#111827" fontFamily="Poppins">
          {score}
        </text>
        <text x="80" y="98" textAnchor="middle" fontSize="12" fill="#6B7280">
          out of 100
        </text>
      </svg>
      <div className="dash-band-pill" style={{ background: `${color}1A`, color }}>
        {band}
      </div>
    </div>
  );
}

function IssueRow({ issue }) {
  const [expanded, setExpanded] = useState(false);
  const color = BAND_COLORS[issue.status] || (issue.status === "Passed" ? "#16A34A" : "#666");

  return (
    <div className={`dash-issue-row ${expanded ? "expanded" : ""}`} onClick={() => setExpanded((e) => !e)}>
      <div className="dash-issue-row-top">
        <span className="dash-issue-dot" style={{ background: color }} />
        <span className="dash-issue-row-text">{issue.text}</span>
        <span className="dash-issue-badge" style={{ background: `${color}1A`, color }}>
          {issue.status}
        </span>
        {issue.status !== "Passed" && (
          <ChevronDown size={16} className="dash-chevron" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
        )}
      </div>
      {expanded && issue.status !== "Passed" && (
        <div className="dash-issue-row-details">
          <p><strong>Why it matters —</strong> {issue.why}</p>
          <p><strong>How to fix —</strong> {issue.fix}</p>
        </div>
      )}
    </div>
  );
}

function Dashboard({ result, onRestart }) {
  const { health_score, band, critical_count, warning_count, passed_count, category_breakdown, issues } = result;
  const statusOrder = { Critical: 0, Warning: 1, Passed: 2 };
  const sortedIssues = [...issues].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  const bandMessage = {
    Healthy: "Your GA4 setup is in strong shape. A few polish items remain.",
    "Needs Attention": "Your setup works, but several gaps are costing you data quality.",
    Critical: "Your setup has serious gaps affecting data accuracy right now.",
  }[band];

  return (
    <div className="dash-page">
      <div className="dash-hero">
        <span className="dash-eyebrow">AUDIT COMPLETE</span>
        <h1>Your GA4 health score</h1>
        <p className="dash-hero-subtitle">{bandMessage}</p>
      </div>

      <div className="dash-floating-card dash-summary-card">
        <div className="dash-sidebar-panel dash-gauge-panel">
          <ScoreGauge score={health_score} band={band} />
          <div className="dash-counts-row">
            <div className="dash-count-item">
              <span className="dash-count-num" style={{ color: BAND_COLORS.Critical }}>{critical_count}</span>
              <span className="dash-count-lbl">Critical</span>
            </div>
            <div className="dash-count-item">
              <span className="dash-count-num" style={{ color: BAND_COLORS["Needs Attention"] }}>{warning_count}</span>
              <span className="dash-count-lbl">Warning</span>
            </div>
            <div className="dash-count-item">
              <span className="dash-count-num" style={{ color: BAND_COLORS.Healthy }}>{passed_count}</span>
              <span className="dash-count-lbl">Passed</span>
            </div>
          </div>
        </div>

        <div className="dash-form-panel">
          <div className="dash-panel-header-row">
            <h3 className="dash-panel-title">Score by category</h3>
            <button className="dash-btn-download" onClick={() => generateAuditPdf(result)}>
              <Download size={14} />
              Download PDF
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={category_breakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EAF0FF" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: "#6B7280" }} />
              <YAxis type="category" dataKey="category" width={150} tick={{ fontSize: 12, fill: "#111827" }} />
              <Tooltip />
              <Bar dataKey="score" fill="#2954FF" radius={[0, 8, 8, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dash-floating-card dash-issues-card">
        <div className="dash-issues-panel">
          <h3 className="dash-panel-title">Detailed findings</h3>
          <p className="dash-hint-text">Click an item to see why it matters and how to fix it.</p>
          <div className="dash-issue-list">
            {sortedIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      </div>

      <div className="dash-footer-strip">
        <button className="dash-btn-primary" onClick={onRestart}>
          <RotateCcw size={15} style={{ marginRight: 8, verticalAlign: -2 }} />
          Start new audit
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
