# 🛡️ SentinelAI

**AI-Powered Real-Time Social Media Harassment Detection, Autonomous Moderation & Digital Forensics Platform**

---

## Overview

SentinelAI is a production-grade cybersecurity + AI web platform that automatically detects harassment, cyberbullying, threats, hate speech, sexual harassment, coercion, stalking, and toxic communication across social-media-style platforms in **real time** — without requiring users to manually upload content.

---

## Level 1 Features

| Feature | Status |
|---|---|
| SOC Dashboard with live feed | ✅ |
| Instagram-like monitored feed | ✅ |
| WhatsApp-like monitored chat | ✅ |
| Real-time WebSocket streaming | ✅ |
| AI toxicity detection engine | ✅ |
| Multilingual detection (Hinglish, Hindi, Urdu, Tamil, Bengali) | ✅ |
| Severity classification (LOW → CRITICAL) | ✅ |
| Autonomous moderation actions | ✅ |
| Cyber Law Risk Meter (IT Act + IPC) | ✅ |
| Evidence Locker (SHA-256 chain-of-custody) | ✅ |
| Offender Profiles with risk scoring | ✅ |
| Digital Forensics Center | ✅ |
| MongoDB persistence | ✅ |

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TailwindCSS v3
- Framer Motion (animations)
- Recharts (charts)
- Zustand (state management)
- React Router v6

**Backend**
- FastAPI (Python 3.11)
- WebSockets (real-time stream)
- Motor (async MongoDB driver)
- langdetect (language detection)

**Database**
- MongoDB (local or Atlas)

**AI Pipeline (Level 1)**
- Rule-based pattern matching engine
- Language detection
- Severity scoring
- Cyber law mapping

---

## Quick Start

```bash
# Install everything and launch
./setup.sh
```

**Or manually:**

```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install && npm run dev
```

Then open: **http://localhost:5173**

---

## Architecture

```
Simulator / Real APIs
        ↓
Language Detection (langdetect)
        ↓
Translation Layer (LibreTranslate — Level 2)
        ↓
Toxicity Engine (Rule-based → HuggingFace — Level 2)
        ↓
Severity Engine + Cyber Law Mapping
        ↓
Autonomous Moderation
        ↓
Forensic Evidence Storage (MongoDB + SHA-256)
        ↓
WebSocket Broadcast → SOC Dashboard
```

---

## Environment Variables

Copy `.env.example` to `.env` in the backend directory:
```bash
cp backend/.env.example backend/.env
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/analytics` | Dashboard statistics |
| `GET /api/incidents` | Recent incidents |
| `GET /api/evidence` | Evidence locker records |
| `GET /api/offenders` | Offender profiles |
| `POST /api/analyze` | Analyze a message manually |
| `WS /ws/stream` | Real-time event stream |

Docs: **http://localhost:8000/docs**

---

## Roadmap

- **Level 1** ✅ — Foundation, UI, rule-based AI, simulated stream
- **Level 2** — HuggingFace toxic-bert, Perspective API, LibreTranslate, Reddit/Discord real APIs
- **Level 3** — OSINT tools, PDF reports, threat intelligence, Elasticsearch
