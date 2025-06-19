import mysql from "mysql2/promise"
import * as dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import fs from "fs"

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from .env.local
const envPath = join(__dirname, "..", ".env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config() // Fallback to default .env
  console.log("Warning: .env.local not found, using default environment variables")
}

async function initDatabase() {
  console.log("Starting database initialization...")

  const dbName = process.env.DB_NAME || "leave_management"
  console.log(`Using database: ${dbName}`)

  try {
    // First create a connection without specifying the database
    const rootConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

    // Create database if it doesn't exist - use query instead of execute
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`)
    console.log(`Database ${dbName} created or already exists`)

    // Close the initial connection
    await rootConnection.end()

    // Create a new connection with the database specified
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName, // Specify the database here instead of using USE
    })

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        role ENUM('employee', 'hr', 'admin') NOT NULL DEFAULT 'employee',
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Users table created or already exists")

    // Create leave_types table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        requires_approval BOOLEAN DEFAULT TRUE,
        requires_justification BOOLEAN DEFAULT FALSE
      )
    `)
    console.log("Leave types table created or already exists")

    // Create leave_balances table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_balances (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        balance DECIMAL(10,1) NOT NULL DEFAULT 0,
        year INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE,
        UNIQUE KEY (user_id, leave_type_id, year)
      )
    `)
    console.log("Leave balances table created or already exists")

    // Create leave_requests table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
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
      )
    `)
    console.log("Leave requests table created or already exists")

    // Insert default leave types if they don't exist
    await connection.query(`
      INSERT IGNORE INTO leave_types (name, description, requires_approval, requires_justification)
      VALUES 
        ('Congé annuel', 'Congé payé annuel standard', TRUE, FALSE),
        ('Congé maladie', 'Congé pour raison médicale', TRUE, TRUE),
        ('Congé sans solde', 'Congé non rémunéré', TRUE, TRUE),
        ('Congé spécial', 'Congé pour événements spéciaux (mariage, naissance, etc.)', TRUE, TRUE)
    `)
    console.log("Default leave types inserted or already exist")

    // Insert admin user if no users exist
    const [users] = await connection.query("SELECT COUNT(*) as count FROM users")
    if (users[0].count === 0) {
      const bcrypt = await import("bcryptjs")
      const hashedPassword = await bcrypt.hash("admin123", 10)

      await connection.query(
        `
        INSERT INTO users (username, password, full_name, email, role, department)
        VALUES ('admin', ?, 'Administrateur', 'admin@example.com', 'admin', 'Administration')
      `,
        [hashedPassword],
      )
      console.log("Default admin user created")
    }

    console.log("Database initialization completed successfully!")

    // Close the connection
    await connection.end()
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

initDatabase()
  .then(() => {
    console.log("Script completed successfully.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Script failed:", error)
    process.exit(1)
  })
