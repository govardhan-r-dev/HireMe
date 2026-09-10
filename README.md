# HireMe.co — evidence-based talent platform

This build implements the supplied HireMe.co product specification as a local-first full-stack MVP. The UI is a responsive single-page workspace for Talent and Employer accounts, with a deterministic evidence/scoring layer and employer-specific matching. The local app uses SQLite for relational persistence and a private uploads directory for supporting documents.

## What is implemented

### Talent
- Dashboard and industry readiness
- Skill Passport with confidence, evidence levels and calculation view
- Deterministic skill evidence points: self +5, resume skill +10, academic +10, course +10, certification +10, assessment up to +20, project +20, mentor +10, industry +15
- Resume processing extracts every known skill and explicit experience, project, education, and certification section into profile records; evidence is analyzed and scored automatically
- Duplicate evidence protection by SHA-256
- Assessment verification with the requested score bands
- Employer-specific opportunity matching and transparent match breakdown
- Hard requirements that can make a candidate ineligible
- Career roadmap driven by role requirements
- Projects and industry challenge submissions
- Industry Pulse / Community posts, likes and comments
- Notifications
- Profile and professional links
- Direct messaging data model/API

### Employer
- Employer dashboard
- Company profile
- Job/internship creation with skill weights, Required/Preferred/Optional and minimum scores
- Talent Search filters
- Candidate Matches with weighted fit and hard-requirement checks
- Industry challenges
- Employer document upload and AI-suggested hiring criteria marked `pending_review`
- Recruitment analytics
- Industry demand vs availability insights

### AI/RAG architecture
- PDF extraction helper using PyMuPDF when installed
- Skill normalization/relationship model
- Supabase/PostgreSQL + pgvector migration schema in `supabase/schema.sql`
- Optional Sentence Transformers/RAG layer can be connected behind the server
- Final confidence and fit scores remain deterministic rule-engine outputs; the AI layer never directly assigns the final score.

## Run locally

Use Node.js 24 or newer. Node 24 provides the built-in `node:sqlite` runtime used by the local database adapter.

```powershell
cd C:\path\to\HireMe.co
npm install
npm run migrate
npm run seed
npm start
```

Open `http://localhost:3000`.

The seed command creates these demonstration accounts:

- Email: `demo@hireme.co`
- Recruiter: `recruiter@hireme.co`
- Password: the value written to `data/demo-credentials.txt` (set `DEMO_PASSWORD=...` to choose it)

## Data and environment

SQLite is stored at `data/hireme.sqlite` by default. Set `DATABASE_PATH` to use another database file and `UPLOAD_DIR` to choose the private document directory. `PORT` defaults to `3000`. The `data/` directory and uploaded files are ignored by Git; keep the generated demo credentials file private.

The application uses HTTP-only session cookies, password hashing through Node's `scrypt`, origin checks, rate limiting on sign-in, role checks on every protected endpoint, and private file download routes. Candidate records explicitly control whether employers can see them.

Forgot password is available from the login screen. In local development, the API returns a one-time reset link in the response so the flow can be tested without an email provider. When Supabase is configured, recovery requests are sent through Supabase Auth instead.

Evidence verification is automatic. Resume skills and project evidence are scored as soon as the document is analyzed; recruiters can view the evidence but do not approve or reject it.

## Supabase connection

Supabase is the remote data store when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. The existing synchronous domain layer writes each app record to the private `app_records` table and hydrates the local SQLite cache when the server starts. SQLite remains a local fallback so development can continue before credentials are added. Copy `.env.example` to `.env`, set the Supabase URL, anon key, and server-only service role key, then run `supabase/schema.sql` in the Supabase SQL Editor. Never expose the service role key to browser code. Check the connection with:

```powershell
npm run supabase:check
```

For Supabase to be authoritative from the first boot, use a fresh `DATABASE_PATH` and set `SEED_DEMO=false`; otherwise existing local fallback rows remain available and are mirrored as they change. Set `SUPABASE_REDIRECT_URL` to the deployed reset route when the app is hosted. The anon key is used for Supabase Auth recovery, while the service role key is used only by the server for app data storage.

## Optional PDF service

```bash
pip install pymupdf
python ai_service/extract.py my_resume.pdf
```

## Architecture

Frontend: HTML/CSS/JavaScript
Backend: Node.js + Express
Persistence: Supabase `app_records` with a SQLite cache/fallback when configured
Reference schema: Supabase/PostgreSQL + pgvector normalized tables in `supabase/schema.sql`
Auth: HTTP-only session cookie with server-enforced roles
Storage: private local uploads locally; move to object storage for production
Document processing: PyMuPDF
RAG: vector retrieval + structured skill knowledge
Scoring: deterministic rule engine

## Useful commands

```powershell
npm run migrate   # Apply versioned SQLite migrations
npm run seed      # Create safe, local demonstration data
npm test          # API, authorization, privacy, and scoring regression tests
npm run check     # Syntax check every JavaScript file
npm run build     # Rebuild the bundled utility CSS
```

## Candidate scoring

Skill confidence is deterministic. Each evidence type has a fixed cap: self-declared 5, resume skill 10, academic 10, course 10, certification 10, assessment 20, project 20, mentor 10, and industry evaluation 15. Resume skills and project references are automatically marked `auto_verified` after successful document analysis. Duplicate files are blocked by SHA-256 and repeated assessments use the best result.

Employer fit is calculated from the role's weights: `sum(candidate skill confidence × criterion weight) ÷ sum(criterion weights)`. Required criteria also have a minimum score and can make a candidate ineligible even when the weighted fit is high. The API stores the criterion scores, weights, final fit, explanation, and scoring-engine version with each application.
