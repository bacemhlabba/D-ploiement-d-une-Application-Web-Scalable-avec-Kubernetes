import { getAllUsers, createUser } from "../../../backend/models/user"
import { initializeUserLeaveBalances } from "../../../backend/models/leaveBalance"
import { withAuth } from "../../../backend/middleware/auth"

async function handler(req, res) {
  // Vérifier si l'utilisateur est un administrateur RH
  if (req.user.role !== "hr") {
    return res.status(403).json({ message: "Accès non autorisé" })
  }

  if (req.method === "GET") {
    try {
      const users = await getAllUsers()
      return res.status(200).json(users)
    } catch (error) {
      console.error("Error fetching users:", error)
      return res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" })
    }
  } else if (req.method === "POST") {
    try {
      console.log("API: Creating user with data:", req.body)
      const { username, password, full_name, email, role, department } = req.body

      // Validation
      if (!username || !password || !full_name || !email) {
        console.error("API: Missing required fields:", { username, full_name, email })
        return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis" })
      }

      // Validation du rôle
      if (role && !["employee", "hr", "manager"].includes(role)) {
        console.error("API: Invalid role:", role)
        return res.status(400).json({ message: "Rôle invalide. Les valeurs autorisées sont: employee, hr, manager" })
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUsers = await getAllUsers()
      const userExists = existingUsers.some(
        (user) =>
          user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email.toLowerCase(),
      )

      if (userExists) {
        console.error("API: User already exists with username or email:", { username, email })
        return res.status(400).json({ message: "Un utilisateur avec ce nom d'utilisateur ou cet email existe déjà" })
      }

      // Créer l'utilisateur
      const userId = await createUser({
        username,
        password,
        full_name,
        email,
        role: role || "employee",
        department,
      })

      console.log("API: User created successfully with ID:", userId)

      // Initialiser les soldes de congés
      await initializeUserLeaveBalances(userId)
      console.log("API: Leave balances initialized for user:", userId)

      return res.status(201).json({
        message: "Utilisateur créé avec succès",
        userId,
      })
    } catch (error) {
      console.error("Error creating user:", error)
      return res.status(500).json({ message: `Erreur lors de la création de l'utilisateur: ${error.message}` })
    }
  } else {
    return res.status(405).json({ message: "Méthode non autorisée" })
  }
}

export default withAuth(handler)
