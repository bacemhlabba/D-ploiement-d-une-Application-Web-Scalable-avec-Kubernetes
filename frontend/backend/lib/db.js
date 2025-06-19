import pg from "pg";

// Create a connection pool
const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "secret",
  database: process.env.DB_NAME || "scalable_app",
  port: parseInt(process.env.DB_PORT || "5432")
});

// Helper function to execute SQL queries
export async function query(sql, params) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export default { query };
