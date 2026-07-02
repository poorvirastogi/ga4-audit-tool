import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowLeft, Calendar, ChevronRight } from "lucide-react";
import "./PastAudits.css";

import { API_BASE } from "./config";

const BAND_COLORS = {
  Healthy: "#16A34A",
  "Needs Attention": "#D97706",
  Critical: "#DC2626",
};

function PastAudits({ onBack, onSelectAudit }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/audits?limit=50`)
      .then((res) => setAudits(res.data))
      .catch(() => setError("Couldn't load past audits."))
      .finally(() => setLoading(false));
  }, []);

  const trendData = [...audits]
    .reverse()
    .map((a, i) => ({
      name: `#${i + 1}`,
      score: a.health_score,
      date: new Date(a.created_at).toLocaleDateString(),
    }));

  return (
    <div className="past-page">
      <div className="past-hero">
        <button className="past-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to audit
        </button>
        <span className="past-eyebrow">AUDIT HISTORY</span>
        <h1>Past audits</h1>
        <p className="past-subtitle">
          {audits.length} audit{audits.length !== 1 ? "s" : ""} recorded so far
        </p>
      </div>

      <div className="past-floating-card">
        {loading && <p className="past-status-text">Loading history...</p>}
        {error && <p className="past-status-text past-error">{error}</p>}

        {!loading && !error && audits.length === 0 && (
          <p className="past-status-text">
            No audits submitted yet. Complete one from the main form to see it here.
          </p>
        )}

        {!loading && !error && audits.length > 1 && (
          <div className="past-trend-section">
            <h3 className="past-panel-title">Score trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData} margin={{ left: 0, right: 20, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF0FF" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip
                  formatter={(value) => [`${value}/100`, "Score"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                />
                <Line type="monotone" dataKey="score" stroke="#2954FF" strokeWidth={2.5} dot={{ r: 4, fill: "#2954FF" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && !error && audits.length > 0 && (
          <div className="past-list-section">
            <h3 className="past-panel-title">All audits</h3>
            <div className="past-list">
              {audits.map((audit) => {
                const color = BAND_COLORS[audit.band] || "#666";
                return (
                  <div key={audit.id} className="past-row" onClick={() => onSelectAudit(audit)}>
                    <div className="past-row-left">
                      <div className="past-score-chip" style={{ background: `${color}1A`, color }}>
                        {audit.health_score}
                      </div>
                      <div>
                        <div className="past-row-band" style={{ color }}>
                          {audit.band}
                        </div>
                        <div className="past-row-date">
                          <Calendar size={12} />
                          {new Date(audit.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="past-row-right">
                      <span className="past-counts">
                        {audit.critical_count} critical · {audit.warning_count} warning
                      </span>
                      <ChevronRight size={16} color="#9CA3AF" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PastAudits;
