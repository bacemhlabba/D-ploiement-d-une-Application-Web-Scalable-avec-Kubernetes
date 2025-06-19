import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_this_in_production";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "1d";

// Generate JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "employee",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
}

// Extract user ID from token
export function getUserIdFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}
