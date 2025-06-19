-- Database schema for Leave Management System

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  role ENUM('employee', 'hr') NOT NULL DEFAULT 'employee',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave types table
CREATE TABLE leave_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  requires_approval BOOLEAN DEFAULT TRUE,
  requires_justification BOOLEAN DEFAULT FALSE
);

-- Leave balances table
CREATE TABLE leave_balances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  balance DECIMAL(10,1) NOT NULL DEFAULT 0,
  year INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, leave_type_id, year)
);

-- Leave requests table
CREATE TABLE leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(10,1) NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected', 'modified') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

-- Insert default leave types
INSERT INTO leave_types (name, description, requires_justification) VALUES 
('Congé annuel', 'Congé annuel avec solde', FALSE),
('Congé maladie', 'Congé maladie avec solde', TRUE),
('Congé exceptionnel', 'Congé exceptionnel avec motif', TRUE);

-- Insert a default HR user (username: admin, password: admin123)
INSERT INTO users (username, password, full_name, email, role, department) VALUES
('admin', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'Admin', 'admin@example.com', 'hr', 'Human Resources');

-- Insert a default employee (username: employee, password: employee123)
INSERT INTO users (username, password, full_name, email, role, department) VALUES
('employee', '$2a$10$beiRXHvE8LBVq.lekVLMFekiwYTZjZCQMR1aPqPbYYHLLjhPHnVQi', 'Employee', 'employee@example.com', 'employee', 'Engineering');

-- Initialize leave balances for default users
INSERT INTO leave_balances (user_id, leave_type_id, balance, year) VALUES
(1, 1, 30, YEAR(CURDATE())),
(1, 2, 15, YEAR(CURDATE())),
(1, 3, 5, YEAR(CURDATE())),
(2, 1, 30, YEAR(CURDATE())),
(2, 2, 15, YEAR(CURDATE())),
(2, 3, 5, YEAR(CURDATE()));
