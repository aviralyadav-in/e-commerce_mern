# Niya Bags — Full Stack Setup & Deployment Guide
**Architecture:** MERN Stack E-Commerce Platform (Monorepo Layout)  
**Components:** Backend (API), Frontend (Admin Panel), Storefront (Customer Web App)  

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Prerequisites](#2-prerequisites)
3. [Complete Environment Variables (.env) Files](#3-complete-environment-variables-env-files)
   - [Backend Environment File (`backend/.env`)](#a-backend-backendenv)
   - [Admin Panel Environment File (`frontend/.env`)](#b-admin-panel-frontendenv)
   - [Storefront Environment File (`storefront/.env`)](#c-customer-storefront-storefrontenv)
4. [Step-by-Step Installation & Setup](#4-step-by-step-installation--setup)
   - [Step 1: Backend Setup](#step-1-backend-setup)
   - [Step 2: Admin Panel Setup](#step-2-admin-panel-setup)
   - [Step 3: Customer Storefront Setup](#step-3-customer-storefront-setup)
5. [Default Admin Credentials & First Login](#5-default-admin-credentials--first-login)
6. [How to Run All Three Services Concurrently](#6-how-to-run-all-three-services-concurrently)
7. [System Verification & Health Check](#7-system-verification--health-check)
8. [Common Troubleshooting & FAQ](#8-common-troubleshooting--faq)

---

## 1. Project Overview & Architecture

The project consists of three independent Node.js applications working together:

| Folder | Technology Stack | Default Port | Role & Functionality |
| :--- | :--- | :--- | :--- |
| **`backend/`** | Node.js, Express 5, MongoDB, Mongoose 9, JWT, Multer | **`5000`** | Central REST API, DB connection, Authentication, File Uploads, Business Logic |
| **`frontend/`** | React 19, Redux Toolkit, Vite, Tailwind CSS v4 | **`5174`** | Admin Panel for managing products, inventory, orders, reviews, and settings |
| **`storefront/`** | React 19, Zustand, Vite, Tailwind CSS v4, Lucide | **`5173`** | Customer-facing e-commerce storefront for browsing, cart, wishlist, and checkout |

---

## 2. Prerequisites

Before setting up, ensure you have the following software installed on your machine:

1. **Node.js**: Version `18.x`, `20.x`, or `24.x` (LTS recommended)
   * Verify via terminal: `node -v`
2. **npm**: Version `9.x` or higher
   * Verify via terminal: `npm -v`
3. **MongoDB**:
   * **Option A (Local):** MongoDB Community Server running locally on port `27017`.
   * **Option B (Cloud):** MongoDB Atlas connection string (`mongodb+srv://...`).
4. **Git** (optional, for version control)

---

## 3. Complete Environment Variables (.env) Files

Create the respective `.env` files in each of the three folders.

### A. Backend (`backend/.env`)

Path: `c:\Users\ragha\Desktop\assignment2\backend\.env`

```env
# ==============================================================================
# SERVER & APPLICATION CONFIGURATION
# ==============================================================================
PORT=5000
NODE_ENV=development

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================
# Local MongoDB instance:
MONGODB_URI=mongodb://localhost:27017/ecommerce

# Or use MongoDB Atlas cloud URI (uncomment if using Atlas):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority

# ==============================================================================
# SECURITY & AUTHENTICATION (JWT)
# ==============================================================================
# Secret key used to sign and verify JWT tokens (use a long, random string in production)
JWT_SECRET=GiR2KFn8E7LHwdQuYsNj15fZWTRo9WGF

# Cookie security flag:
# Set to 'false' for local development over HTTP (localhost).
# Set to 'true' in production when running over HTTPS.
COOKIE_SECURE=false

# ==============================================================================
# INITIAL DEFAULT SUPERADMIN CREDENTIALS
# (Automatically created in DB on first server startup if no admin exists)
# ==============================================================================
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123

# ==============================================================================
# CORS & FRONTEND URL CONFIGURATION
# ==============================================================================
# Comma-separated list or single URL for allowed origins in production
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# ==============================================================================
# MEDIA STORAGE CONFIGURATION
# ==============================================================================
# Media files are saved locally on disk inside backend/uploads and served statically.
# (Optional) If you integrate Cloudinary in the future:
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

#### Explanation of Backend Variables:
* `PORT`: Port number for the Express API server (default `5000`).
* `MONGODB_URI`: Connection string pointing to your local MongoDB or Atlas cloud database.
* `JWT_SECRET`: Secret cryptographic key for signing user/admin authentication cookies.
* `COOKIE_SECURE`: Controls the `Secure` flag on HTTP cookies. Must be `false` on `http://localhost`.
* `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Used by `backend/config/createAdmin.js` to automatically seed the master admin account on server startup.
* `FRONTEND_URL` & `ADMIN_URL`: Explicit origins whitelisted in CORS middleware.

---

### B. Admin Panel (`frontend/.env`)

Path: `c:\Users\ragha\Desktop\assignment2\frontend\.env`

```env
# ==============================================================================
# NIYA BAGS ADMIN PANEL ENVIRONMENT
# ==============================================================================
# The base URL of the Express backend API
VITE_API_BASE_URL=http://localhost:5000/api

# The URL where the customer storefront is running (for "Preview Storefront" link)
VITE_STOREFRONT_URL=http://localhost:5173
```

#### Explanation of Frontend Variables:
* `VITE_API_BASE_URL`: Injected into `frontend/src/api/axios.js` to send requests to the backend.
* `VITE_STOREFRONT_URL`: Injected into `frontend/src/utils/storefrontUrl.js` for external preview links.

---

### C. Customer Storefront (`storefront/.env`)

Path: `c:\Users\ragha\Desktop\assignment2\storefront\.env`

```env
# ==============================================================================
# NIYA BAGS CUSTOMER STOREFRONT ENVIRONMENT
# ==============================================================================
# The base URL of the Express backend API
VITE_API_BASE_URL=http://localhost:5000/api

# The URL where the admin panel is running
VITE_ADMIN_URL=http://localhost:5174
```

#### Explanation of Storefront Variables:
* `VITE_API_BASE_URL`: Injected into `storefront/src/lib/api.js` for catalog, cart, wishlist, auth, and order calls.
* `VITE_ADMIN_URL`: Used for internal admin navigation links.

---

## 4. Step-by-Step Installation & Setup

Open your terminal (PowerShell, Command Prompt, or VS Code Terminal) and follow these steps:

### Step 1: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Verify the `.env` file:**
   Make sure `backend/.env` exists with the values defined in Section 3A.

4. **Ensure MongoDB is running:**
   * If using local MongoDB: ensure the MongoDB Windows Service is active or run `mongod` in a separate terminal.
   * If using MongoDB Atlas: ensure your IP address is whitelisted in MongoDB Atlas Network Access (`0.0.0.0/0` for development).

5. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   *You should see output similar to:*
   ```text
   Server running in development mode on port 5000
   MongoDB Connected: localhost
   Admin created successfully: admin@gmail.com (or "Admin already exists — skipping")
   Data migrations executed successfully
   ```

---

### Step 2: Admin Panel Setup

1. **Open a NEW terminal window and navigate to `frontend`:**
   ```bash
   cd frontend
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Verify the `.env` file:**
   Make sure `frontend/.env` exists with the values defined in Section 3B.

4. **Start the Admin Panel development server:**
   ```bash
   npm run dev -- --port 5174
   ```
   *Output:*
   ```text
   VITE v8.2.0 ready in 350 ms
   ➜  Local:   http://localhost:5174/
   ➜  Network: use --host to expose
   ```

---

### Step 3: Customer Storefront Setup

1. **Open a THIRD terminal window and navigate to `storefront`:**
   ```bash
   cd storefront
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Verify the `.env` file:**
   Make sure `storefront/.env` exists with the values defined in Section 3C.

4. **Start the Storefront development server:**
   ```bash
   npm run dev -- --port 5173
   ```
   *Output:*
   ```text
   VITE v8.3.0 ready in 400 ms
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

---

## 5. Default Admin Credentials & First Login

Once all three servers are running:

1. Open your web browser and go to:
   **`http://localhost:5174/login`**
2. Enter the default SuperAdmin credentials:
   * **Email:** `admin@gmail.com`
   * **Password:** `Admin@123`
3. Click **"Sign In"**.
4. You will be redirected to the **Admin Dashboard** (`/dashboard`).

---

## 6. How to Run All Three Services Concurrently

To avoid managing 3 separate terminals, you can use one of the following methods:

### Method 1: VS Code Integrated Terminal Tabs (Recommended)
* In VS Code, open 3 terminal split tabs:
  * Tab 1: `cd backend && npm run dev`
  * Tab 2: `cd frontend && npm run dev -- --port 5174`
  * Tab 3: `cd storefront && npm run dev -- --port 5173`

### Method 2: Root Run Script with `concurrently`
From the project root directory (`assignment2`), install `concurrently`:
```bash
npm install -g concurrently
```
Then run all 3 in a single command:
```bash
concurrently --kill-others "npm run dev --prefix backend" "npm run dev --prefix frontend -- --port 5174" "npm run dev --prefix storefront -- --port 5173"
```

---

## 7. System Verification & Health Check

Verify that all subsystems are communicating properly:

1. **Backend API Health Check:**
   Open `http://localhost:5000/api/settings` in your browser.  
   *Expected result:* JSON response returning store settings (`status: 200`).

2. **Admin Panel Verification:**
   Open `http://localhost:5174`.  
   *Expected result:* Admin login page or dashboard renders with active navigation sidebar.

3. **Storefront Verification:**
   Open `http://localhost:5173`.  
   *Expected result:* Niya Bags homepage renders with purple announcement bar, product categories, and header icons.

4. **Image Upload Test:**
   In Admin Panel &rarr; Banners or Products &rarr; upload an image.  
   *Expected result:* The image appears in the table and is saved inside `backend/uploads/`.

---

## 8. Common Troubleshooting & FAQ

### Issue 1: "MongoDB Connection Error: connect ECONNREFUSED 127.0.0.1:27017"
* **Cause:** The local MongoDB service is not running.
* **Solution:**
  * Press `Win + R`, type `services.msc`, locate **MongoDB Server**, right-click, and select **Start**.
  * Or use a MongoDB Atlas cloud URI in `backend/.env`.

### Issue 2: "CORS Error: Not allowed by CORS"
* **Cause:** The frontend or storefront is running on a port not listed in CORS whitelist.
* **Solution:**
  * Ensure `backend/index.js` has `FRONTEND_URL` and `ADMIN_URL` matching your running ports (`5173` and `5174`).
  * Backend allows all `localhost` and `127.0.0.1` origins automatically.

### Issue 3: Admin Login fails or says "Invalid credentials"
* **Cause:** Password mismatch or admin user was not seeded.
* **Solution:**
  * Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`.
  * If needed, delete the admin record in MongoDB using MongoDB Compass or Mongo shell:
    `db.admins.deleteMany({})`
  * Restart backend (`npm run dev`) to let `createAdmin()` re-create the user with fresh credentials.

### Issue 4: Port 5000 / 5173 / 5174 Already in Use
* **Cause:** A previous node process is still holding the port.
* **Solution (Windows PowerShell):**
  ```powershell
  # Find process using port 5000:
  netstat -ano | findstr :5000
  # Kill the process using PID:
  taskkill /PID <PID_NUMBER> /F
  ```

---
*Setup guide maintained for the Niya Bags MERN Stack platform.*
