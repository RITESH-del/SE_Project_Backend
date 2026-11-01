# Contributing to the Backend

Thank you for contributing! This guide outlines the development workflow, architecture patterns, coding standards, and pull request checklist for working on the Academic Campus & Timetable Management Backend API.

---

## 1. Prerequisites & Environment

Before you begin, ensure you have:
- **Node.js**: `v18.14.0` or higher (`v22+` LTS recommended, verified on `v22.23.3`).
- **Package Manager**: **`npm`** (v10+).
  - Do **not** use `yarn`, `pnpm`, or `bun`. The repository enforces standard npm via `package-lock.json` (`lockfileVersion: 3`).
- **Environment Configuration**:
  - Create a `.env` file in the `Backend/` root:
    ```env
    PORT=8000
    NODE_ENV=development
    JWT_SECRET=super_secret_jwt_key_for_local_dev_only
    JWT_EXPIRES_IN=24h
    CLIENT_URL=http://localhost:5173
    ```
- **Frontend Service (Optional for standalone API development)**:
  - The client dashboard runs on `http://localhost:5173` and expects the backend API at `http://localhost:8000/api`.

---

## 2. Quickstart & Development Workflow

```bash
# 1. Navigate to the Backend directory
cd Backend

# 2. Install dependencies cleanly
npm install

# 3. Start local development server with Node 22 native watch mode
node --watch server.js
# Or start via standard npm script
npm start

# 4. Run the full test suite with Jest
npx jest

# 5. Run tests in watch mode during development
npx jest --watch

# 6. Run a specific test file
npx jest modules/auth/__tests__/auth.service.test.js

# 7. Check test coverage
npx jest --coverage --detectOpenHandles --forceExit
```

---

## 3. Architecture & Where Code Lives

The backend implements a **Modular Layered Architecture (Vertical Slices with Controller-Service-Repository tiers)**:

```
Backend/
├── config/              # Centralized environment & connection configurations
├── modules/             # Vertical business domain slices
│   ├── auth/            # Authentication & authorization domain
│   │   ├── auth.route.js        # Route definitions & middleware registration
│   │   ├── auth.validation.js   # Zod input schemas (loginSchema, registerSchema)
│   │   ├── auth.controller.js   # HTTP transport handlers (req/res)
│   │   ├── auth.service.js      # Business logic (bcrypt hashing, JWT issuance)
│   │   ├── auth.repository.js   # Data persistence queries
│   │   └── __tests__/           # Colocated unit & integration tests
│   └── admin/           # Administrative portal domain
│       ├── admin.route.js       # Admin endpoints (/dashboard, /campus/*, /timetable)
│       ├── admin.validation.js  # Entity & timetable Zod schemas
│       ├── admin.controller.js  # SDUI dashboard & CRUD controllers
│       ├── admin.service.js     # SDUI schema builder & timetable conflict engine
│       ├── admin.repository.js  # Campus entity data access
│       └── __tests__/           # Admin tests
├── shared/              # Cross-cutting infrastructure
│   ├── middleware/      # Global & route middleware (auth.js, validate.js, errorHandler.js)
│   ├── errors/          # Custom error classes (AppError.js)
│   └── utils/           # Shared helper functions
├── db.js                # Database client abstraction and connection pool
├── package.json         # Dependency manifests & npm scripts
└── server.js            # Express application bootstrap & HTTP listener
```

### Layer Responsibilities
- **`*.route.js`**: Defines URL routes, HTTP verbs, and binds validation/auth middleware.
- **`*.validation.js`**: Enforces strict payload contracts via **Zod** schemas.
- **`*.controller.js`**: Extracts request data (`req.body`, `req.params`, `req.user`) and sends JSON responses (`res.status().json()`).
- **`*.service.js`**: Contains pure business logic, security rules, and orchestrates repositories.
- **`*.repository.js`**: Executes database queries and isolates SQL/persistence logic.
- **`db.js`**: Manages the database connection pool and execution interface.

---

## 4. Common Contribution Tasks

### A. Adding an Endpoint to an Existing Module
Follow the 5-layer workflow:

1. **Validation (`<module>.validation.js`)**:
   Define the Zod schema for incoming data:
   ```javascript
   const { z } = require('zod');

   const updateProfileSchema = z.object({
     name: z.string().min(2, 'Name must be at least 2 characters'),
     email: z.string().email('Invalid email address format'),
   });

   module.exports = { updateProfileSchema };
   ```

2. **Repository (`<module>.repository.js`)**:
   Add the query method:
   ```javascript
   async updateById(id, { name, email }) {
     const res = await this.db.query(
       'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
       [name, email, id]
     );
     return res.rows[0] || null;
   }
   ```

3. **Service (`<module>.service.js`)**:
   Implement business logic and domain checks:
   ```javascript
   async updateProfile(userId, data) {
     const updated = await this.authRepository.updateById(userId, data);
     if (!updated) {
       const error = new Error('User not found');
       error.statusCode = 404;
       throw error;
     }
     return updated;
   }
   ```

4. **Controller (`<module>.controller.js`)**:
   Extract parameters and return the standardized response:
   ```javascript
   updateProfile = async (req, res) => {
     const result = await this.authService.updateProfile(req.user.id, req.body);
     res.status(200).json({
       success: true,
       message: 'Profile updated successfully',
       data: result,
     });
   };
   ```

5. **Route (`<module>.route.js`)**:
   Wire the route with middleware:
   ```javascript
   const { requireAuth } = require('../../shared/middleware/auth');
   const validate = require('../../shared/middleware/validate');
   const { updateProfileSchema } = require('./auth.validation');

   router.put('/profile', requireAuth, validate(updateProfileSchema), authController.updateProfile);
   ```

6. **Tests (`modules/<module>/__tests__/`)**:
   Add unit tests in `<module>.service.test.js` and integration tests in `<module>.route.test.js`.

---

### B. Creating a New Feature Slice
1. Create a new directory under `modules/<feature_name>/` (e.g., `modules/campus/`).
2. Add the 5 layer files:
   - `<feature_name>.route.js`
   - `<feature_name>.validation.js`
   - `<feature_name>.controller.js`
   - `<feature_name>.service.js`
   - `<feature_name>.repository.js`
3. Instantiate and wire dependencies in `<feature_name>.route.js`:
   ```javascript
   const { Router } = require('express');
   const CampusRepository = require('./campus.repository');
   const CampusService = require('./campus.service');
   const CampusController = require('./campus.controller');

   const router = Router();
   const repo = new CampusRepository();
   const service = new CampusService(repo);
   const controller = new CampusController(service);

   router.get('/rooms', controller.getRooms);
   module.exports = router;
   ```
4. Mount the new router in `server.js`:
   ```javascript
   const campusRoutes = require('./modules/campus/campus.route');
   app.use('/api/campus', campusRoutes);
   ```

---

### C. Providing Server-Driven UI (SDUI) Components
The administrative dashboard renders components dynamically using the layout schema consumed by `Frontend/src/shared/sdui/Renderer.jsx`.

When implementing `GET /api/admin/dashboard`, structure responses to match the component registry:
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

## 5. Coding Standards & Conventions

### Module System: ES Modules (ESM)
The backend executes natively under Node.js ESM (`"type": "module"` in `package.json`):
- Always use `import ... from '...'` and `export ...`.
- Always include explicit file extensions for relative imports (e.g., `import prisma from '../../db.js'`).
- Do **not** use CommonJS `require` / `module.exports`.
### Naming Conventions
- **Folders**: Singular lowercase nouns (`modules/auth`, `modules/admin`).
- **Layer Files**: `<module>.<layer>.js` (e.g., `auth.service.js`, `auth.route.js`).
- **Tests**: `modules/<module>/__tests__/<module>.<layer>.test.js`.
- **Classes**: PascalCase (`AuthService`, `AuthRepository`, `AppError`).
- **Functions & Methods**: camelCase (`findByEmail`, `comparePassword`).
- **Schemas**: camelCase ending with `Schema` (`loginSchema`, `createCourseSchema`).
- **Constants & Env Vars**: UPPER_SNAKE_CASE (`PORT`, `JWT_SECRET`).

### Error Handling & Express 5
- **Express 5 Native Promise Rejection**: Route handlers do **not** need wrapper packages like `express-async-handler`. Any thrown error or rejected promise inside an `async` function automatically propagates to the centralized error middleware.
- **Custom Application Errors**: Throw instances with an HTTP `statusCode` property:
  ```javascript
  const error = new Error('Resource not found');
  error.statusCode = 404;
  throw error;
  ```
- **Consistent Response Shapes**:
  - Success: `{ "success": true, "message": "...", "data": { ... } }`
  - Error: `{ "success": false, "message": "...", "errors": [ ... ] }`

### Security Best Practices
- **Password Hashing**: Always hash passwords using `bcrypt` with a minimum salt rounds of `10`. Never log or persist plaintext passwords.
- **Authentication**: Stateless tokens using `jsonwebtoken`. Extract user context in `shared/middleware/auth.js` and attach to `req.user`.
- **Never Commit Secrets**: Keep `.env` out of version control. Use `.env.example` to document required variables.

---

## 6. Testing & Quality Assurance

### Testing Strategy
- **Unit Tests (`*.service.test.js`, `*.validation.test.js`)**:
  - Test business logic and edge cases in isolation.
  - Mock repository calls and external libraries (`bcrypt`, `jsonwebtoken`) to keep tests fast and deterministic.
- **Integration Tests (`*.route.test.js`)**:
  - Test end-to-end HTTP pipeline using `supertest`.
  - Pass the Express `app` instance directly to `supertest(app)` without binding network ports.

### Integration Test Example
```javascript
// modules/auth/__tests__/auth.route.test.js
const request = require('supertest');
const app = require('../../../server');

describe('POST /api/auth/login', () => {
  it('should return 400 when email is malformed', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0].field).toBe('email');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
```

---

## 7. Pull Request (PR) Checklist

Before submitting your pull request, verify:

- [ ] All tests pass via `npx jest`.
- [ ] Code strictly uses ES Modules (`import` / `export` with `.js` extensions).
- [ ] Every new endpoint is validated with a Zod schema via `validate(schema)`.
- [ ] Database queries are confined to the repository layer (`*.repository.js`) — no direct queries in controllers or services.
- [ ] Sensitive secrets (passwords, JWT secrets, database credentials) are not hardcoded or committed.
- [ ] File and directory names adhere to the `<module>.<layer>.js` pattern.
- [ ] Colocated unit or integration tests are added under `modules/<module>/__tests__/`.
- [ ] PR description explains the feature/fix, notes affected endpoints, and references related tickets.
