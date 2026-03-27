# Secure HRMS Startup Guide

## Prerequisites

- Node.js 20+ and npm
- MySQL running locally

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment files

Copy the example environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp .env.example .env
```

Update `apps/api/.env` with your local MySQL credentials and JWT secrets.

Recommended local settings:

- `DB_NAME=secure_hrms_local`
- `DB_USER=root`
- `DB_PASSWORD=your_mysql_password`
- `JWT_ACCESS_SECRET=your-strong-access-secret`
- `JWT_REFRESH_SECRET=your-strong-refresh-secret`
- `MAIL_TRANSPORT=mock` for simple local startup without SMTP

The frontend default API base URL in `apps/web/.env` should stay:

```env
VITE_API_BASE_URL=http://localhost:5050/api/v1
```

## 3. Create the database

Create the database in MySQL if it does not already exist:

```sql
CREATE DATABASE secure_hrms_local;
```

## 4. Run database migrations

```bash
npm run migrate
```

## 5. Seed sample data (optional but recommended)

```bash
npm run seed
```

Useful seeded accounts:

- `admin@hrms.local / Admin123!`
- `manager@hrms.local / Manager123!`
- `employee@hrms.local / EmployeeTemp123!`

## 6. Start the application

From the project root:

```bash
npm run dev
```

This starts:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5050/api/v1`

## 7. Helpful commands

Check migration status:

```bash
npm run migrate:status
```

Run lint:

```bash
npm run lint
```

Create a production build for the frontend:

```bash
npm run build
```
