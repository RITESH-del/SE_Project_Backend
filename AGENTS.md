# Repository Guidelines

## Project Overview

The Backend repository is the API service for the **Academic Campus & Timetable Management System**, built with **Node.js, Express v5, Zod, bcrypt, jsonwebtoken, and Jest/Supertest**.

It serves the React 19 / Mantine v9 single-page frontend (`Frontend/` on `http://localhost:5173`) with the base URL `http://localhost:8000/api`.

Core system responsibilities:
- **Authentication & Authorization**: User registration, credential verification, bcrypt password hashing, and role-based access control (Admin, Faculty, Student) via JWT bearer tokens.
- **Campus Resource Management**: CRUD management for academic infrastructure: student groups, faculty members, students, classrooms/labs, and courses.
- **Timetable & Scheduling Engine**: Timetable slot allocation, room occupancy tracking, faculty workload calculations, and conflict detection (faculty collisions, room double-bookings).
- **Server-Driven UI (SDUI) Provider**: Supplies dynamic layout and component schemas consumed directly by the frontend SDUI renderer (`Renderer.jsx`), powering the administrative dashboard widgets (`stats`, `pie-chart`, `bar-chart`, `scheduling-status`, `table`).

---

## Architecture & Data Flow

### Architectural Pattern
The repository implements a **Modular Layered Architecture (Vertical Slices with Controller-Service-Repository tiers)**. Features are isolated under `modules/<domain>/`, with cross-cutting infrastructure organized in `shared/` and configuration in `config/`.

```
Frontend Client (Axios apiClient, http://localhost:5173)
       │
       │ HTTP Request (JSON body, Bearer Token)
       ▼
server.js (Port 8000)
 ├── CORS Headers (Origin: http://localhost:5173, credentials: true)
 ├── express.json() & express.urlencoded()
 ├── Request Routing (/api/auth, /api/admin)
 │
 ├── Feature Slices (modules/)
 │     │
 │     ├── /api/auth (modules/auth/)
 │     │     ├── auth.route.js          [Express Router & Middleware Bindings]
 │     │     ├── auth.validation.js     [Zod 4.x Schemas: loginSchema, registerSchema]
 │     │     ├── auth.controller.js     [HTTP Request/Response Handling]
 │     │     ├── auth.service.js        [Business Logic, bcrypt, JWT Issuance]
 │     │     └── auth.repository.js     [Database Persistence Queries]
 │     │
 │     └── /api/admin (modules/admin/)
 │           ├── admin.route.js         [Admin & Timetable Routes]
 │           ├── admin.validation.js    [Resource & Timetable Zod Schemas]
 │           ├── admin.controller.js    [Dashboard & CRUD Transport]
 │           ├── admin.service.js       [SDUI Schema Composition, Conflict Logic]
 │           └── admin.repository.js    [Campus Entity Data Access]
 │
 ├── Central Database Client (db.js)
 └── Centralized Error Middleware (shared/middleware/errorHandler.js)
```

### Layer Responsibilities
1. **Routing (`*.route.js`)**: Registers HTTP method handlers and paths; applies authentication guards (`requireAuth`) and payload validation middleware (`validate(schema)`).
2. **Validation (`*.validation.js`)**: Declares strict input validation contracts using **Zod**. Ensures malformed payloads are rejected with HTTP 400 before hitting controllers.
3. **Controller (`*.controller.js`)**: Extracts parameters (`req.body`, `req.params`, `req.query`, `req.user`), delegates to service methods, and serializes responses (`res.status().json()`). Keeps HTTP concerns isolated from business logic.
4. **Service (`*.service.js`)**: Executes business rules, orchestrates repositories, hashes passwords (`bcrypt`), generates/verifies JWTs, and constructs SDUI dashboard schemas.
5. **Repository (`*.repository.js`)**: Encapsulates database queries and data persistence operations, isolating SQL/ORM logic from the service layer.
6. **Database Abstraction (`db.js`)**: Centralizes connection pooling, query execution, and lifecycle management.

### End-to-End Data Flow
1. **Client Request**: Frontend issues an HTTP call via `apiClient.js` (e.g., `POST /api/auth/login`).
2. **Global Middleware**: `server.js` applies CORS rules, parses JSON payloads, and routes the request to `/api/auth`.
3. **Route Validation**: Route middleware executes `validate(loginSchema)`. Invalid inputs return an immediate 400 Bad Request with field-level issues.
4. **Controller Invocation**: The controller extracts sanitized data and awaits the corresponding service method.
5. **Service Execution**: The service verifies domain constraints (e.g., fetches user by email via repository, verifies password hash with `bcrypt`, signs JWT token).
6. **Persistence**: The repository runs queries through `db.js`.
7. **Response Serialization**: The controller wraps output into a standardized JSON response (`{ success: true, data: { ... } }`).
8. **Error Propagation**: Express 5 automatically intercepts rejected promises and forwards them to `shared/middleware/errorHandler.js`, outputting structured errors (`{ success: false, message: "..." }`).

---

## Key Directories

```
Backend/
├── config/              # Centralized configuration modules (env, db, jwt constants)
├── modules/             # Domain-driven vertical feature slices
│   ├── auth/            # Authentication & authorization feature slice
│   │   ├── auth.route.js        # Auth endpoint definitions (/login, /register, /me)
│   │   ├── auth.controller.js   # HTTP transport handlers
│   │   ├── auth.service.js      # Password verification, token generation logic
│   │   ├── auth.repository.js   # User data access methods
│   │   ├── auth.validation.js   # Zod input schemas
│   │   └── __tests__/           # Colocated unit and integration test suite
│   └── admin/           # Admin domain: campus management, timetable engine, SDUI
│       ├── admin.route.js       # Admin endpoints (/dashboard, /campus/*, /timetable)
│       ├── admin.controller.js  # SDUI dashboard and CRUD controllers
│       ├── admin.service.js     # SDUI layout builder, timetable conflict resolution
│       ├── admin.repository.js   # Campus entity data access
│       └── admin.validation.js   # Campus entity and scheduling schemas
├── shared/              # Cross-cutting utilities, middleware, and base errors
│   ├── middleware/      # Global & route middleware (auth, validate, errorHandler)
│   ├── errors/          # Custom error classes (AppError, NotFoundError, UnauthorizedError)
│   └── utils/           # Shared helper functions and response formatters
├── db.js                # Database client initialization and connection pool
├── package.json         # Dependency manifest, scripts, and package metadata
├── package-lock.json    # Exact dependency tree lockfile (npm v3 lockfile)
└── server.js            # Main Express application entry point & HTTP bootstrap
```

---

## Development Commands

Execute all commands from the `Backend/` directory:

```bash
# Install dependencies
npm install

# Start server in production mode
npm start

# Start server in development mode with Node 22 native watch
node --watch server.js

# Run test suite with Jest
npx jest

# Run tests in watch mode
npx jest --watch

# Run a specific test file
npx jest modules/auth/__tests__/auth.service.test.js

# Run tests matching a specific pattern or module
npx jest modules/auth/

# Run tests with code coverage reporting
npx jest --coverage --detectOpenHandles --forceExit
```

*Recommended `package.json` scripts configuration*:
```json
"scripts": {
  "start": "node server.js",
  "dev": "node --watch server.js",
  "test": "jest --detectOpenHandles",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

## Code Conventions & Common Patterns

- **Module System**: **ES Modules (ESM)** (`import` / `export`).
- `package.json` specifies `"type": "module"`. Use ESM syntax across the backend with explicit `.js` extensions on relative imports:
  ```javascript
  // Correct
  import express from 'express';
  import authRoutes from './modules/auth/auth.route.js';
  export default router;

  // Avoid (CommonJS require/module.exports is not used)
  const express = require('express');
  module.exports = router;
  ```

### Naming Conventions
- **Feature Folders**: Singular lowercase nouns (`modules/auth`, `modules/admin`).
- **File Suffixes**: Explicit layer naming:
  - `<module>.route.js` (e.g., `auth.route.js`)
  - `<module>.controller.js` (e.g., `auth.controller.js`)
  - `<module>.service.js` (e.g., `auth.service.js`)
  - `<module>.repository.js` (e.g., `auth.repository.js`)
  - `<module>.validation.js` (e.g., `auth.validation.js`)
  - `<module>.<layer>.test.js` (e.g., `auth.service.test.js`, `auth.route.test.js`)
- **Classes**: PascalCase (`AuthService`, `AuthRepository`, `AppError`).
- **Functions & Methods**: camelCase (`findByEmail`, `verifyToken`, `login`).
- **Instances**: camelCase matching class name (`const authService = new AuthService(authRepository)`).
- **Zod Schemas**: camelCase suffixed with `Schema` (`loginSchema`, `registerSchema`, `createCourseSchema`).
- **Constants & Env Variables**: UPPER_SNAKE_CASE (`JWT_SECRET`, `PORT`, `SALT_ROUNDS`).

### Error Handling & Express 5 Patterns
- **Native Async Error Propagation**: In Express 5, rejected promises in `async` route handlers and middleware are automatically caught and forwarded to the global error handler. Do not wrap handlers in boilerplate `try/catch` blocks solely to call `next(err)`.
- **Custom Application Error Pattern**:
  ```javascript
  // shared/errors/AppError.js
  class AppError extends Error {
    constructor(message, statusCode = 500, errors = []) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }

  class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
      super(message, 401);
    }
  }

  class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
      super(message, 404);
    }
  }

  module.exports = { AppError, UnauthorizedError, NotFoundError };
  ```

- **Global Error Middleware**:
  ```javascript
  // shared/middleware/errorHandler.js
  const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
      success: false,
      message,
      ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };

  module.exports = errorHandler;
  ```

### Zod Validation Middleware Pattern
Enforce schema contracts before controller execution:
```javascript
// shared/middleware/validate.js
const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error.issues) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    next(error);
  }
};

module.exports = validate;
```

### Dependency Injection Pattern
Wire dependencies explicitly at the route layer or module entry point to enable seamless mocking in unit tests:
```javascript
// modules/auth/auth.route.js
const { Router } = require('express');
const AuthRepository = require('./auth.repository');
const AuthService = require('./auth.service');
const AuthController = require('./auth.controller');
const { loginSchema } = require('./auth.validation');
const validate = require('../../shared/middleware/validate');

const router = Router();

// Instantiate dependencies
const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
```

### Response Standard
All HTTP responses must follow a consistent JSON payload structure:
- **Success**:
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
  }
  ```
- **Error**:
  ```json
  {
    "success": false,
    "message": "Error description",
    "errors": [
      { "field": "email", "message": "Invalid email address format" }
    ]
  }
  ```

### Server-Driven UI (SDUI) Contract
The endpoint `GET /api/admin/dashboard` must return a layout schema compatible with `Frontend/src/shared/sdui/Renderer.jsx`:
```json
{
  "components": [
    {
      "type": "stats",
      "data": { "courses": 42, "faculty": 68, "students": 1240, "rooms": 320 }
    },
    {
      "type": "row",
      "data": {
        "children": [
          { "type": "pie-chart", "span": 4, "data": { ... } },
          { "type": "bar-chart", "span": 8, "data": { ... } }
        ]
      }
    },
    {
      "type": "row",
      "data": {
        "children": [
          { "type": "scheduling-status", "span": 4, "data": { ... } },
          { "type": "table", "span": 8, "data": { ... } }
        ]
      }
    }
  ]
}
```

---

## Important Files

| File Path | Role | Description |
|---|---|---|
| `server.js` | Core Entry Point | Express bootstrap, global middleware (CORS, parsers), route mounting, error handling registration, and HTTP port listening. |
| `db.js` | Database Client | Central database abstraction and connection management. Listed as `"main"` in `package.json`. |
| `package.json` | Dependency Manifest | Node package definition, scripts, production dependencies, and package metadata. |
| `modules/auth/auth.route.js` | Auth Routes | Express router mounting `/login`, `/register`, `/me` endpoints with validation and auth middleware. |
| `modules/auth/auth.validation.js` | Auth Validation | Zod schemas defining payload validation rules for authentication. |
| `modules/auth/auth.controller.js` | Auth Controller | HTTP handlers extracting request payloads and returning formatted responses. |
| `modules/auth/auth.service.js` | Auth Service | Domain logic for password hashing, credential comparison, and JWT issuance. |
| `modules/auth/auth.repository.js` | Auth Data Access | Database query operations for retrieving and saving user records. |
| `modules/admin/admin.route.js` | Admin Routes | Router for `/admin/dashboard` (SDUI) and campus entity management endpoints. |
| `shared/middleware/auth.js` | Auth Middleware | JWT extraction and verification guard (`requireAuth`), binding `req.user`. |
| `shared/middleware/validate.js` | Validation Middleware | Generic middleware validating request bodies against Zod schemas. |
| `shared/middleware/errorHandler.js` | Error Middleware | Central 4-argument Express error handler generating standardized error payloads. |

---

## Runtime/Tooling Preferences

- **Runtime**: **Node.js LTS (v22.x)** (verified environment: Node v22.23.3). Engine minimum is Node `>=18.14.0` driven by Jest 30.
- **Package Manager**: **`npm`** (v10.x, verified environment: npm 10.9.9). Lockfile is `package-lock.json` (`lockfileVersion: 3`).
  - Do **not** commit `yarn.lock`, `pnpm-lock.yaml`, or `bun.lockb` unless a project-wide migration is explicitly initiated.
- **Port & Base URL**: Default port is **`8000`**; base path is **`/api`**.
  - Frontend client is configured at `http://localhost:8000/api` with `withCredentials: true`.
  - Allowed CORS origin: `http://localhost:5173`.
- **Environment Management**: Configuration values are loaded via **`dotenv`** (`^18.0.9`) from `.env`.
  - Required variables: `PORT=8000`, `NODE_ENV=development`, `JWT_SECRET`, `CLIENT_URL=http://localhost:5173`.
- **Module Format**: **ES Modules (ESM)** across the entire backend (`"type": "module"`). Use `import` and `export` consistently with explicit `.js` extensions.

---

## Testing & QA

### Frameworks & Tools
- **Test Runner**: **Jest** (`^30.5.2`).
- **HTTP Assertions**: **Supertest** (`^7.3.1`).
- **Schema Validation**: **Zod** (`^4.6.7`).

### Organization & Naming
- Place tests colocated in feature directories under `modules/<domain>/__tests__/`.
- Use the `<module>.<layer>.test.js` naming convention:
  - Unit tests: `auth.service.test.js`, `auth.validation.test.js`, `auth.repository.test.js`.
  - Integration tests: `auth.route.test.js`.

### Test Architecture & Server Isolation
To enable Supertest without port binding conflicts during test execution, separate the Express `app` declaration from `app.listen()`:
- `server.js` exports `app` directly (`module.exports = app`).
- Only call `app.listen()` when `process.env.NODE_ENV !== 'test'` or when run directly (`require.main === module`).

### Testing Example (Integration Test with Supertest)
```javascript
// modules/auth/__tests__/auth.route.test.js
const request = require('supertest');
const app = require('../../../server');

describe('POST /api/auth/login', () => {
  it('should return 400 when email format is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid-email-address',
        password: 'password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
      ])
    );
  });

  it('should return 400 when password is missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campus.edu' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### Mocking Guidelines
- **External Security Dependencies**: Mock `bcrypt` and `jsonwebtoken` in unit tests to ensure fast, deterministic execution without cryptographic overhead.
- **Repositories**: In `*.service.test.js`, mock the repository layer (`jest.spyOn(authRepository, 'findByEmail')`) rather than connecting to a physical database.
- **Coverage**: Aim for 100% test coverage on `*.service.js` business logic and `*.validation.js` input boundary rules.
