import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error("Invalid token")
  }
}

export function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.substring(7)
}
