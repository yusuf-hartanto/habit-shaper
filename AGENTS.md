# AI Coding Agent Guidelines (AGENTS.md)

This file defines the architectural constraints, coding standards, and business logic rules for AI coding agents assisting in the development of **Habit Shaper**.

## 1. Tech Stack & Environment Constraints
- **Frontend:** React.js (Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios).
    Must be fully responsive across mobile, tablet, and desktop viewports using Tailwind CSS mobile-first breakpoints (sm:, md:, lg:).
- **Backend:** Node.js (Express.js, TypeScript, **Sequelize ORM** with `mysql2`, `sequelize-cli` for migrations, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`).
- **Database:** MySQL 8.0.
- **Primary Keys:** All database tables MUST use **UUID (v4)** (`DataTypes.UUID`, `defaultValue: DataTypes.UUIDV4`, `CHAR(36)`) as their primary key (`id`) and for all foreign key references (`user_id`, `habit_id`).
- **Auto-Migration on Boot:** Database schema creation must be handled via **Sequelize Migrations**. When the backend container starts via `docker compose up`, it must automatically run `npx sequelize-cli db:migrate` before starting the Express server.
- **Containerization:** Must run via a single `docker compose up` command using `compose.yml` at the repository root without external host dependencies.

## 2. Code Quality & Architecture Rules
- **Strict TypeScript:** Avoid `any` where possible. Define explicit interfaces/types for Sequelize Models, Request payloads, and API responses.
- **Layered Architecture (Backend `/backend/src`):**
  - `config/` -> Database configuration (`config.js` / `database.ts`) for Sequelize and `sequelize-cli`.
  - `migrations/` -> Timestamped Sequelize migration files creating `users`, `habits`, `habit_logs`, and `goals` tables with UUID primary/foreign keys and proper indexes.
  - `models/` -> Typed Sequelize models and associations (`User`, `Habit`, `HabitLog`, `Goal`).
  - `routes/` -> Express route definitions & middleware binding.
  - `controllers/` -> HTTP request parsing, input validation, and response formatting.
  - `services/` -> Core business logic (streak calculations, weekly completion rate, relapse resets) interacting with Sequelize models.
  - `middlewares/` -> JWT authentication and centralized error handling.
- **Date Handling:** Store and query calendar dates (`log_date`, `last_reset_date`) using `DataTypes.DATEONLY` (`YYYY-MM-DD`) in UTC/consistent server time to prevent timezone drift during streak calculations.

## 3. Core Business Logic Specifications
### A. Habit Building (`type = 'build'`)
- **Daily Completion:** Users can toggle completion for a specific date (`YYYY-MM-DD`, defaulting to today). Stored in `habit_logs` with `log_type = 'completed'`.
- **Current Streak:** Count consecutive days of completion working backward from today (or yesterday, if today is not yet completed). If neither today nor yesterday is completed, `current_streak` is `0`.
- **Weekly Completion Rate:** Evaluated over the last 7 days (including today, `today - 6 days` to `today`):
  - `completed_days_this_week`: Count of completed logs in the 7-day window.
  - `missed_days_this_week`: `7 - completed_days_this_week`.
  - `weekly_completion_rate`: `Math.round((completed_days_this_week / 7) * 100)`.

### B. Habit Breaking (`type = 'break'`)
- **Clean Streak:** Tracks consecutive days without relapsing.
  - Calculated from `habits.last_reset_date` to today (`YYYY-MM-DD`).
  - If a relapse log exists for today, `current_streak` is `0` (`relapsed_today = true`).
  - Otherwise, `current_streak` = difference in days between today and `last_reset_date` (or `+ 1` if counting from Day 1 of creation when no relapse has occurred on the same day).
- **Relapse Action:**
  - Inside a Sequelize transaction:
    1. Upsert/Insert a record into `habit_logs` (`log_type = 'relapse'`, `log_date = today`).
    2. Update `habits.last_reset_date = today`.
  - Resets the clean streak to `0`.

### C. Goal Management
- Each goal belongs to a user (`user_id` UUID) and links to a specific habit (`habit_id` UUID, inheriting whether it is a `build` or `break` habit).
- Supports full CRUD: Add (`POST`), Read (`GET`), Edit (`PUT`), and Remove (`DELETE`).
- Contains `title` and `target_streak_days` (integer, e.g., 7, 14, 30).
- Dynamically computes `current_streak` from the linked habit and sets `is_achieved = current_streak >= target_streak_days`.

## 4. Reference Documentation
- For detailed **Database Schema (Sequelize Migrations & UUID columns)** and **REST API Endpoints**, always refer to `docs/architecture-plan.md` as the single source of truth.