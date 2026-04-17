# Student Attendance System

Full-stack attendance system with:
- `backend`: Node.js + Express + Drizzle ORM + PostgreSQL
- `frontend`: React (Vite) + Tailwind + shadcn/ui

## Project Structure

```text
student-attendance/
  backend/
  frontend/
```

## Prerequisites

- Node.js 20+ (recommended: latest LTS)
- npm or pnpm
- PostgreSQL database (Neon/local/etc.)

## 1. Clone Project

```bash
git clone <your-repo-url>
cd student-attendance
```

## 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=verify-full
JWT_SECRET=replace_with_strong_secret

# Optional Google login
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173

# Auto mark absent cutoff (HH:MM, 24-hour, local server time)
STAFF_ABSENT_CUTOFF=10:00
```

### Generate JWT Secret

Run in terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy output and set:

```env
JWT_SECRET=<paste_generated_value>
```

### Google OAuth Setup (Optional)

The backend callback route is `GET /auth/google/callback`, so the redirect URI **must** match:
`http://localhost:5000/auth/google/callback` (for local dev).

1. Open Google Cloud Console.
2. Create/select a project.
3. Go to `APIs & Services` -> `Credentials`.
4. Create `OAuth Client ID` (Web application).
5. Add Authorized Redirect URI:
   - `http://localhost:5000/auth/google/callback`
6. Copy generated values into `backend/.env`:

```env
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

Production note: replace the redirect URI with your public backend URL, e.g.
`https://api.yourdomain.com/auth/google/callback`, and update it in Google Cloud
Console and `backend/.env`.

Generate and run migrations:

```bash
npm run generate
npm run migrate
```

Run backend:

```bash
npm run dev
```

Backend runs on: `http://localhost:5000`

Tip:
```bash
cp .env.example .env
```
If you are on Windows PowerShell, use:
```powershell
Copy-Item .env.example .env
```

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

Tip:
```bash
cp .env.example .env
```

## 4. First Run Checklist

1. Start backend first.
2. Start frontend.
3. Register/login users.
4. Ensure DB migrations are applied.

## 5. Attendance Flow (Current)

- Admin:
  - Generates staff QR from `Staff QR` page.
- Teacher:
  - Scans QR in `QR Scanner`.
  - Attendance is stored via `POST /staff-attendance`.
- Auto absent:
  - After cutoff time (`STAFF_ABSENT_CUTOFF`, default `10:00`), active teachers without scan are auto-marked `absent`.

## 6. Common Issues

- `Route not found: POST /staff-attendance`
  - Backend not restarted after code update, or route not deployed.

- `ERR_CONNECTION_REFUSED`
  - Backend not running or wrong `VITE_API_URL`.

- `getaddrinfo ENOTFOUND` on `npm run push`
  - `DATABASE_URL` points to a host that cannot be resolved or no longer exists.
  - Recreate `backend/.env` from `backend/.env.example`, then paste the current PostgreSQL URL from your database provider.
  - Make sure the command is `npm run push`, not `nmp drizzle-kit push`.

- Migration/table errors
  - Run:
    - `npm run generate`
    - `npm run migrate`

- QR camera not opening
  - Allow browser camera permission.
  - Use `http://localhost` (not file preview).

## 7. Production Notes

- Never commit real `.env` secrets.
- Use platform env vars (Render/Railway/Vercel/Netlify).
- Set backend CORS to your frontend domain.
