import { useState, useEffect } from "react";
import axios from "axios";
import { Settings, BarChart3, SlidersHorizontal, Lock, Check, Minus, X, RefreshCw, AlertCircle, History, ShieldCheck } from "lucide-react";
import Dashboard from "./Dashboard";
import PastAudits from "./PastAudits";
import Admin from "./Admin";
import "./App.css";

import { API_BASE } from "./config";

const ANSWER_OPTIONS = [
  { value: "Yes", icon: Check, cls: "yes" },
  { value: "Partial", icon: Minus, cls: "partial" },
  { value: "No", icon: X, cls: "no" },
];

const CATEGORY_ICONS = {
  "Basic Setup": Settings,
  "Event Tracking": BarChart3,
  "Configuration & Quality": SlidersHorizontal,
  "Privacy & Consent": Lock,
};

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [view, setView] = useState("form"); // "form" | "history" | "admin"

  const fetchQuestions = () => {
    setLoading(true);
    setLoadError(null);
    axios
      .get(`${API_BASE}/api/questions`)
      .then((res) => setQuestions(res.data))
      .catch(() => {
        setLoadError(
          "Couldn't reach the audit server. Make sure the backend is running on port 8000."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const categories = [];
  questions.forEach((q) => {
    if (!categories.includes(q.category)) categories.push(q.category);
  });

  const currentCategory = categories[currentStep];
  const currentQuestions = questions.filter((q) => q.category === currentCategory);

  const answeredInCategory = (cat) =>
    questions.filter((q) => q.category === cat && answers[q.id]).length;
  const totalInCategory = (cat) => questions.filter((q) => q.category === cat).length;

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isStepComplete = currentQuestions.every((q) => answers[q.id]);

  const handleNext = () => {
    if (currentStep < categories.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const goToStep = (idx) => {
    if (idx <= currentStep) setCurrentStep(idx);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setSubmitError(null);
    axios
      .post(`${API_BASE}/api/audit`, { answers })
      .then((res) => setResult(res.data))
      .catch(() => {
        setSubmitError("Something went wrong while scoring your audit. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
    setSubmitError(null);
    setView("form");
    fetchQuestions(); // refresh in case admin changed questions
  };

  if (loading) {
    return (
      <div className="status-screen">
        <div className="spinner" />
        <p>Loading audit checklist...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="status-screen">
        <AlertCircle size={36} color="#DC2626" />
        <p className="status-error-text">{loadError}</p>
        <button className="btn-primary" onClick={fetchQuestions}>
          <RefreshCw size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          Try again
        </button>
      </div>
    );
  }

  if (view === "admin") {
    return <Admin onBack={() => { setView("form"); fetchQuestions(); }} />;
  }

  if (view === "history") {
    return (
      <PastAudits
        onBack={() => setView("form")}
        onSelectAudit={(audit) => {
          setResult(audit);
          setView("form");
        }}
      />
    );
  }

  if (result) {
    return <Dashboard result={result} onRestart={handleRestart} />;
  }

  return (
    <div className="page">
      <div className="hero">
        <button className="history-link-btn" onClick={() => setView("history")}>
          <History size={14} />
          Past audits
        </button>
        <button className="admin-link-btn" onClick={() => setView("admin")}>
          <ShieldCheck size={14} />
          Admin
        </button>
        <span className="eyebrow">GA4 IMPLEMENTATION AUDIT</span>
        <h1>Check your analytics health</h1>
        <p className="hero-subtitle">
          Answer {questions.length} quick questions across 4 categories to get your score
        </p>
      </div>

      <div className="floating-card">
        <div className="sidebar-panel">
          <h3 className="sidebar-title">Audit checklist</h3>
          <p className="sidebar-desc">Work through each category — you can jump back anytime.</p>

          <div className="category-rows">
            {categories.map((cat, idx) => {
              const Icon = CATEGORY_ICONS[cat];
              const done = idx < currentStep;
              const active = idx === currentStep;
              return (
                <div
                  key={cat}
                  className={`category-row ${active ? "active" : ""} ${done ? "done" : ""}`}
                  onClick={() => goToStep(idx)}
                >
                  <div className="row-icon-circle">
                    {done ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="row-text">
                    <span className="row-title">{cat}</span>
                    <span className="row-sub">
                      {answeredInCategory(cat)} of {totalInCategory(cat)} answered
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-panel">
          <h3 className="form-panel-title">{currentCategory}</h3>

          {submitError && (
            <div className="inline-error">
              <AlertCircle size={15} />
              {submitError}
            </div>
          )}

          <div className="question-list">
            {currentQuestions.map((q, i) => (
              <div key={q.id} className="question-row">
                <p className="question-label">
                  <span className="q-index">{i + 1}</span>
                  {q.text}
                </p>
                <div className="segmented-track">
                  {ANSWER_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        className={`segment-btn seg-${opt.cls} ${selected ? "selected" : ""}`}
                        onClick={() => handleAnswer(q.id, opt.value)}
                      >
                        <Icon size={14} />
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="nav-buttons">
            <button className="btn-ghost" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </button>
            <button className="btn-primary" onClick={handleNext} disabled={!isStepComplete || submitting}>
              {currentStep === categories.length - 1
                ? submitting
                  ? "Scoring..."
                  : "Submit audit"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
