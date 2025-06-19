import { query } from "../lib/db";
import bcrypt from "bcryptjs";

// Get user by username
export async function getUserByUsername(username) {
  try {
    const users = await query(
      "SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1",
      [username]
    );
    return users[0];
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(id) {
  try {
    const users = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
    return users[0];
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}

// Create a new user
export async function createUser(username, email, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );
    return result[0];
  } catch (error) {
    console.error("Error in createUser:", error);
    throw error;
  }
}

// Verify password
export async function verifyPassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
}

// Update user
export async function updateUser(id, updateData) {
  try {
    const { username, email, role } = updateData;
    
    const result = await query(
      "UPDATE users SET username = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
      [username, email, role, id]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
}

// Change user password
export async function changePassword(id, currentPassword, newPassword) {
  try {
    // First, get the user to verify current password
    const user = await getUserById(id);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return { success: false, message: "Current password is incorrect" };
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await query(
      "UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, id]
    );
    
    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error("Error in changePassword:", error);
    throw error;
  }
}

// Delete a user
export async function deleteUser(id) {
  try {
    await query("DELETE FROM users WHERE id = $1", [id]);
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
}

// Get departments (for organization structure)
export async function getDepartments() {
  try {
    // This function would typically query a departments table
    // For simplicity, we're returning mock data
    return [
      { id: 1, name: "Human Resources" },
      { id: 2, name: "Engineering" },
      { id: 3, name: "Finance" },
      { id: 4, name: "Marketing" },
      { id: 5, name: "Operations" }
    ];
  } catch (error) {
    console.error("Error in getDepartments:", error);
    throw error;
  }
}

// Get all users
export async function getAllUsers() {
  try {
    return await query("SELECT id, username, email, role, created_at FROM users");
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    throw error;
  }
}
