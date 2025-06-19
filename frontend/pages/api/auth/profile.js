import { authenticateUser } from "../../../backend/middleware/auth"
import { updateUser, changePassword, verifyPassword, getUserById } from "../../../backend/models/user"

export default async function handler(req, res) {
  try {
    // Authenticate user
    const user = await authenticateUser(req)

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // Handle GET request (get user profile)
    if (req.method === "GET") {
      return res.status(200).json({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department,
        created_at: user.created_at,
        avatar_url: user.avatar_url,
      })
    }

    // Handle PUT request (update user profile)
    if (req.method === "PUT") {
      try {
        const { full_name, email, department, current_password, new_password } = req.body

        // Update user profile
        if (full_name || email || department) {
          await updateUser(user.id, {
            full_name: full_name || user.full_name,
            email: email || user.email,
            department: department || user.department,
          })
        }

        // Change password if provided
        if (current_password && new_password) {
          // Get fresh user data with password
          const freshUser = await getUserById(user.id)

          // Verify current password
          const isPasswordValid = await verifyPassword(current_password, freshUser.password)

          if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" })
          }

          // Change password
          await changePassword(user.id, new_password)
        }

        // Get updated user data
        const updatedUser = await getUserById(user.id)

        return res.status(200).json({
          message: "Profile updated successfully",
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            full_name: updatedUser.full_name,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            created_at: updatedUser.created_at,
            avatar_url: updatedUser.avatar_url,
          },
        })
      } catch (error) {
        console.error("Profile update error:", error)
        return res.status(500).json({ message: "Internal server error: " + error.message })
      }
    }

    return res.status(405).json({ message: "Method not allowed" })
  } catch (error) {
    console.error("Profile API error:", error)
    return res.status(500).json({ message: "Internal server error: " + error.message })
  }
}
