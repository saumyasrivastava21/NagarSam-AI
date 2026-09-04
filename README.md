# NagarSam AI — AI-Powered Road Infrastructure Intelligence

> **Report a road issue. NagarSam AI turns it into action.**  
> *AI-powered road infrastructure intelligence for smarter civic operations.*

---

## 🏛️ Executive Overview

**NagarSam AI** (derived from *Nagar* [City] + *Sam* [Collective Civic Action]) is a production-grade, AI-assisted civic infrastructure platform designed to bridge citizen road defect reporting with verifiable municipal road repair workflows.

The repository is structured to support multiple microservices:
- `frontend/`: Complete React 18 + TypeScript 5 web application
- `backend/`: (Phase 2) FastAPI, PostgreSQL/PostGIS, Redis, and LangGraph agents
- `ml/`: (Phase 2) RDD2022 YOLO inference workers

### Key Platform Capabilities:
- **Multi-Class Road Defect Detection**: Longitudinal cracks, transverse cracks, alligator cracks, road surface corruption, and potholes.
- **Four Dedicated Role Workspaces**: Citizen, Municipal Officer, Field Worker, and System Administrator.
- **Voice & Accessibility**: Web Speech API integration (`VoiceInputButton`), WCAG-compliant contrast, and full Light/Dark/System theme toggling.
- **Explainable AI Detection Interface**: RDD2022 computer vision boundary visualization with sub-100ms inference metrics and multi-factor priority reasoning.
- **Bilingual Support**: Instant reactive Hindi + English localization.
- **Synchronized Cross-Role State Engine**: Actions taken by a citizen immediately propagate to officer triage queues, dispatch to worker mobile consoles, and update citizen tracking status upon post-repair verification.

---

## 🛠️ Technology Stack (`frontend/`)

| Domain | Technology |
| :--- | :--- |
| **Framework & Core** | React 18 / TypeScript 5 (Strict Mode) / Vite 6 |
| **Routing** | React Router v6 (SPA with deep-link rewrites) |
| **Styling & Design System** | Tailwind CSS (Semantic Civic Tokens) / Dark & Light Modes |
| **State Management** | TanStack Query v5 (Server-state caching) / Zustand v5 (Auth & UI) |
| **Voice Accessibility** | Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) |
| **Forms & Validation** | React Hook Form + Zod |
| **GIS & Geospatial Mapping** | Leaflet / React-Leaflet |
| **Data Visualization** | Recharts (Area, Pie, and Bar charts) |
| **Icons & Micro-Interactions** | Lucide React / Framer Motion / Sonner Toast Notifications |
| **Testing** | Vitest / React Testing Library / jsdom |
| **Containerization** | Docker (Alpine Multi-Stage Build) / Nginx |

---

## 🚀 Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on **`http://localhost:3000/`**.

## 🔄 End-to-End Cross-Role Workflow

```
[Citizen] Upload Photo + GPS Coordinates
   ↓
[RDD2022 AI] Generates Bounding Box & 94% Confidence Score
   ↓
[AI Reasoning] Evaluates Traffic Density, Cavity Area & Corridor Weighting (P0 to P3)
   ↓
[Municipal Officer] Triages Queue, Confirms Severity, Dispatches Work Order
   ↓
[Field Worker] Acknowledges Job outdoors, Commences Asphalt Patching
   ↓
[Field Worker] Submits Post-Repair Photo for AI Verification
   ↓
[VerifyNet-v1] Scores Defect Elimination (93% Score)
   ↓
[Municipal Officer] Confirms Resolution & Signs Off
   ↓
[Citizen] Receives Verified Notification & Live Closure Update
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22 recommended)
- **npm**: v9.0.0 or higher

### 1. Installation
```bash
# Clone the repository
git clone <repository-url>
cd "NagarSam AI"

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Default parameters in `.env`:
```ini
VITE_API_MODE=mock
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Quality Assurance & Testing

```bash
# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint validation
npm run lint

# Run automated unit and integration tests
npm run test

# Production build bundle check
npm run build
```

---

## 🐳 Docker Deployment

A multi-stage `Dockerfile` compiles the TypeScript assets and serves the bundle through a hardened, gzip-compressed Nginx instance with SPA route fallbacks.

```bash
# Build Docker image
docker build -t nagarsam-ai-frontend .

# Run Docker container on port 8080
docker run -d -p 8080:80 --name nagarsam-app nagarsam-ai-frontend
```
Access the application at `http://localhost:8080`.

---

## ☁️ Cloud Deployment Guides

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. The bundled `vercel.json` automatically configures SPA routing and security headers.
3. Build Command: `npm run build`
4. Output Directory: `dist`

### AWS S3 + CloudFront Deployment
1. Build the production distribution:
   ```bash
   npm run build
   ```
2. Upload the `dist/` directory to an AWS S3 Bucket configured for static website hosting.
3. Attach an Amazon CloudFront distribution pointing to the S3 origin.
4. Set CloudFront Custom Error Response:
   - **HTTP Error Code**: `404`
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: `200 OK`

---

## 🔑 Demo Personas

Use the **Floating Demo Role Switcher** in the bottom-right corner or the login quick-fill buttons:

| Persona | Demo Email | Primary Responsibilities |
| :--- | :--- | :--- |
| **Citizen** | `citizen@example.com` | Report road defects, 4-step wizard, track lifecycle timeline |
| **Municipal Officer** | `officer@example.com` | Triage incident queue, inspect AI reasoning, dispatch work orders |
| **Field Worker** | `worker@example.com` | Outdoor mobile view, accept jobs, upload after-repair photos |
| **System Admin** | `admin@example.com` | Model candidate registry, AI threshold sliders, audit logs |

---

## 📄 License & Disclaimer
NagarSam AI is an AI-powered civic technology platform created for research and municipal operational excellence. Phase 1 operates in evaluation mock mode with realistic Lucknow geographic scenarios.
