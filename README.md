# Halfway

**English** · [Türkçe](README.tr.md)

A multi-tenant task manager for small teams: organizations, projects, tasks, assignees, tags and comments, with roles on two levels.

**Live demo: [halfway-mert.vercel.app](https://halfway-mert.vercel.app)**. Click **Try the demo** to get your own sample team, with no sign-up. The API runs on a free plan that sleeps when idle, so the first request can take up to a minute.

![Project board](docs/screenshots/board.png)

The name comes from the status icons: an empty ring is *to do*, a half-filled ring is *in progress*, a filled ring is *done*. Most work lives halfway.

## Contents

- [What it does](#what-it-does)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Decisions and why](#decisions-and-why)
- [Testing](#testing)
- [Running it locally](#running-it-locally)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

## What it does

- **Organizations.** Signing up creates an organization with you as its owner. Everything you see belongs to your organization only.
- **People.** Owners add people with a starting password, and can deactivate and reactivate them.
- **Projects with teams.** Each project has its own team, and each team member is a *manager* or a *contributor*.
- **Tasks.** A board with three columns per project, due dates (overdue ones stand out), multiple assignees, colored tags, and a comment thread.
- **My tasks.** Everything assigned to you across all projects, grouped by status.
- **Account.** Change your password, which also signs you out everywhere else.
- **Demo.** A personal, pre-filled sandbox for every visitor, deleted after 24 hours.

## Screenshots

| Task page | Project team |
|---|---|
| ![Task page with comments, assignees and tags](docs/screenshots/task.png) | ![Project team with roles](docs/screenshots/team.png) |

| People | Home |
|---|---|
| ![People page with a deactivated member](docs/screenshots/people.png) | ![Home page](docs/screenshots/home.png) |

On a phone, the navigation moves into a menu and the board columns stack:

<p>
  <img src="docs/screenshots/phone-board.png" alt="Board on a phone" width="280">
  &nbsp;&nbsp;
  <img src="docs/screenshots/phone-task.png" alt="Task page on a phone" width="280">
</p>

## Tech stack

| | |
|---|---|
| **API** | Node.js 22, Express 5, TypeScript, Prisma 7, PostgreSQL 17, Zod 4, bcrypt |
| **Web** | Next.js 16 (App Router), React 19, TanStack Query 5, Tailwind CSS 4, Base UI (shadcn) |
| **Tests** | Vitest and Supertest against a real PostgreSQL database |
| **CI** | GitHub Actions: typecheck, lint, tests and build on every pull request |
| **Hosting** | Vercel (web), Render (API), Neon (database), all on free plans |

## Architecture

```mermaid
flowchart LR
  B[Browser] -->|"halfway-mert.vercel.app/api/*"| V["Next.js on Vercel"]
  V -->|rewrite| R["Express API on Render"]
  R --> N[("PostgreSQL on Neon")]
```

The browser only ever talks to the web app. Requests to `/api/*` are forwarded by Next.js to the API. Why that matters is explained in [the cookie decision](#8-the-browser-never-talks-to-the-api-directly).

```
api/
  prisma/              schema and migrations
  src/modules/         one folder per feature: routes → controller → service
    auth/              register, login, sessions, password change, demo entry
    users/ projects/ tasks/ tags/ comments/ demo/
  src/shared/          config, database client, errors, middleware, test helpers
web/
  src/app/             pages (App Router)
  src/components/      UI, grouped by feature
  src/lib/             API client, query keys, error messages, formatting
```

Each API module follows the same layout. The **controller** validates input with Zod and shapes the response. The **service** holds the rules: it finds the record (404), checks permission (403), then does the work. The database is only reached through the service.

## Decisions and why

Every choice below had an alternative. Each one says what was picked, why, and what it costs.

### 1. Sessions in the database, not JWTs

On login the API creates a random 32-byte token, sends it in a cookie, and stores only its **SHA-256 hash** in a `sessions` table. Every request looks the session up.

- **Why:** A session can be ended immediately. Logging out, changing a password, or being deactivated takes effect on the very next request. A JWT stays valid until it expires, unless you build a revocation list, which is a session table again.
- **Why hash it:** If the database leaked, the hashes couldn't be used as cookies.
- **Cookie settings:** `HttpOnly` (JavaScript can't read it, so an XSS bug can't steal it), `Secure`, `SameSite=Lax`, 30-day lifetime. Responses under `/auth` are sent with `Cache-Control: no-store`.
- **Cost:** One extra database query per request. At this scale that's nothing.

### 2. Logins are hard to abuse

- An unknown email and a wrong password return the **same error**, so the login form can't be used to find out who has an account.
- When the email doesn't exist, the password is still compared against a dummy hash. Without this, "no such user" would answer measurably faster than "wrong password".
- Passwords are hashed with bcrypt (cost 12). The 72-character maximum is bcrypt's own limit.
- Rate limits: 10 failed logins per 15 minutes per IP, 5 sign-ups per hour per IP, 5 demos per hour per IP, and 10 failed password changes per 15 minutes **per user**.

### 3. Changing your password signs you out everywhere else

The password change checks your current password, then deletes **every** session of yours and issues a new one for the current browser, in one transaction. If someone else had your password and was logged in, they're out.

Two separate errors, `INVALID_CURRENT_PASSWORD` and `SAME_PASSWORD`, keep the form's messages specific.

### 4. Tenant isolation is enforced by the database

Every table that belongs to an organization carries `organization_id`. Child rows reference their parent through **composite foreign keys** on `(organization_id, id)`. In practice, a task can only point to a project, user or tag **of the same organization**.

- **Why:** Most multi-tenant leaks come from one forgotten `WHERE` clause. Here, even if the application code had that bug, PostgreSQL would refuse to link data across organizations.
- **Lookups** use the pair too (`organizationId_id`), so an ID from another organization behaves exactly like an ID that doesn't exist.
- **404, not 403,** for another organization's records. A 403 would confirm the record exists.

### 5. Two levels of roles

- **Organization roles:** `owner` or `member`.
- **Project roles:** `manager` or `contributor`, per project.

| Action | Who can do it |
|---|---|
| Read projects, tasks and comments | Everyone in the organization |
| Create, rename or delete projects | Owner |
| Manage a project's team | Owner, project manager |
| Create and edit tasks, change status, add tags to tasks | Owner, project team |
| Assign people, delete tasks | Owner, project manager |
| Write comments | Owner, project team |
| Edit a comment | Its author only |
| Delete a comment | Its author, owner, project manager |
| Create and rename tags | Everyone |
| Delete tags | Owner |
| Add, deactivate and reactivate people | Owner |

Owners aren't automatically on every project team. Their organization role lets them through, and team membership stays meaningful: only team members can be assigned tasks.

### 6. People are deactivated, not deleted

A user who created tasks or wrote comments can't be deleted: those foreign keys are `RESTRICT` on purpose, because a comment thread with holes in it is worse than a name marked "deactivated".

Deactivation:

- deletes the person's sessions and blocks login with a clear `USER_DEACTIVATED` error;
- is checked again on every request, so a session that somehow survives still stops working;
- keeps their assignments and comments, shown with a faded avatar and a "(deactivated)" label;
- stops them from being added to teams or assigned new tasks;
- can't be applied to yourself, which also guarantees an organization always keeps an owner.

### 7. One error format, with stable codes

Every error looks like `{ "error": { "code": "EMAIL_TAKEN", "message": "..." } }`. Validation errors add the failing fields. Unexpected errors return a generic 500 and are logged on the server, never leaked.

The web app maps codes to its own messages in one file (`web/src/lib/errors.ts`). The API's wording can change without breaking the UI, and the UI can say things in the user's context.

### 8. The browser never talks to the API directly

The session cookie is `SameSite=Lax`. In production the web app is on `vercel.app` and the API is on `onrender.com`, and those are different sites, so the browser wouldn't send the cookie to the API. Browsers are also blocking third-party cookies in general.

Instead of loosening the cookie to `SameSite=None`, Next.js forwards `/api/*` to the API (`web/next.config.ts`). As far as the browser is concerned, everything is one site.

- **Cost:** One extra hop per request.
- **Bonus:** No CORS in production, and the API address never appears in the browser.

### 9. The proxy setting was measured, not guessed

Rate limiting needs the visitor's real IP, but the API sits behind four proxies. Each one appends to `X-Forwarded-For`:

```
visitor → Vercel → Cloudflare → Render's load balancer → Render's local proxy → API
```

Express's `trust proxy` must equal that hop count:

- **Too low**, and every visitor looks like the same proxy, sharing one rate-limit bucket.
- **Too high**, and a visitor can fake their IP by sending their own header.

The number (4) was found with a temporary endpoint that printed the forwarding chain on production. It's an environment variable (`TRUST_PROXY`), 0 locally.

### 10. The demo is a personal sandbox

**Try the demo** creates a **new organization for every visitor**, fills it with a realistic team (six people, one of them deactivated, two projects, ten tasks, tags and comments), and logs the visitor in as its owner.

- **Why not one shared demo account:** Visitors would see each other's changes, one person could wipe it for everyone, and it would need special rules (no password change, no deactivation) plus a nightly reset job. With a sandbox each, visitors can do anything, and nothing needs protecting.
- **Cleanup without a cron job:** Every new demo first deletes demos older than 24 hours. Organizations carry an `is_demo` flag, **default `false`**: only the demo endpoint ever sets it, so a real organization can't be deleted by mistake. The cleanup runs in one transaction, in the order the `RESTRICT` keys require (projects, then tags, then users, then the organization). Everything else follows by `CASCADE`.
- **Safety:** Demo emails use `example.com` (reserved, can't belong to anyone) with a random suffix. The password is random and never shown. Demos are rate limited per IP.

### 11. Frontend data: TanStack Query

- All server data goes through TanStack Query. Query keys live in one file (`web/src/lib/query-keys.ts`) so related screens refresh together.
- After a change, the affected queries are invalidated and refetched. The only optimistic update is the status change on the board, where waiting for the server would feel slow.
- Protected pages ask the API (`/auth/me`) whether you're logged in instead of reading the cookie in Next.js. The API is the only thing that knows if a session is still valid.
- Public pages show their buttons immediately rather than waiting for `/auth/me`. With a sleeping server that wait could last a minute.

### 12. Design: status is shape, color belongs to the team

The interface is almost monochrome, with a single green accent and a red for danger. Status is shown by the **shape** of the ring (empty, half, full) rather than by color, so it reads in grayscale and for color-blind users. The only bright colors are the ones a team chooses for its tags, and those appear only as small dots.

## Testing

**106 integration tests** run against a real PostgreSQL database through HTTP (Supertest), not against mocks.

- **Why real:** The rules that matter most here live in the database: composite foreign keys, unique constraints, `RESTRICT` and `CASCADE`. A mocked database would agree with whatever the code assumed.
- **Isolation:** Every test starts from empty tables. The test runner refuses to start unless the database name ends with `_test`.
- **How tests were written:** Each feature started with a scenario table: the happy path, unauthenticated, another organization (404), each role that shouldn't be allowed (403), invalid input, conflicts, and "nothing was written when it failed". Then came the tests, then the code. Tests check the database state as well as the response: a 401 alone doesn't prove the sessions were deleted, so the tests count them.
- **Checking the tests:** Some tests were verified by breaking the code on purpose and confirming the right test failed.

CI runs both apps on every pull request. `main` is protected and only accepts merges with green checks.

| Job | Steps |
|---|---|
| `api` | Typecheck and the full test suite against a PostgreSQL service container |
| `web` | Typecheck, lint with zero warnings allowed, production build |

## Running it locally

Requirements: Node.js 22 and Docker.

```bash
# 1. Database (PostgreSQL on port 5433)
docker compose up -d

# 2. API on http://localhost:4001
cd api
cp .env.example .env
#   PORT=4001
#   NODE_ENV=development
#   DATABASE_URL=postgresql://taskapp:taskapp@localhost:5433/taskapp
#   TEST_DATABASE_URL=postgresql://taskapp:taskapp@localhost:5433/taskapp_test
#   TRUST_PROXY=0
#   CORS_ORIGIN=http://localhost:3001
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev

# 3. Web on http://localhost:3001 (in a second terminal)
cd web
cp .env.example .env.local     # API_URL=http://localhost:4001
npm install
npm run dev
```

Run the tests with `npm test` inside `api/`. The test database is created and migrated automatically.

## Deployment

| | Service | Notes |
|---|---|---|
| Web | Vercel | Root directory `web`. `API_URL` points to the API and is read at build time. |
| API | Render | Root directory `api`. Build: `npm ci --include=dev && npm run build`. Migrations run before each deploy with `npm run db:deploy` (`prisma migrate deploy`). |
| Database | Neon | Direct (non-pooled) connection. |

Merging into `main` deploys both apps. Migrations are never applied to production by hand.

## Known limitations

These are deliberate trade-offs for a free portfolio project:

- **Cold starts.** The free API sleeps after 15 minutes without traffic, so the first request can take up to a minute.
- **No email.** Owners set a starting password for new people instead of sending invitations.
- **No real-time updates.** Other people's changes appear when you reload or come back to the page.
- **No pagination.** Lists load in full, which is fine at small-team size.
- **No end-to-end browser tests.** The API is covered by integration tests. The UI was checked by hand and with screenshots on desktop and phone sizes.
- **The API URL is public.** Someone calling `onrender.com` directly, skipping Vercel, could fake their IP to get around the IP-based rate limits. The fix would be a secret header added by the web app and required by the API.

## Contact

**Mert Kaya**

- LinkedIn: [linkedin.com/in/merttkaya20](https://www.linkedin.com/in/merttkaya20/)
- GitHub: [github.com/mertkaya20](https://github.com/mertkaya20)
