# 🚀 AI Job Application Tracker API

A NestJS + Prisma/PostgreSQL backend for tracking job applications, with JWT
authentication and per-user job CRUD.

---

## 🧰 Tech Stack

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT Authentication (Passport)

---

## 🔐 Features

* User registration & login (JWT)
* Passport-guarded routes (`JwtAuthGuard`)
* Job CRUD, scoped to the authenticated user
* Request validation via DTOs (`class-validator`)

---

## 📦 API Endpoints

### Auth

* `POST /auth/register`
* `POST /auth/login`

### Users

* `GET /users/me` — requires `Authorization: Bearer <token>`

### Jobs

All require `Authorization: Bearer <token>`.

* `GET /jobs`
* `GET /jobs/:id`
* `POST /jobs`
* `PATCH /jobs/:id`
* `DELETE /jobs/:id`

---

## 🧪 Example Request

```
POST /jobs
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Backend Developer",
  "company": "Amazon",
  "status": "Applied"
}
```

`status` must be one of `Applied`, `Interview`, `Accepted`, `Rejected`
(see `src/jobs/job-status.ts`).

---

## ⚙️ Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET
npx prisma migrate dev
npm run start:dev
```

`JWT_SECRET` is required — the app fails to boot without it.

---

## 📊 Future Improvements

* Server-side search/filter/pagination on `GET /jobs`
* Role-based access control
* File upload (resume tracking)

---

## 👨‍💻 Author
Dhruv Patel
