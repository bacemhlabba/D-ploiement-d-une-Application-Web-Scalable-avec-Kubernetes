// Version CommonJS du script
const mysql = require("mysql2/promise")
require("dotenv").config()

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "leave_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Helper function to execute SQL queries
async function query(sql, params) {
  try {
    console.log("DB: Executing query:", sql)
    if (params) {
      console.log("DB: Query params:", params)
    }

    const [results] = await pool.query(sql, params)
    console.log("DB: Query successful, returned rows:", results ? results.length : 0)
    return results
  } catch (error) {
    console.error("DB: Query error:", error)
    // Rethrow the error with more context
    throw new Error(`Database query failed: ${error.message}`)
  }
}

async function addAvatarColumn() {
  try {
    console.log("Checking if avatar_url column exists...")

    // Vérifier si la colonne existe déjà
    const columns = await query("SHOW COLUMNS FROM users LIKE 'avatar_url'")

    if (columns.length === 0) {
      console.log("Adding avatar_url column to users table...")
      await query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL")
      console.log("Column avatar_url added successfully!")
    } else {
      console.log("Column avatar_url already exists.")
    }

    process.exit(0)
  } catch (error) {
    console.error("Error adding avatar_url column:", error)
    process.exit(1)
  }
}

addAvatarColumn()
