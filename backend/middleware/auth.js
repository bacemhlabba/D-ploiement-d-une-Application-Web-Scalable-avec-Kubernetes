import jwt from "jsonwebtoken"
import { getUserById } from "../models/user"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" },
  )
}

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded
  } catch (error) {
    return null
  }
}

export async function authenticateUser(req) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.split(" ")[1]
  const decoded = await verifyToken(token)

  if (!decoded) {
    return null
  }

  // Get user from database
  const user = await getUserById(decoded.id)

  if (!user) {
    return null
  }

  return user
}

export function isHR(user) {
  return user && user.role === "hr"
}

export function isEmployee(user) {
  return user && user.role === "employee"
}
