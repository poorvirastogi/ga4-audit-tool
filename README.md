# GA4 Implementation Audit Tool

A full-stack web tool that automates GA4 (Google Analytics 4) implementation audits — built during my Full Stack Engineering internship at [Tatvic](https://www.tatvic.com/), a Google Premium Partner martech consultancy. It mirrors the manual analyst workflow used in Tatvic's paid GA4 Audit service, turning a spreadsheet-based process into a self-serve tool.

**Live demo:** https://ga4-audit-tool-swart.vercel.app
**API docs:** https://ga4-audit-tool.onrender.com/docs

> Note: the backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after idle time may take 30–50 seconds to wake up.

---

## What it does

Users answer an 18-question Yes/Partial/No checklist covering GA4 basic setup, event tracking, configuration quality, and privacy/consent. The backend applies weighted scoring (Critical items worth more than Warning items) and returns:

- An overall health score out of 100, banded as **Healthy / Needs Attention / Critical**
- Counts of Critical, Warning, and Passed items
- A category-by-category score breakdown, visualized with Recharts
- A prioritized, expandable list of issues with explanations and fix recommendations
- A downloadable PDF summary report (generated client-side with jsPDF)

Every submitted audit is saved to a database, so users can review score trends over time. An admin panel lets non-developers edit questions, categories, and weights without touching code.

---

## Screenshots

**Audit form**
![Audit form](docs/screenshots/form.png)

**Results dashboard**
![Results dashboard](docs/screenshots/dashboard.png)

**Admin panel**
![Admin panel](docs/screenshots/admin.png)

---

## Architecture

\`\`\`mermaid
graph LR
    A[React + Vite Frontend] -->|REST API| B[FastAPI Backend]
    B --> C[(PostgreSQL Database)]
    A -->|Deployed on| D[Vercel]
    B -->|Deployed on| E[Render]

    subgraph Frontend Features
        A1[Multi-step form]
        A2[Recharts dashboard]
        A3[jsPDF report export]
        A4[Admin panel]
    end

    subgraph Backend Features
        B1[Weighted scoring engine]
        B2[Question CRUD]
        B3[Audit history]
        B4[Key-based admin auth]
    end
\`\`\`

**Design decision worth noting:** each submitted audit stores its own snapshot of the questions, weights, and results as JSON at submission time — rather than recalculating from the live question table. This means editing a question's wording or weight later (via the admin panel) never silently changes the meaning of past audit results, matching how real audit/reporting systems are expected to behave.

---

## Tech stack

**Frontend:** React (Vite), Recharts, jsPDF, lucide-react, custom CSS
**Backend:** Python, FastAPI, SQLAlchemy, Pydantic
**Database:** PostgreSQL (production via Render), SQLite (local development)
**Testing:** pytest, httpx, FastAPI TestClient — 16 tests covering scoring logic, audit persistence, and admin auth/CRUD
**CI/CD:** GitHub Actions (runs test suite on every push), Render (backend), Vercel (frontend)

---

## Running locally

### Backend
\`\`\`bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
\`\`\`
Runs on http://127.0.0.1:8000 — interactive API docs at \`/docs\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Runs on http://localhost:5173

### Running tests
\`\`\`bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt
pytest -v
\`\`\`

---

## Scoring logic

- Critical questions: 10 points each
- Warning questions: 5 points each
- Yes = full points, Partial = half points, No = 0 points
- Health score = (points scored / points possible) × 100
- **80–100** = Healthy · **50–79** = Needs Attention · **0–49** = Critical

---

## Environment variables

**Backend** (\`backend/.env\` or Render dashboard)
| Variable | Purpose |
|---|---|
| \`DATABASE_URL\` | Postgres connection string (defaults to local SQLite if unset) |
| \`ADMIN_KEY\` | Secret key required to access admin endpoints |
| \`FRONTEND_ORIGIN\` | Allowed CORS origin for the deployed frontend |

**Frontend** (\`frontend/.env.local\` or Vercel dashboard)
| Variable | Purpose |
|---|---|
| \`VITE_API_BASE\` | Base URL of the backend API |

---

## Resume summary

> Built a full-stack GA4 Implementation Audit Tool for internal use at Tatvic — a React + FastAPI application with a multi-step checklist form, weighted scoring engine, categorized issue dashboard, PDF report generation, and an admin panel for non-technical question management. Deployed on Render (PostgreSQL + FastAPI) and Vercel (React), with a pytest suite and GitHub Actions CI. Automates a previously manual analyst workflow used in Tatvic's paid GA4 Audit service.
