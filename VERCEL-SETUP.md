# HireMe on Vercel

Use Node.js 24.x and the Express framework preset. The project root must contain
server.js and package.json. Public assets are in public/.

Required environment variables:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server only)
- SEED_DEMO=false

Optional: SUPABASE_STORAGE_BUCKET (defaults to hireme-private).
Remove DATABASE_PATH and UPLOAD_DIR overrides from Vercel; cloud mode does not
open SQLite and uses temporary storage only while parsing uploads.

Vercel automatically selects cloud mode. For the same behavior locally, set
STORAGE_BACKEND=supabase. Do not run the old SQLite mirror against the same
project after migrating: cloud state is now the authoritative application data.

The private app_records row (__hireme_state, 1) stores the MVP's application
state. Each API request reloads it; writes use an atomic revision comparison
before responding. Conflicting requests return 409 so the user can retry.
This design loads the whole state per request and is intended for the college
MVP, not a large production dataset. Existing normalized reference tables are
not used. Migrate to normalized queries before scaling.

scripts/migrate-cloud.js imports the local SQLite data and existing files once,
refusing to overwrite an existing cloud state. Migration was performed for the
configured project during this fix. Do not rerun it to overwrite cloud data.

Uploaded files use a private Supabase Storage bucket, and downloads retain the
app's existing ownership checks. Files only present on another computer cannot
be migrated automatically. Vercel's request-size limit also applies to uploads.

Authentication remains the application's password hashes and cookie sessions,
now persisted in cloud state. These are not Supabase Auth users. Hosted forgot
password returns an explicit unavailable error until an email recovery provider
is configured; it never returns a password reset credential to the caller.

Validation: npm test. After redeployment, check /api/health and log in, refresh
the dashboard, upload a resume, and download it again.
