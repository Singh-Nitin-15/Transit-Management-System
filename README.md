# 🚍 Bus Management System

A full-stack web application for managing a bus transportation network — built with **MySQL**, **Node.js/Express**, and **React (Vite)**.

---

## 📁 Project Structure

```
bus-management-system/
├── database.sql          ← MySQL schema + 10 sample records per table
├── backend/
│   ├── .env              ← DB credentials (edit this!)
│   ├── db.js             ← MySQL connection pool
│   ├── server.js         ← Express app (port 5000)
│   └── routes/
│       ├── buses.js      ← GET/POST /api/buses
│       ├── drivers.js    ← GET/POST /api/drivers
│       ├── passengers.js ← GET/POST /api/passengers
│       ├── routes.js     ← GET /api/routes
│       ├── schedules.js  ← GET/POST /api/schedules
│       ├── bookings.js   ← GET/POST /api/bookings
│       └── import.js     ← POST /api/import/:tableName (CSV)
└── frontend/
    └── src/
        ├── App.jsx       ← React Router entry
        ├── index.css     ← Global dark-blue theme
        ├── components/
        │   └── Sidebar.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Buses.jsx
            ├── Schedules.jsx
            ├── Bookings.jsx
            ├── Drivers.jsx
            ├── Passengers.jsx
            └── ImportData.jsx
```

---

## ⚙️ Setup & Run

### 1. Database

```sql
-- In MySQL Workbench or CLI:
source /path/to/bus-management-system/database.sql
```

### 2. Backend

```bash
cd backend

# Edit .env with your MySQL credentials:
# DB_PASSWORD=your_actual_password

npm install       # (already done if setup was run)
npm start         # Starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install       # (already done)
npm run dev       # Starts on http://localhost:5173
```

---

## 🔗 API Endpoints

| Method | Endpoint                    | Description                       |
|--------|-----------------------------|-----------------------------------|
| GET    | `/api/dashboard`            | Summary counts for all tables     |
| GET    | `/api/buses`                | All buses                         |
| POST   | `/api/buses`                | Add a bus                         |
| GET    | `/api/drivers`              | All drivers                       |
| POST   | `/api/drivers`              | Add a driver                      |
| GET    | `/api/passengers`           | All passengers                    |
| POST   | `/api/passengers`           | Add a passenger                   |
| GET    | `/api/routes`               | All routes (with city names)      |
| GET    | `/api/schedules`            | All schedules (joined)            |
| POST   | `/api/schedules`            | Add a schedule                    |
| GET    | `/api/bookings`             | All bookings (joined)             |
| POST   | `/api/bookings`             | Create a booking                  |
| POST   | `/api/import/buses`         | CSV import for buses              |
| POST   | `/api/import/drivers`       | CSV import for drivers            |
| POST   | `/api/import/passengers`    | CSV import for passengers         |
| POST   | `/api/import/routes`        | CSV import for routes             |

---

## 📊 Database Schema (3NF)

| Table      | PK          | FKs / Notes                                            |
|------------|-------------|--------------------------------------------------------|
| City       | city_id     | Lookup table for source/destination                   |
| Route      | route_id    | → City (source, destination), CHECK src ≠ dest        |
| Bus        | bus_id      | ENUM: AC / Non-AC / Sleeper, Active / Inactive        |
| Driver     | driver_id   | Unique license_number                                  |
| Schedule   | schedule_id | → Bus, Route, Driver; CHECK arrival > departure        |
| Passenger  | passenger_id| Unique email                                           |
| Booking    | booking_id  | → Passenger, Schedule; UNIQUE (schedule_id, seat_no)  |

---

## 📥 CSV Import Format

**Buses:** `bus_number,bus_type,capacity,status`  
**Drivers:** `name,license_number,phone,experience_years`  
**Passengers:** `name,email,phone`  
**Routes:** `source_city_id,destination_city_id,distance_km`

> Duplicate rows are silently skipped (`INSERT IGNORE`).

---

## 🛠️ Tech Stack

- **Database**: MySQL 8+
- **Backend**: Node.js, Express, mysql2, multer, csv-parser, dotenv, cors
- **Frontend**: React 18, Vite, React Router v6, plain CSS (no UI library)
