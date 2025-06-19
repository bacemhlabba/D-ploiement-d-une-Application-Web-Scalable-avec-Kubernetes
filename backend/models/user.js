import { query } from "../lib/db"
import bcrypt from "bcryptjs"

export async function getAllUsers() {
  return await query("SELECT id, username, full_name, email, role, department, created_at FROM users")
}

export async function getUserById(id) {
  const users = await query(
    "SELECT id, username, full_name, email, role, department, created_at FROM users WHERE id = ?",
    [id],
  )
  return users.length ? users[0] : null
}

export async function getUserByUsername(username) {
  const users = await query("SELECT * FROM users WHERE username = ?", [username])
  return users.length ? users[0] : null
}

export async function createUser(userData) {
  const { username, password, full_name, email, role, department } = userData

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  const result = await query(
    "INSERT INTO users (username, password, full_name, email, role, department) VALUES (?, ?, ?, ?, ?, ?)",
    [username, hashedPassword, full_name, email, role, department],
  )

  return result.insertId
}

export async function updateUser(id, userData) {
  const { full_name, email, department } = userData

  const result = await query("UPDATE users SET full_name = ?, email = ?, department = ? WHERE id = ?", [
    full_name,
    email,
    department,
    id,
  ])

  return result.affectedRows > 0
}

export async function changePassword(id, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  const result = await query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id])

  return result.affectedRows > 0
}

export async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword)
}
