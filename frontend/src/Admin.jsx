import { useState, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, Plus, Trash2, Save, X as XIcon, Lock, AlertCircle } from "lucide-react";
import "./Admin.css";

import { API_BASE } from "./config";

function AdminLogin({ onAuthenticated }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleLogin = () => {
    setChecking(true);
    setError(null);
    axios
      .get(`${API_BASE}/api/admin/questions`, { headers: { "x-admin-key": key } })
      .then(() => {
        localStorage.setItem("ga4_admin_key", key);
        onAuthenticated(key);
      })
      .catch(() => setError("Incorrect admin key."))
      .finally(() => setChecking(false));
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-box">
        <div className="admin-login-icon">
          <Lock size={22} />
        </div>
        <h2>Admin access</h2>
        <p>Enter the admin key to manage audit questions.</p>
        {error && (
          <div className="admin-inline-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Admin key"
          className="admin-key-input"
        />
        <button className="admin-btn-primary" onClick={handleLogin} disabled={!key || checking}>
          {checking ? "Checking..." : "Unlock"}
        </button>
      </div>
    </div>
  );
}

function QuestionEditor({ question, onSave, onCancel }) {
  const [form, setForm] = useState({ ...question });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="admin-editor-card">
      <label className="admin-field-label">Question text</label>
      <textarea
        className="admin-textarea"
        value={form.text}
        onChange={(e) => update("text", e.target.value)}
        rows={2}
      />

      <div className="admin-field-row">
        <div>
          <label className="admin-field-label">Category</label>
          <input className="admin-input" value={form.category} onChange={(e) => update("category", e.target.value)} />
        </div>
        <div>
          <label className="admin-field-label">Severity</label>
          <select
            className="admin-input"
            value={form.severity}
            onChange={(e) => update("severity", e.target.value)}
          >
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
          </select>
        </div>
        <div>
          <label className="admin-field-label">Weight</label>
          <input
            type="number"
            className="admin-input"
            value={form.weight}
            onChange={(e) => update("weight", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <label className="admin-field-label">Why it matters</label>
      <textarea className="admin-textarea" value={form.why} onChange={(e) => update("why", e.target.value)} rows={2} />

      <label className="admin-field-label">How to fix</label>
      <textarea className="admin-textarea" value={form.fix} onChange={(e) => update("fix", e.target.value)} rows={2} />

      <div className="admin-editor-actions">
        <button className="admin-btn-ghost" onClick={onCancel}>
          <XIcon size={14} /> Cancel
        </button>
        <button className="admin-btn-primary" onClick={() => onSave(form)}>
          <Save size={14} /> Save
        </button>
      </div>
    </div>
  );
}

function AdminPanel({ adminKey, onLogout, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState(null);

  const headers = { "x-admin-key": adminKey };

  const fetchQuestions = () => {
    setLoading(true);
    axios
      .get(`${API_BASE}/api/admin/questions`, { headers })
      .then((res) => setQuestions(res.data))
      .catch(() => {
        localStorage.removeItem("ga4_admin_key");
        onLogout();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleUpdate = (form) => {
    setActionError(null);
    axios
      .put(`${API_BASE}/api/admin/questions/${form.id}`, form, { headers })
      .then(() => {
        setEditingId(null);
        fetchQuestions();
      })
      .catch(() => setActionError("Failed to save changes."));
  };

  const handleCreate = (form) => {
    setActionError(null);
    axios
      .post(`${API_BASE}/api/admin/questions`, form, { headers })
      .then(() => {
        setCreating(false);
        fetchQuestions();
      })
      .catch((err) => {
        setActionError(err.response?.data?.detail || "Failed to create question.");
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    axios
      .delete(`${API_BASE}/api/admin/questions/${id}`, { headers })
      .then(() => fetchQuestions())
      .catch(() => setActionError("Failed to delete question."));
  };

  const blankQuestion = {
    id: "",
    text: "",
    category: "Basic Setup",
    severity: "Critical",
    weight: 10,
    why: "",
    fix: "",
    order_index: questions.length,
  };

  const grouped = {};
  questions.forEach((q) => {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  });

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <button className="admin-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to audit
        </button>
        <span className="admin-eyebrow">ADMIN</span>
        <h1>Manage audit questions</h1>
        <p className="admin-subtitle">{questions.length} questions configured</p>
      </div>

      <div className="admin-floating-card">
        {actionError && (
          <div className="admin-inline-error admin-banner-error">
            <AlertCircle size={14} />
            {actionError}
          </div>
        )}

        {loading && <p className="admin-status-text">Loading questions...</p>}

        {!loading && (
          <>
            <div className="admin-toolbar">
              <button className="admin-btn-primary" onClick={() => setCreating(true)}>
                <Plus size={14} /> Add question
              </button>
            </div>

            {creating && (
              <QuestionEditor
                question={blankQuestion}
                onSave={handleCreate}
                onCancel={() => setCreating(false)}
              />
            )}

            {Object.entries(grouped).map(([category, qs]) => (
              <div key={category} className="admin-category-group">
                <h3 className="admin-category-heading">{category}</h3>
                {qs.map((q) =>
                  editingId === q.id ? (
                    <QuestionEditor
                      key={q.id}
                      question={q}
                      onSave={handleUpdate}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div key={q.id} className="admin-question-row">
                      <div className="admin-question-main">
                        <span className={`admin-severity-badge sev-${q.severity.toLowerCase()}`}>
                          {q.severity} · {q.weight}pt
                        </span>
                        <p>{q.text}</p>
                      </div>
                      <div className="admin-row-actions">
                        <button className="admin-icon-btn" onClick={() => setEditingId(q.id)}>
                          Edit
                        </button>
                        <button className="admin-icon-btn admin-danger" onClick={() => handleDelete(q.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Admin({ onBack }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem("ga4_admin_key"));

  if (!adminKey) {
    return <AdminLogin onAuthenticated={setAdminKey} />;
  }

  return (
    <AdminPanel
      adminKey={adminKey}
      onBack={onBack}
      onLogout={() => setAdminKey(null)}
    />
  );
}

export default Admin;
