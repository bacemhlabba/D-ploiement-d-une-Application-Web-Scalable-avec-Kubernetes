import { createUser, getUserByUsername } from "../../../backend/models/user"
import { initializeUserLeaveBalances } from "../../../backend/models/leaveBalance"
import { withAuth } from "../../../backend/middleware/auth"

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Vérifier que l'utilisateur est un RH
    if (!req.user || req.user.role !== "hr") {
      return res.status(403).json({ message: "Accès refusé. Seuls les utilisateurs RH peuvent créer des comptes." })
    }

    const { username, password, full_name, email, role, department } = req.body

    // Validate input
    if (!username || !password || !full_name || !email) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if username already exists
    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" })
    }

    // Create user
    const userId = await createUser({
      username,
      password,
      full_name,
      email,
      role: role || "employee",
      department,
    })

    // Initialize leave balances for the new user
    await initializeUserLeaveBalances(userId)

    return res.status(201).json({
      message: "User registered successfully",
      userId,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

// Protéger la route avec le middleware d'authentification
export default withAuth(handler)
