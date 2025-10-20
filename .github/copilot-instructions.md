# Copilot Instructions for Field Service Management System

## Project Overview
- **Type:** Node.js/Express backend with EJS views, MongoDB (Mongoose), and role-based authentication.
- **Purpose:** Manages users (superadmin, admin, worker, customer), jobs, payments, notifications, and feedback for a field service business.
- **Key Directories:**
  - `models/`: Mongoose schemas for core entities (User, Job, Invoice, etc.)
  - `controllers/`: Route logic (e.g., `authController.js` for registration/login)
  - `routes/`: Express routers, grouped by user role
  - `middlewares/`: Auth and role-based access control
  - `views/`: EJS templates for different user roles
  - `config/db.js`: MongoDB connection logic
  - `public/`: Static assets (CSS, JS)

## Architecture & Patterns
- **User Model:** Uses Mongoose discriminators for role-specific fields (`superadmin`, `admin`, `worker`, `customer`).
- **Authentication:** JWT-based, with `authMiddleware.js` for token validation and `roleMiddleware.js` for role checks.
- **API Routing:**
  - `/api/auth`: Registration & login
  - `/api/admin`, `/api/worker`, `/api/customer`, `/api/superadmin`: Role-specific APIs
- **Views:** EJS templates organized by user type; layouts in `views/layoutes/`.
- **Error Handling:** Returns JSON error messages for API endpoints; logs errors to console.

## Developer Workflows
- **Start (dev):** `npm run dev` (uses `nodemon`)
- **Start (prod):** `npm start`
- **Environment:** Requires `.env` with `MONGO_URI` and `JWT_SECRET`.
- **No built-in tests** (default `npm test` is a placeholder).

## Conventions & Tips
- **Role-based access:** Always use `authenticate` and `authorizeRoles` middleware for protected routes.
- **Model imports:** Use destructuring for role models: `{ User, superAdmin, Admin, Worker, Customer }` from `models/User.js`.
- **API responses:** Remove sensitive fields (e.g., password) before sending user objects.
- **Add new roles:** Extend `User` model with a new discriminator and update `roleMiddleware.js`.
- **Static files:** Served from `public/`.
- **EJS views:** Use layouts in `views/layoutes/` for shared UI.

## Integration Points
- **MongoDB:** Connection via `config/db.js` using `MONGO_URI` from `.env`.
- **JWT:** Secret from `.env` as `JWT_SECRET`.
- **External dependencies:** See `package.json` for core libraries (express, mongoose, ejs, bcryptjs, jsonwebtoken, etc.).

## Examples
- **Protecting a route:**
  ```js
  router.get('/dashboard', authenticate, authorizeRoles('admin'), handler)
  ```
- **Creating a new user:**
  ```js
  const newUser = await User.create({ name, email, ... })
  ```

---

For questions about project structure or conventions, see the referenced files above. Update this file if you introduce new roles, workflows, or architectural changes.
