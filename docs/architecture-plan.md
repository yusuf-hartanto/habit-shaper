# System Architecture & Implementation Plan: Habit Shaper

## 1. Overview
**Habit Shaper** is a lightweight, full-stack web application designed to help users build positive habits, break negative habits, and manage streak-based goals. The system is built for zero-configuration deployment using Docker Compose and automatic Sequelize database migrations.

---

## 2. High-Level Architecture

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

- **Frontend Container:** Multi-stage Docker build compiling React + TypeScript via Vite, served by lightweight Nginx. Nginx proxies `/api/*` requests to `http://backend:4000/api/*`.
- **Backend Container:** Node.js + Express + TypeScript service using **Sequelize ORM**. On container startup, an entrypoint command runs `npx sequelize-cli db:migrate` to bootstrap the schema automatically before launching the API server.
- **Database Container:** MySQL 8.0 with a readiness `healthcheck` so the backend only runs migrations once MySQL is ready to accept connections.

---

## 3. Database Schema (Sequelize Migrations & UUIDs)

All tables use `UUID` (`CHAR(36)`, UUIDv4) as their primary key (`id`).

1. **`users`**
   - `id`: UUID (PK, default UUIDV4)
   - `name`: STRING(100), NOT NULL
   - `email`: STRING(150), NOT NULL, UNIQUE
   - `password_hash`: STRING(255), NOT NULL
   - `last_login_at`: DATE (DATETIME), NULLABLE
   - `created_at`, `updated_at`: TIMESTAMPS

2. **`habits`**
   - `id`: UUID (PK, default UUIDV4)
   - `user_id`: UUID (FK -> `users.id`, ON DELETE CASCADE)
   - `title`: STRING(150), NOT NULL
   - `description`: TEXT, NULLABLE
   - `type`: ENUM('build', 'break'), NOT NULL
   - `last_reset_date`: DATEONLY, NOT NULL
   - `created_at`, `updated_at`: TIMESTAMPS

3. **`habit_logs`**
   - `id`: UUID (PK, default UUIDV4)
   - `habit_id`: UUID (FK -> `habits.id`, ON DELETE CASCADE)
   - `log_date`: DATEONLY, NOT NULL
   - `log_type`: ENUM('completed', 'relapse'), NOT NULL
   - `notes`: STRING(255), NULLABLE
   - `created_at`, `updated_at`: TIMESTAMPS
   - *Unique Index:* `(habit_id, log_date, log_type)`

4. **`goals`**
   - `id`: UUID (PK, default UUIDV4)
   - `user_id`: UUID (FK -> `users.id`, ON DELETE CASCADE)
   - `habit_id`: UUID (FK -> `habits.id`, ON DELETE CASCADE)
   - `title`: STRING(150), NOT NULL
   - `target_streak_days`: INTEGER, NOT NULL, default 7
   - `created_at`, `updated_at`: TIMESTAMPS

---

## 4. Backend Architecture (Node.js + TypeScript)

### Directory Structure (`/backend/src`)
### Authentication
- `POST /api/auth/register` — Register a new user account without email verification, set initial `last_login_at`, and return JWT.
- `POST /api/auth/login` — Authenticate existing user, update `last_login_at`, and return JWT.
- `GET /api/auth/me` — Get current logged-in user profile.

### Habits (`build` & `break`)
- `GET /api/habits` — List all user habits enriched with calculated metrics:
  - `current_streak`
  - `completed_today` (boolean, for `build` habits)
  - `relapsed_today` (boolean, for `break` habits)
  - `weekly_stats`: `{ completed_days, missed_days, completion_rate, last_7_days: [...] }`
- `POST /api/habits` — Create a new `build` or `break` habit.
- `PUT /api/habits/:id` — Update habit details.
- `DELETE /api/habits/:id` — Delete a habit and its associated logs/goals.
- `POST /api/habits/:id/toggle` — Toggle daily completion for a `build` habit (defaults to today or accepts `{ date: 'YYYY-MM-DD' }`).
- `POST /api/habits/:id/relapse` — Record a relapse for a `break` habit and reset its clean streak.

### Goals
- `GET /api/goals` — List all goals enriched with linked habit details (`habit_title`, `habit_type`, `current_streak`, `is_achieved`, `progress_percentage`).
- `POST /api/goals` — Create a new goal linked to a `habit_id` (UUID).
- `PUT /api/goals/:id` — Update goal `title`, `habit_id`, or `target_streak_days`.
- `DELETE /api/goals/:id` — Remove a goal.

---

## 5. Frontend Architecture & UI Design (React + TypeScript)

Following the requirement for a **lightweight, simple, and clean** interface, the React frontend uses a minimal, user-friendly single-page dashboard layout styled with Tailwind CSS and Lucide icons.

### Responsive & User-Friendly UX Principles
- **Multi-Device Responsiveness (Mobile-First):**
  - **Mobile (`< 640px`):** Single-column stacked layout (`grid-cols-1`), full-width modals, touch-friendly action buttons (minimum `44px` tap target for daily check-in and relapse actions), and compact navigation.
  - **Tablet (`640px – 1024px`):** Two-column adaptive grid (`md:grid-cols-2`) for habit and goal cards with balanced spacing.
  - **Desktop (`> 1024px`):** Multi-column dashboard layout (`lg:grid-cols-3`) with a clean max-width container (`max-w-6xl mx-auto`) and side-by-side summary metrics.
- **Intuitive Visual Feedback:** Clear color coding (emerald/green for positive habit building & streaks, amber/rose for habit breaking & relapse warnings, indigo/blue for goal progress), loading states, and confirmation prompts before resetting a streak or deleting an item.

### Directory Structure (`/frontend/src`)
- `api/` — Axios instance configured with base URL (`/api`) and automatic JWT `Authorization: Bearer <token>` request interceptor.
- `context/` — `AuthContext.tsx` managing user session state, login/register actions, and token persistence in `localStorage`.
- `components/`
  - `Navbar.tsx` — Responsive top navigation bar displaying app branding, logged-in user profile, and logout button.
  - `HabitBuildCard.tsx` — Renders a positive habit with a one-tap daily check-in button, current streak badge, 7-day visual mini-calendar indicator, weekly completion rate (%), and missed days count.
  - `HabitBreakCard.tsx` — Renders a negative habit with a prominent "Day X Clean" counter, last reset date, and a "Relapse / Reset Streak" action button with a confirmation safeguard.
  - `GoalSection.tsx` — Lists goals linked to habits with visual progress bars (`current_streak / target_streak_days`), achievement badges, and responsive Add/Edit/Delete modals.
- `pages/`
  - `AuthPage.tsx` — Clean, centered Login & Registration card adaptable across mobile and desktop screens (email & password, no email verification).
  - `DashboardPage.tsx` — Main responsive workspace organized into three clear views/sections: **Habits to Build**, **Habits to Break**, and **Goals**.

---

## 6. Development Milestones
1. **Phase 1:** Architecture planning, schema design, and Agentic workflow specification.
2. **Phase 2:** Docker Compose orchestration and environment templates.
3. **Phase 3:** Backend TypeScript setup, Sequelize UUID migrations, models, and JWT Authentication API.
4. **Phase 4:** Habit Building, Habit Breaking, Streak Calculation Engine, and Goal Management APIs.
5. **Phase 5:** React Frontend implementation (Auth pages, Habit Tracker Dashboard, Weekly Progress View, Goal Manager).
6. **Phase 6:** End-to-end verification in Docker and README documentation.