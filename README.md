# Habit Shaper

**Habit Shaper** is a lightweight, full-stack web application for **building positive habits**, **breaking negative habits**, and **tracking streak-based goals**. The whole stack (React frontend, Express API, MySQL database) starts with a single `docker compose up`, and the database schema is created by Sequelize migrations when the backend starts.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Tech Stack & System Architecture](#tech-stack--system-architecture)
3. [Quick Start (Docker Compose)](#quick-start-single-command-via-docker-compose)
4. [Local Development Mode](#local-development-mode-dual-mode-environment)
5. [REST API Reference](#rest-api-reference)
6. [Project Structure](#project-structure)
7. [AI-Assisted & Spec-Driven Engineering Workflow](#ai-assisted--spec-driven-engineering-workflow)

---

## Key Features

### Authentication & Security
- **Stateless JWT authentication**: tokens are issued on register/login and sent as `Authorization: Bearer <token>`. Nothing is stored on the server, so one account can be signed in on several devices at once.
- **Password hashing** with `bcryptjs`. Plain-text passwords are never stored.
- **`last_login_at` audit tracking**, updated on every successful login.
- **Self-contained Password Reset** (`POST /api/auth/reset-password`): a user resets their password with their email and a new password. No external SMTP server or email verification is needed.

### Habit Building (`build`)
- One-tap **daily check-in toggle** (defaults to today; also accepts a `YYYY-MM-DD` date).
- **Consecutive-day streak**, counted backwards from today (or from yesterday if today isn't checked in yet).
- **7-day visual mini-calendar** for the rolling window `today − 6 days … today`.
- **Weekly completion rate (%)** and **weekly missed days**.

### Habit Breaking (`break`)
- **Clean streak counter** ("Day X Clean"), calculated from the habit's `last_reset_date`.
- **One-click relapse logging** (`POST /api/habits/:id/relapse`). A single database transaction records the relapse in `habit_logs` and updates `last_reset_date`, which resets the streak to `0`.

### Goal Management
- **Full CRUD** for streak goals, each linked to one `build` or `break` habit.
- Progress is computed live from the linked habit's streak: a **progress bar** (`current_streak / target_streak_days`) and an automatic **"Achieved"** badge once the target is reached.

### Responsive UI
- **Mobile-first** Tailwind CSS layout: 1 column on mobile, 2 on tablet (`md:`), 3 on desktop (`lg:`).
- Touch-friendly action buttons, confirmation prompts before destructive actions, and colour coding (emerald = build, amber/rose = break, indigo = goals).

---

## Tech Stack & System Architecture

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Axios. Served by **Nginx**, which reverse-proxies `/api/*` to the backend container |
| **Backend** | Node.js, Express, TypeScript, **Sequelize ORM** (`mysql2`), `jsonwebtoken`, `bcryptjs`. All primary/foreign keys are **UUIDv4 (`CHAR(36)`)**. Migrations run via `sequelize-cli` on container startup |
| **Database** | **MySQL 8.0** (UTC, `utf8mb4`) with a readiness healthcheck |
| **Infrastructure** | Docker Compose: multi-stage Dockerfiles, a private bridge network, and a named volume for MySQL data |

```text
+-----------------------------------------------------------------------+
|                            Docker Network                             |
|                                                                       |
|  +--------------------+     /api/*      +--------------------------+  |
|  |  Frontend (Nginx)  | --------------> |  Backend (Node/Express)  |  |
|  |  React + Tailwind  |                 |  TypeScript + Sequelize  |  |
|  |  Port: 3000 -> 80  |                 |  Auto-runs Migrations    |  |
|  +--------------------+                 +------------+-------------+  |
|                                                      |                |
|                                                      | TCP 3306       |
|                                                      v                |
|                                         +--------------------------+  |
|                                         |   Database (MySQL 8.0)   |  |
|                                         |   UUID Primary Keys      |  |
|                                         +--------------------------+  |
+-----------------------------------------------------------------------+
```

**Startup sequence**
1. `db` starts. MySQL creates the `habit_shaper` database and app user from the `MYSQL_*` environment variables.
2. `backend` waits for `db` to report **healthy** (`depends_on: condition: service_healthy`).
3. The backend `entrypoint.sh` runs `npx sequelize-cli db:migrate`, then starts the API with `node dist/index.js`.
4. `frontend` (Nginx) serves the compiled SPA and forwards `/api/*` to `http://backend:4000/api/*`.

**Backend layering** (`backend/src`): `routes/` → `controllers/` (input parsing & validation) → `services/` (business logic: streaks, weekly stats, relapse transactions) → `models/` (typed Sequelize models). `middlewares/` handles JWT auth and centralized errors.

**Date handling.** Calendar dates (`log_date`, `last_reset_date`) use `DATEONLY` (`YYYY-MM-DD`) and are calculated in **UTC**, so streaks don't drift across timezones.

---

## Quick Start (Single Command via Docker Compose)

**Prerequisite:** Docker with the Compose v2 plugin.

```bash
git clone <repository-url> habit-shaper
cd habit-shaper
docker compose up --build
```

- **A `.env` file is optional.** Every variable in `compose.yml` has a fallback default (`${VAR:-default}`), so the stack works out of the box.
- **No manual SQL is needed.** Once MySQL reports healthy, the backend creates all tables on first boot.

### Default Service URLs & Ports

| Service | URL / Address |
| --- | --- |
| Frontend web app | <http://localhost:3000> |
| Backend API & healthcheck | <http://localhost:4000/api/health> |
| MySQL (for GUI clients such as DBeaver) | `127.0.0.1:${DB_PORT}`, mapped to container port `3306` |

> **MySQL host port:** the compose fallback is `3306`. If a MySQL server is already running on your machine, set `DB_PORT=3307` in `.env` (or any free port) to avoid the conflict. The backend always connects internally through `db:3306`, whatever the host mapping is.
>
> Default DB credentials: database `habit_shaper`, user `habituser`, password `habitpassword` (root: `rootpassword`).

### Useful Commands

```bash
docker compose up -d --build     # start in the background
docker compose logs -f backend   # follow API + migration logs
docker compose down              # stop and remove containers (data is kept)
docker compose down -v           # full reset: also deletes the MySQL volume
```

---

## Local Development Mode (Dual-Mode Environment)

One root **`.env`** file configures Docker Compose, the backend (`dotenv` loads `../.env`), and the Vite dev server (`loadEnv` with `envDir` pointing at the repo root).

```bash
cp .env.example .env
```

```dotenv
# --- Host port mappings ---
DB_PORT=3307        # host port for MySQL (container port is always 3306)
BACKEND_PORT=4000   # Express API port (Docker mapping + local `npm run dev`)
FRONTEND_PORT=3000  # Nginx mapping in Docker / Vite dev server port locally
```

Run only MySQL in Docker, and run the backend and frontend on your machine with hot reload (Node.js 20+):

```bash
# 1. Database
docker compose up -d db

# 2. Backend: http://localhost:${BACKEND_PORT}
cd backend
npm install
npm run db:migrate   # optional; applies migrations to the local DB
npm run dev          # ts-node-dev with auto-restart

# 3. Frontend: http://localhost:${FRONTEND_PORT} (new terminal)
cd frontend
npm install
npm run dev          # Vite proxies /api -> http://localhost:${BACKEND_PORT}
```

In local mode the backend connects to `127.0.0.1:${DB_PORT}`. In Docker it uses `db:3306`. No code changes are needed to switch between the two.

---

## REST API Reference

Base path: `/api`. Successful responses use the envelope `{ "success": true, "data": ..., "message"?: string }`. Errors use `{ "success": false, "error": { "message": string, "details"?: string[] } }`.
Protected routes need the header `Authorization: Bearer <JWT>`.

### Authentication & System

| Method | Endpoint | Auth Required | Description |
| --- | --- | :---: | --- |
| `GET` | `/api/health` | No | API and database health check |
| `POST` | `/api/auth/register` | No | Register a new account (no email verification), set the initial `last_login_at`, and return a JWT |
| `POST` | `/api/auth/login` | No | Authenticate, update `last_login_at`, and return a JWT |
| `POST` | `/api/auth/reset-password` | No | Reset the password with `{ email, newPassword }` (self-contained, no SMTP) |
| `GET` | `/api/auth/me` | Yes | Get the current user's profile |

### Habits

| Method | Endpoint | Auth Required | Description |
| --- | --- | :---: | --- |
| `GET` | `/api/habits` | Yes | List habits with `current_streak`, `completed_today`, `relapsed_today`, and `weekly_stats` |
| `POST` | `/api/habits` | Yes | Create a `build` or `break` habit |
| `PUT` | `/api/habits/:id` | Yes | Update habit details |
| `DELETE` | `/api/habits/:id` | Yes | Delete a habit and its logs and goals (cascade) |
| `POST` | `/api/habits/:id/toggle` | Yes | Toggle daily completion for a `build` habit (today, or `{ date: "YYYY-MM-DD" }`) |
| `POST` | `/api/habits/:id/relapse` | Yes | Record a relapse for a `break` habit and reset its clean streak (transactional) |

### Goals

| Method | Endpoint | Auth Required | Description |
| --- | --- | :---: | --- |
| `GET` | `/api/goals` | Yes | List goals with `habit_title`, `habit_type`, `current_streak`, `progress_percentage`, and `is_achieved` |
| `POST` | `/api/goals` | Yes | Create a goal linked to a `habit_id` (UUID) with `target_streak_days` |
| `PUT` | `/api/goals/:id` | Yes | Update `title`, `habit_id`, or `target_streak_days` |
| `DELETE` | `/api/goals/:id` | Yes | Remove a goal |

---

## Project Structure

```text
habit-shaper/
├── compose.yml              # db + backend + frontend orchestration
├── .env.example             # shared env template (Docker, backend, Vite)
├── AGENTS.md                # AI agent rules: stack, architecture, business logic
├── docs/
│   └── architecture-plan.md # system blueprint: schema, API, UI, milestones
├── backend/
│   ├── Dockerfile           # multi-stage build -> production image
│   ├── entrypoint.sh        # db:migrate, then start the server
│   ├── .sequelizerc
│   └── src/
│       ├── config/          # env, Sequelize runtime + CLI config
│       ├── migrations/      # users, habits, habit_logs, goals (UUID PK/FK)
│       ├── models/          # typed Sequelize models + associations
│       ├── routes/          # Express routers
│       ├── controllers/     # request parsing, validation, responses
│       ├── services/        # auth, habits, goals, streak engine
│       ├── middlewares/     # JWT auth, centralized error handler
│       ├── utils/           # UTC date helpers, AppError, validation
│       └── types/
└── frontend/
    ├── Dockerfile           # node build stage -> nginx:alpine
    ├── nginx.conf           # SPA fallback + /api reverse proxy
    ├── vite.config.ts       # root .env loading + dev proxy
    └── src/
        ├── api/             # Axios client (JWT interceptor) + services
        ├── context/         # AuthContext (session + token persistence)
        ├── hooks/           # dashboard data hook
        ├── components/      # habit cards, goal section, modals, UI kit
        └── pages/           # AuthPage (login/register/reset), DashboardPage
```

---

## AI-Assisted & Spec-Driven Engineering Workflow

This project was built with a **structured, spec-driven agentic workflow**. The specification came first and code was generated from it:

- **[`AGENTS.md`](./AGENTS.md)** holds the rules every AI coding agent must follow: the tech stack, strict TypeScript, the layered backend, UUIDv4 keys, UTC `DATEONLY` handling, and exact business logic for streaks, weekly completion rates, relapse transactions, and goal achievement.
- **[`docs/architecture-plan.md`](./docs/architecture-plan.md)** is the system blueprint and single source of truth for the database schema, REST API, frontend structure, and UX principles.

Work was split into **incremental phases**, and each phase was verified before the next one started:

1. Architecture planning, schema design, and the agent workflow specification
2. Docker Compose orchestration and environment templates
3. Backend setup, Sequelize UUID migrations, models, and JWT authentication
4. Habit building/breaking, the streak engine, and goal management APIs
5. React frontend: auth, dashboard, weekly progress, and goal manager
6. End-to-end verification in Docker and documentation

Verification at each milestone included TypeScript builds, streak-calculation scripts, end-to-end API tests against the running containers, and browser checks of the UI on desktop and mobile viewports. Because the rules and blueprint live in the repository, later changes (such as the password reset flow) follow the same conventions as the original code.
