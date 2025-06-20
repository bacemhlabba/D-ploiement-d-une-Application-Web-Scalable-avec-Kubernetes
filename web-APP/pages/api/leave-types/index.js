import { authenticateUser, isHR } from "../../../backend/middleware/auth"
import { getAllLeaveTypes, createLeaveType } from "../../../backend/models/leaveType"

export default async function handler(req, res) {
  // Authenticate user
  const user = await authenticateUser(req)

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  // Handle GET request
  if (req.method === "GET") {
    try {
      const leaveTypes = await getAllLeaveTypes()
      return res.status(200).json(leaveTypes)
    } catch (error) {
      console.error("Error fetching leave types:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  // Handle POST request (create new leave type)
  if (req.method === "POST") {
    try {
      // Only HR can create leave types
      if (!isHR(user)) {
        return res.status(403).json({ message: "Forbidden" })
      }

      const { name, description, requires_approval, requires_justification } = req.body

      if (!name) {
        return res.status(400).json({ message: "Name is required" })
      }

      const typeId = await createLeaveType({
        name,
        description,
        requires_approval: requires_approval !== undefined ? requires_approval : true,
        requires_justification: requires_justification !== undefined ? requires_justification : false,
      })

      return res.status(201).json({
        message: "Leave type created successfully",
        typeId,
      })
    } catch (error) {
      console.error("Error creating leave type:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
