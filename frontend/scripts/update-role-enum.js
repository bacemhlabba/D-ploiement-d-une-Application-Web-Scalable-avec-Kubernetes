// Script pour mettre à jour l'ENUM de la colonne 'role' dans la table 'users'
import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function updateRoleEnum() {
  console.log("Démarrage de la mise à jour de l'ENUM de la colonne role...")

  // Créer une connexion à la base de données
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })

  try {
    console.log("Connexion à la base de données établie")

    // Vérifier si la colonne 'role' existe déjà avec l'ENUM actuel
    const [columns] = await connection.execute(
      `
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
    `,
      [process.env.DB_NAME],
    )

    if (columns.length === 0) {
      console.log("La colonne role n'existe pas dans la table users")
      return
    }

    const currentType = columns[0].COLUMN_TYPE
    console.log("Type actuel de la colonne role:", currentType)

    // Vérifier si 'manager' est déjà dans l'ENUM
    if (currentType.includes("manager")) {
      console.log("La valeur manager est déjà présente dans l'ENUM")
      return
    }

    // Modifier la colonne pour ajouter 'manager' à l'ENUM
    console.log("Modification de la colonne role pour ajouter manager à l'ENUM...")
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('employee', 'hr', 'manager') NOT NULL DEFAULT 'employee'
    `)

    console.log("La colonne role a été mise à jour avec succès")
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la colonne role:", error)
  } finally {
    await connection.end()
    console.log("Connexion à la base de données fermée")
  }
}

// Exécuter la fonction
updateRoleEnum()
