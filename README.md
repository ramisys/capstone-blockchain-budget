# Blockchain-Based Budget Allocation and Expense Monitoring System

## Phase 1: Authentication & Authorization Backend

Production-ready, secure REST API backend for user authentication and Role-Based Access Control (RBAC), built with Node.js, Express, Prisma ORM, MySQL, JWT, bcrypt, and Zod.

---

## Technical Features

- **Clean Architecture & Separation of Concerns**: Modular feature-based layout (`controllers/`, `services/`, `repositories/`, `middleware/`, `validators/`, `config/`, `constants/`, `errors/`, `utils/`).
- **ES Modules**: Standardized modern JavaScript ES Modules syntax (`import`/`export`).
- **Authentication**: Stateless JSON Web Token (JWT) access tokens with password hashing via `bcryptjs`.
- **Role-Based Access Control (RBAC)**: Flexible authorization middleware supporting single or multi-role permissions (`Administrator`, `Treasurer`, `BudgetOfficer`, `Auditor`).
- **Input Validation**: Request payload validation powered by `Zod` schemas.
- **Unified Response Schema**: Standardized JSON responses for both success and error outcomes across all endpoints.
- **Robust Error Handling**: Centralized operational error management preventing sensitive stack exposure.
- **Security & Logging**: Secured with `helmet`, configurable `cors`, and `morgan` HTTP logger.

---

## Directory Structure

```
.
├── config/             # Environment, Helmet & CORS configurations
├── constants/          # Application enums and HTTP status codes
├── controllers/        # Request controllers handling HTTP requests
├── docs/               # API documentation specifications
├── errors/             # Custom Error classes and handlers
├── middleware/         # Auth, RBAC, Error, Logger, & 404 middlewares
├── models/             # Singleton Prisma Client instance
├── prisma/             # Schema definitions and database seed scripts
├── repositories/       # Prisma database abstraction layer
├── routes/             # Express routing endpoints
├── services/           # Core authentication business logic
├── utils/              # JWT, password hash, & response formatting helpers
├── validators/         # Zod schemas and validation middleware
├── .env.example        # Environment variables template
├── app.js              # Express app setup and middleware configuration
├── package.json        # Project metadata and dependencies
├── README.md           # Setup and usage guide
└── server.js           # Server startup entry point
```

---

## Prerequisites

- Node.js LTS (v18+ or v20+)
- MySQL Database (v8.0+)
- npm Package Manager

---

## Installation & Setup

1. **Clone or Navigate to Project Directory**
   ```bash
   cd capstone
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy `.env.example` to `.env` and adjust credentials:
   ```bash
   cp .env.example .env
   ```
   *Update `DATABASE_URL` with your MySQL connection string:*
   ```env
   DATABASE_URL="mysql://root:yourpassword@localhost:3306/university_budget_db"
   JWT_SECRET="super_secret_jwt_access_key_capstone_2026"
   ```

4. **Run Database Migrations & Generate Prisma Client**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed Default Administrator Account**
   ```bash
   npm run seed
   ```
   *Default Seed Credentials:*
   - **Email**: `admin@university.edu`
   - **Password**: `AdminPassword123!`
   - **Role**: `Administrator`

6. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server will start at: `http://localhost:5000`

---

## API Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | No |
| `POST` | `/api/auth/logout` | Stateless logout endpoint | Yes (`Bearer <token>`) |
| `GET`  | `/api/auth/me` | Fetch authenticated user profile | Yes (`Bearer <token>`) |
| `GET`  | `/health` | Server health check endpoint | No |

For full request/response schemas, refer to [docs/API_DOCUMENTATION.md](file:///d:/Ramisys%20files/Projects/capstone/docs/API_DOCUMENTATION.md).
