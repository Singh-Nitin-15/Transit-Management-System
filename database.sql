-- ============================================================
--  Public Transport Management System — Database Schema
--  Separate Bus & Train | JWT Auth | Role-based Access
-- ============================================================

DROP DATABASE IF EXISTS bus_management;
CREATE DATABASE bus_management;
USE bus_management;

-- ─────────────────────────────────────────
-- 1. USERS (Auth)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    user_id       INT           AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('admin','user') NOT NULL DEFAULT 'user',
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- 2. ADMIN INVITES (single-use email-bound tokens)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_invites (
    invite_id   INT          AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(150) NOT NULL,
    token       VARCHAR(64)  NOT NULL UNIQUE,
    used        TINYINT(1)   NOT NULL DEFAULT 0,
    expires_at  DATETIME     NOT NULL,
    created_by  INT          NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 2. CITY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS City (
    city_id   INT          AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL UNIQUE
);

-- ─────────────────────────────────────────
-- 3. ROUTE (shared for Bus & Train)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Route (
    route_id            INT  AUTO_INCREMENT PRIMARY KEY,
    source_city_id      INT  NOT NULL,
    destination_city_id INT  NOT NULL,
    distance_km         INT  NOT NULL,
    CONSTRAINT fk_route_src  FOREIGN KEY (source_city_id)      REFERENCES City(city_id),
    CONSTRAINT fk_route_dest FOREIGN KEY (destination_city_id) REFERENCES City(city_id),
    CONSTRAINT chk_route_diff CHECK (source_city_id <> destination_city_id)
);

-- ─────────────────────────────────────────
-- 4. BUS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Bus (
    bus_id     INT          AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(20)  NOT NULL UNIQUE,
    bus_type   ENUM('AC','Non-AC','Sleeper') NOT NULL,
    capacity   INT          NOT NULL,
    status     ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'
);

-- ─────────────────────────────────────────
-- 5. BUS DRIVER
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS BusDriver (
    driver_id        INT          AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    license_number   VARCHAR(30)  NOT NULL UNIQUE,
    phone            VARCHAR(15)  NOT NULL,
    experience_years INT          NOT NULL,
    CONSTRAINT chk_busdriver_phone CHECK (phone REGEXP '^[0-9]{10}$')
);

-- ─────────────────────────────────────────
-- 6. BUS SCHEDULE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS BusSchedule (
    schedule_id    INT            AUTO_INCREMENT PRIMARY KEY,
    bus_id         INT            NOT NULL,
    route_id       INT            NOT NULL,
    driver_id      INT            NOT NULL,
    departure_time DATETIME       NOT NULL,
    arrival_time   DATETIME       NOT NULL,
    fare           DECIMAL(10,2)  NOT NULL,
    CONSTRAINT fk_bsched_bus    FOREIGN KEY (bus_id)    REFERENCES Bus(bus_id),
    CONSTRAINT fk_bsched_route  FOREIGN KEY (route_id)  REFERENCES Route(route_id),
    CONSTRAINT fk_bsched_driver FOREIGN KEY (driver_id) REFERENCES BusDriver(driver_id),
    CONSTRAINT chk_bsched_times CHECK (arrival_time > departure_time)
);

-- ─────────────────────────────────────────
-- 7. BUS BOOKING (user-owned)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS BusBooking (
    booking_id     INT  AUTO_INCREMENT PRIMARY KEY,
    user_id        INT  NOT NULL,
    schedule_id    INT  NOT NULL,
    booking_date   DATE NOT NULL DEFAULT (CURRENT_DATE),
    seat_number    INT  NOT NULL,
    payment_status ENUM('Paid','Pending') NOT NULL DEFAULT 'Pending',
    status         ENUM('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
    CONSTRAINT fk_bbooking_user     FOREIGN KEY (user_id)     REFERENCES users(user_id),
    CONSTRAINT fk_bbooking_schedule FOREIGN KEY (schedule_id) REFERENCES BusSchedule(schedule_id),
    CONSTRAINT uq_bus_seat          UNIQUE (schedule_id, seat_number)
);

-- ─────────────────────────────────────────
-- 8. TRAIN
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Train (
    train_id        INT          AUTO_INCREMENT PRIMARY KEY,
    train_number    VARCHAR(20)  NOT NULL UNIQUE,
    train_name      VARCHAR(100) NOT NULL,
    train_type      ENUM('Express','Passenger','Superfast','Rajdhani','Shatabdi') NOT NULL,
    total_coaches   INT          NOT NULL DEFAULT 12,
    seats_per_coach INT          NOT NULL DEFAULT 72,
    status          ENUM('Active','Inactive') NOT NULL DEFAULT 'Active'
);

-- ─────────────────────────────────────────
-- 9. TRAIN DRIVER (Loco Pilot)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS TrainDriver (
    loco_id          INT          AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    employee_id      VARCHAR(30)  NOT NULL UNIQUE,
    phone            VARCHAR(15)  NOT NULL,
    experience_years INT          NOT NULL,
    CONSTRAINT chk_traindriver_phone CHECK (phone REGEXP '^[0-9]{10}$')
);

-- ─────────────────────────────────────────
-- 10. TRAIN SCHEDULE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS TrainSchedule (
    schedule_id    INT            AUTO_INCREMENT PRIMARY KEY,
    train_id       INT            NOT NULL,
    route_id       INT            NOT NULL,
    loco_id        INT            NOT NULL,
    departure_time DATETIME       NOT NULL,
    arrival_time   DATETIME       NOT NULL,
    fare           DECIMAL(10,2)  NOT NULL,
    platform_no    INT            NOT NULL DEFAULT 1,
    CONSTRAINT fk_tsched_train  FOREIGN KEY (train_id)  REFERENCES Train(train_id),
    CONSTRAINT fk_tsched_route  FOREIGN KEY (route_id)  REFERENCES Route(route_id),
    CONSTRAINT fk_tsched_loco   FOREIGN KEY (loco_id)   REFERENCES TrainDriver(loco_id),
    CONSTRAINT chk_tsched_times CHECK (arrival_time > departure_time)
);

-- ─────────────────────────────────────────
-- 11. TRAIN BOOKING (user-owned)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS TrainBooking (
    booking_id     INT          AUTO_INCREMENT PRIMARY KEY,
    user_id        INT          NOT NULL,
    schedule_id    INT          NOT NULL,
    booking_date   DATE         NOT NULL DEFAULT (CURRENT_DATE),
    coach_number   VARCHAR(10)  NOT NULL,
    seat_number    INT          NOT NULL,
    payment_status ENUM('Paid','Pending') NOT NULL DEFAULT 'Pending',
    status         ENUM('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
    CONSTRAINT fk_tbooking_user     FOREIGN KEY (user_id)     REFERENCES users(user_id),
    CONSTRAINT fk_tbooking_schedule FOREIGN KEY (schedule_id) REFERENCES TrainSchedule(schedule_id),
    CONSTRAINT uq_train_seat        UNIQUE (schedule_id, coach_number, seat_number)
);

-- ============================================================
--  SAMPLE DATA
-- ============================================================

-- Admin user (password = "admin123")
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@transit.com', '$2a$10$XYpU/nhsQ91HSYywREvdWejG3Bvi67SLYLKQ/6zpJxCJayfk..ozq', 'admin');

-- Cities
INSERT INTO City (city_name) VALUES
('Mumbai'), ('Pune'), ('Nashik'), ('Nagpur'), ('Aurangabad'),
('Surat'), ('Ahmedabad'), ('Vadodara'), ('Jaipur'), ('Delhi');

-- Routes
INSERT INTO Route (source_city_id, destination_city_id, distance_km) VALUES
(1, 2, 148),  -- Mumbai → Pune
(2, 3, 210),  -- Pune → Nashik
(1, 4, 837),  -- Mumbai → Nagpur
(4, 5, 232),  -- Nagpur → Aurangabad
(1, 6, 280),  -- Mumbai → Surat
(6, 7, 265),  -- Surat → Ahmedabad
(7, 8, 109),  -- Ahmedabad → Vadodara
(8, 9, 630),  -- Vadodara → Jaipur
(9, 10, 268), -- Jaipur → Delhi
(3, 5, 185);  -- Nashik → Aurangabad

-- Buses
INSERT INTO Bus (bus_number, bus_type, capacity, status) VALUES
('MH-12-AB-1234', 'AC',     45, 'Active'),
('MH-14-CD-5678', 'Non-AC', 55, 'Active'),
('MH-01-EF-9012', 'Sleeper',40, 'Active'),
('MH-09-GH-3456', 'AC',     45, 'Active'),
('GJ-01-IJ-7890', 'Non-AC', 55, 'Active'),
('GJ-05-KL-2345', 'Sleeper',40, 'Inactive'),
('RJ-14-MN-6789', 'AC',     45, 'Active'),
('DL-01-OP-1111', 'Non-AC', 60, 'Active'),
('MH-43-QR-4321', 'Sleeper',36, 'Active'),
('GJ-18-ST-8765', 'AC',     50, 'Active');

-- Bus Drivers
INSERT INTO BusDriver (name, license_number, phone, experience_years) VALUES
('Rajesh Kumar',    'MH-0120230012345', '9823001234', 12),
('Suresh Patil',    'MH-1420228765432', '9834112345', 8),
('Amit Sharma',     'GJ-0120241234567', '9845223456', 15),
('Vikram Singh',    'RJ-1420239876543', '9856334567', 10),
('Manoj Yadav',     'DL-0120222345678', '9867445678', 7),
('Dinesh Verma',    'MH-0920193456789', '9878556789', 18),
('Sanjay Gupta',    'GJ-0520214567890', '9889667890', 6),
('Ravi Khanna',     'MH-4320205678901', '9890778901', 14),
('Anil Mehta',      'GJ-1820226789012', '9901889012', 9),
('Pramod Deshmukh', 'MH-1220237890123', '9912990123', 11);

-- Bus Schedules
INSERT INTO BusSchedule (bus_id, route_id, driver_id, departure_time, arrival_time, fare) VALUES
(1,  1, 1,  '2026-09-01 06:00:00', '2026-09-01 09:00:00',  400.00),
(2,  2, 2,  '2026-09-01 07:30:00', '2026-09-01 11:30:00',  300.00),
(3,  3, 3,  '2026-09-01 20:00:00', '2026-09-02 10:00:00',  900.00),
(4,  4, 4,  '2026-09-01 08:00:00', '2026-09-01 12:30:00',  350.00),
(5,  5, 5,  '2026-09-01 09:00:00', '2026-09-01 14:00:00',  350.00),
(7,  6, 6,  '2026-09-01 10:00:00', '2026-09-01 15:30:00',  420.00),
(8,  7, 7,  '2026-09-01 06:30:00', '2026-09-01 09:00:00',  180.00),
(9,  8, 8,  '2026-09-01 18:00:00', '2026-09-02 09:00:00', 1100.00),
(10, 9, 9,  '2026-09-01 05:00:00', '2026-09-01 10:30:00',  500.00),
(1, 10, 10, '2026-09-01 08:30:00', '2026-09-01 12:00:00',  260.00);

-- Trains
INSERT INTO Train (train_number, train_name, train_type, total_coaches, seats_per_coach, status) VALUES
('12951', 'Mumbai Rajdhani',   'Rajdhani',   18, 72, 'Active'),
('12002', 'Bhopal Shatabdi',   'Shatabdi',   12, 78, 'Active'),
('11301', 'Mumbai-Pune Exp',   'Express',    14, 80, 'Active'),
('12031', 'Ahmedabad SF',      'Superfast',  16, 72, 'Active'),
('22691', 'Rajdhani Exp',      'Rajdhani',   20, 72, 'Active'),
('12633', 'Kanyakumari Exp',   'Express',    24, 72, 'Active'),
('16301', 'Veraval Exp',       'Passenger',  16, 90, 'Inactive'),
('12909', 'Garib Rath',        'Express',    18, 72, 'Active'),
('19019', 'Dehradun Exp',      'Express',    20, 72, 'Active'),
('12036', 'Kalka Shatabdi',    'Shatabdi',   10, 78, 'Active');

-- Train Drivers (Loco Pilots)
INSERT INTO TrainDriver (name, employee_id, phone, experience_years) VALUES
('Harish Chandra',   'LP-2019-0001', '9700001111', 20),
('Sunil Batra',      'LP-2018-0002', '9700002222', 22),
('Prem Narayan',     'LP-2020-0003', '9700003333', 15),
('Kailash Verma',    'LP-2017-0004', '9700004444', 25),
('Yogesh Pandey',    'LP-2021-0005', '9700005555', 12),
('Satish Kumar',     'LP-2016-0006', '9700006666', 28),
('Naresh Yadav',     'LP-2022-0007', '9700007777', 10),
('Dilip Singh',      'LP-2015-0008', '9700008888', 30),
('Mahesh Gupta',     'LP-2019-0009', '9700009999', 18),
('Rakesh Mishra',    'LP-2020-0010', '9700010000', 16);

-- Train Schedules
INSERT INTO TrainSchedule (train_id, route_id, loco_id, departure_time, arrival_time, fare, platform_no) VALUES
(1,  1, 1,  '2026-09-01 16:00:00', '2026-09-01 22:30:00',  850.00, 1),
(2,  2, 2,  '2026-09-01 06:00:00', '2026-09-01 08:30:00',  550.00, 3),
(3,  3, 3,  '2026-09-01 07:00:00', '2026-09-01 09:45:00',  250.00, 2),
(4,  5, 4,  '2026-09-01 09:30:00', '2026-09-01 14:30:00',  420.00, 4),
(5,  9, 5,  '2026-09-01 05:00:00', '2026-09-01 12:00:00', 1200.00, 1),
(6,  8, 6,  '2026-09-01 18:00:00', '2026-09-02 08:00:00', 1500.00, 6),
(8,  4, 7,  '2026-09-01 11:00:00', '2026-09-01 15:30:00',  600.00, 2),
(9,  6, 8,  '2026-09-01 14:00:00', '2026-09-01 19:00:00',  750.00, 5),
(10, 7, 9,  '2026-09-01 07:30:00', '2026-09-01 09:00:00',  300.00, 3),
(1, 10, 10, '2026-09-02 09:00:00', '2026-09-02 12:30:00',  380.00, 1);
