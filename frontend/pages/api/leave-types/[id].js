import { authenticateUser, isHR } from "../../../backend/middleware/auth"
import { getLeaveTypeById, updateLeaveType, deleteLeaveType } from "../../../backend/models/leaveType"

export default async function handler(req, res) {
  // Authenticate user
  const user = await authenticateUser(req)

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const { id } = req.query

  // Handle GET request
  if (req.method === "GET") {
    try {
      const leaveType = await getLeaveTypeById(id)

      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" })
      }

      return res.status(200).json(leaveType)
    } catch (error) {
      console.error("Error fetching leave type:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  // Only HR can update or delete leave types
  if (!isHR(user)) {
    return res.status(403).json({ message: "Forbidden" })
  }

  // Handle PUT request (update leave type)
  if (req.method === "PUT") {
    try {
      const leaveType = await getLeaveTypeById(id)

      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" })
      }

      const { name, description, requires_approval, requires_justification } = req.body

      if (!name) {
        return res.status(400).json({ message: "Name is required" })
      }

      await updateLeaveType(id, {
        name,
        description,
        requires_approval: requires_approval !== undefined ? requires_approval : leaveType.requires_approval,
        requires_justification:
          requires_justification !== undefined ? requires_justification : leaveType.requires_justification,
      })

      return res.status(200).json({ message: "Leave type updated successfully" })
    } catch (error) {
      console.error("Error updating leave type:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  // Handle DELETE request
  if (req.method === "DELETE") {
    try {
      const leaveType = await getLeaveTypeById(id)

      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" })
      }

      await deleteLeaveType(id)

      return res.status(200).json({ message: "Leave type deleted successfully" })
    } catch (error) {
      console.error("Error deleting leave type:", error)

      if (error.message.includes("Cannot delete")) {
        return res.status(400).json({ message: error.message })
      }

      return res.status(500).json({ message: "Internal server error" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
