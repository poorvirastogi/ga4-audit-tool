# GA4 Implementation Audit Tool

A full-stack web tool that automates GA4 (Google Analytics 4) implementation audits — built to mirror the manual analyst workflow used in Tatvic's paid GA4 Audit service.

## What it does

Users answer an 18-question Yes/Partial/No checklist covering GA4 basic setup, event tracking, configuration quality, and privacy/consent. The backend applies weighted scoring (Critical items worth more than Warning items) and returns:

- An overall health score out of 100, banded as Healthy / Needs Attention / Critical
- Counts of Critical, Warning, and Passed items
- A category-by-category score breakdown
- A prioritized, expandable list of issues with explanations and fix recommendations
- A downloadable PDF summary report

No login and no database — each submission is scored statelessly.

## Tech stack

- **Backend:** Python, FastAPI
- **Frontend:** React (Vite), Recharts, jsPDF, lucide-react
- **Styling:** Custom CSS, no framework

## Running locally

### Backend
\`\`\`bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-multipart
uvicorn main:app --reload --port 8000
\`\`\`
Runs on http://127.0.0.1:8000 — interactive API docs at /docs

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Runs on http://localhost:5173

## Scoring logic

- Critical questions: 10 points each
- Warning questions: 5 points each
- Yes = full points, Partial = half points, No = 0 points
- Health score = (points scored / points possible) × 100
- 80–100 = Healthy, 50–79 = Needs Attention, 0–49 = Critical
