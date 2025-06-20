const { query } = require("../backend/lib/db.js")

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
