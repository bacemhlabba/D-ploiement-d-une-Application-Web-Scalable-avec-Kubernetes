import { authenticateUser, isHR } from "../../../backend/middleware/auth"
import {
  getLeaveBalanceByUserId,
  getAllUsersWithBalances,
  createOrUpdateLeaveBalance,
} from "../../../backend/models/leaveBalance"

export default async function handler(req, res) {
  // Authenticate user
  const user = await authenticateUser(req)

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  // Handle GET request
  if (req.method === "GET") {
    try {
      // HR can see all users' balances or a specific user's balance
      if (isHR(user) && req.query.userId) {
        const balances = await getLeaveBalanceByUserId(req.query.userId)
        return res.status(200).json(balances)
      } else if (isHR(user) && !req.query.userId) {
        // Get all users with their balances
        const usersWithBalances = await getAllUsersWithBalances()
        return res.status(200).json(usersWithBalances)
      } else {
        // Employees can only see their own balances
        const balances = await getLeaveBalanceByUserId(user.id)
        return res.status(200).json(balances)
      }
    } catch (error) {
      console.error("Error fetching leave balances:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  // Handle PUT request (update leave balance)
  if (req.method === "PUT") {
    try {
      // Only HR can update leave balances
      if (!isHR(user)) {
        return res.status(403).json({ message: "Forbidden" })
      }

      const { userId, leaveTypeId, balance } = req.body

      if (!userId || !leaveTypeId || balance === undefined) {
        return res.status(400).json({ message: "All fields are required" })
      }

      await createOrUpdateLeaveBalance(userId, leaveTypeId, balance)

      return res.status(200).json({ message: "Leave balance updated successfully" })
    } catch (error) {
      console.error("Error updating leave balance:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
