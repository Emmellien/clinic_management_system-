CREATE DATABASE clinic_management_system;
USE clinic_management_system;

-- 1. Users Table (Admin, Receptionist, Doctor, Nurse)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL, -- Fixed the closing parenthesis here
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Receptionist', 'Doctor', 'Nurse') NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patients Table
CREATE TABLE patients (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    age INT NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Appointments Table
CREATE TABLE appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    appointment_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id)
);

-- 4. Medicines (Inventory) Table
CREATE TABLE medicines (
    medicine_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    stock_quantity INT NOT NULL CHECK (stock_quantity >= 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    expiry_date DATE
);

-- 5. Treatments/Visits Table
CREATE TABLE treatments (
    treatment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    doctor_id INT,
    appointment_id INT UNIQUE,
    diagnosis VARCHAR(255) NOT NULL,
    notes TEXT,
    treatment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES users(user_id),
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);

-- 6. Prescriptions Table
CREATE TABLE prescriptions (
    prescription_id INT PRIMARY KEY AUTO_INCREMENT,
    treatment_id INT,
    medicine_id INT,
    quantity INT NOT NULL,
    dosage VARCHAR(100) NOT NULL, -- e.g., "1x3 daily for 5 days"
    FOREIGN KEY (treatment_id) REFERENCES treatments(treatment_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(medicine_id)
);

-- 7. Payments Table
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    amount DECIMAL(10, 2) NOT NULL, -- e.g., 15000.00 RWF
    payment_method ENUM('Cash', 'Mobile Money', 'Card', 'Insurance') NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);

USE clinic_management_system;

INSERT INTO users (full_name, email, password_hash, role, phone) 
VALUES (
    'System Admin', 
    'admin@hopeclinic.com', 
    '$2a$10$X8p9G73o5OmdH7U6H6z8XeuW9tLdZgYEqqIuUvRWe.B.o0Nf0E7g2', 
    'Admin', 
    '0780000000'
);
-- admin123