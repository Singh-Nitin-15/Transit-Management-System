# 🚍 Bus Management System

A robust, full-stack web application designed for managing a complete bus transportation network. It provides tools for admins to manage fleets, drivers, routes, and schedules, alongside a passenger booking system.

---

## ✨ Features

- **Secure Authentication:** JWT-based login with role-based access control (Admin/User).
- **Dashboard Analytics:** High-level summary counts and statistics.
- **Fleet & Crew Management:** Manage buses and drivers efficiently.
- **Route & Schedule Planning:** Define source/destination routes and schedule trips.
- **Booking System:** Seamless passenger reservations with seat mapping.
- **Bulk Data Import:** Import buses, drivers, passengers, and routes via CSV.
- **Modern UI:** Responsive, aesthetically pleasing interface built with Tailwind CSS.

---

## 🛠️ Tech Stack

**Frontend:**
- React 19 + Vite
- React Router DOM v7
- Tailwind CSS

**Backend:**
- Node.js & Express.js
- MySQL (via `mysql2`)
- JWT & bcryptjs for authentication
- Multer & CSV-Parser for bulk imports
- Zod for validation

---

## 📁 Project Structure

```text
bus-management-system/
├── database.sql          ← MySQL schema + Sample records
├── backend/
│   ├── .env              ← Environment variables (DB credentials, JWT Secret)
│   ├── db.js             ← MySQL connection pool
│   ├── server.js         ← Express app entry point
│   ├── seedAdmin.js      ← Script to generate super admin account
│   └── routes/           ← Express API routes (Buses, Drivers, Bookings, Auth, etc.)
└── frontend/
    └── src/
        ├── App.jsx       ← React Router entry
        ├── index.css     ← Global styles & Tailwind directives
        ├── components/   ← Reusable UI components (Sidebar, Navbar, etc.)
        └── pages/        ← Application Views (Dashboard, Login, Schedules, etc.)
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- MySQL Server (v8+ recommended)

### 2. Database Setup
Create a new database and import the provided schema:
```sql
-- In your MySQL client or CLI:
CREATE DATABASE bus_management;
USE bus_management;
SOURCE /path/to/bus-management-system/database.sql;
```

### 3. Backend Setup
Navigate to the backend directory, install dependencies, and configure environment variables.

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory based on this template:
```env
# Server
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bus_management

# Auth & Admin Seeding
JWT_SECRET=your_super_secret_key_here
SUPER_ADMIN_NAME="Super Admin"
SUPER_ADMIN_EMAIL="admin@bus.com"
SUPER_ADMIN_PASSWORD="securepassword123"
```

**Seed the initial Admin account:**
```bash
npm run seed:admin
```

**Start the backend server:**
```bash
npm run dev    # For development (nodemon)
# OR
npm start      # For production
```
*(Server will start at `http://localhost:5000`)*

### 4. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and run the app.

```bash
cd frontend
npm install
npm run dev
```
*(App will be available at `http://localhost:5173`)*

---

## 🔑 Default Credentials

If you ran the `npm run seed:admin` script, you can log in to the admin panel using the credentials specified in your `.env` file. By default:
- **Email:** `admin@bus.com` (or whatever you set in `.env`)
- **Password:** `securepassword123`

---

## 🔗 Core API Endpoints

| Method | Endpoint                    | Description                       |
|--------|-----------------------------|-----------------------------------|
| POST   | `/api/auth/login`           | User/Admin login (JWT generation) |
| GET    | `/api/dashboard`            | Summary counts for all tables     |
| GET    | `/api/buses`                | Retrieve all buses                |
| POST   | `/api/buses`                | Add a new bus                     |
| GET    | `/api/drivers`              | Retrieve all drivers              |
| GET    | `/api/routes`               | Retrieve all routes               |
| POST   | `/api/schedules`            | Add a new trip schedule           |
| POST   | `/api/bookings`             | Create a new passenger booking    |
| POST   | `/api/import/:tableName`    | Upload CSV for bulk data entry    |

---

## 📥 CSV Import Formats

When using the Bulk Import feature, ensure your CSV files match these headers exactly:

- **Buses:** `bus_number,bus_type,capacity,status`
- **Drivers:** `name,license_number,phone,experience_years`
- **Passengers:** `name,email,phone`
- **Routes:** `source_city_id,destination_city_id,distance_km`

*(Note: Duplicate rows are handled gracefully via `INSERT IGNORE`)*

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
