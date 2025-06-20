import { getUserByUsername, verifyPassword } from "../../../backend/models/user"
import { generateToken } from "../../../backend/utils/auth-utils"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    console.log("Login API: Processing login request")
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      console.log("Login API: Missing username or password")
      return res.status(400).json({ message: "Username and password are required" })
    }

    console.log(`Login API: Attempting login for user: ${username}`)

    // Get user from database
    const user = await getUserByUsername(username)

    // Check if user exists
    if (!user) {
      console.log(`Login API: User not found: ${username}`)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    console.log(`Login API: User found: ${username}`)

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      console.log(`Login API: Invalid password for user: ${username}`)
      return res.status(401).json({ message: "Invalid credentials" })
    }

    console.log(`Login API: Password verified for user: ${username}`)

    // Check if generateToken is a function
    if (typeof generateToken !== "function") {
      console.error("Login API: generateToken is not a function", typeof generateToken)
      return res.status(500).json({ message: "Authentication error: Token generation failed" })
    }

    // Generate JWT token
    try {
      const token = generateToken(user)
      console.log(`Login API: Token generated for user: ${username}`)

      // Return user info and token
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
        token,
      })
    } catch (tokenError) {
      console.error("Login API: Token generation error:", tokenError)
      return res.status(500).json({ message: "Authentication error: Token generation failed" })
    }
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}
