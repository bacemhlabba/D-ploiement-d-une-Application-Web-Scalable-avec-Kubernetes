import { authenticateUser, isHR } from "../../../backend/middleware/auth"
import {
  getAllLeaveRequests,
  getLeaveRequestsByUserId,
  createLeaveRequest,
  getPendingLeaveRequests,
  getLeaveStatistics,
} from "../../../backend/models/leaveRequest"
import { getLeaveBalanceByUserAndType } from "../../../backend/models/leaveBalance"

export default async function handler(req, res) {
  try {
    // Authenticate user
    const user = await authenticateUser(req)

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    // Handle GET request
    if (req.method === "GET") {
      try {
        // Check if statistics are requested
        if (req.query.stats === "true") {
          let stats
          if (isHR(user)) {
            // HR can see all stats
            stats = await getLeaveStatistics()
          } else {
            // Employees can only see their own stats
            stats = await getLeaveStatistics(user.id)
          }
          return res.status(200).json(stats)
        }

        let leaveRequests = []

        // HR can see all requests or filter by pending
        if (isHR(user)) {
          if (req.query.status === "pending") {
            leaveRequests = await getPendingLeaveRequests()
          } else {
            leaveRequests = await getAllLeaveRequests()
          }
        } else {
          // Employees can only see their own requests
          leaveRequests = await getLeaveRequestsByUserId(user.id)
        }

        // Vérifier que leaveRequests est bien un tableau
        if (!Array.isArray(leaveRequests)) {
          console.error("Leave requests is not an array:", leaveRequests)
          leaveRequests = []
        }

        return res.status(200).json(leaveRequests)
      } catch (error) {
        console.error("Error fetching leave requests:", error)
        return res.status(500).json({ message: "Internal server error", error: error.message })
      }
    }

    // Handle POST request (create new leave request)
    if (req.method === "POST") {
      try {
        const { leave_type_id, start_date, end_date, reason } = req.body

        // Validate input
        if (!leave_type_id || !start_date || !end_date) {
          return res.status(400).json({ message: "All fields are required" })
        }

        // Calculate total days
        const startDate = new Date(start_date)
        const endDate = new Date(end_date)

        if (startDate > endDate) {
          return res.status(400).json({ message: "End date must be after start date" })
        }

        // Simple calculation (doesn't account for weekends/holidays)
        const diffTime = Math.abs(endDate - startDate)
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

        // Check leave balance for annual and sick leave
        if (leave_type_id === 1 || leave_type_id === 2) {
          // Annual or Sick leave
          const balance = await getLeaveBalanceByUserAndType(user.id, leave_type_id)

          if (!balance || balance.balance < totalDays) {
            return res.status(400).json({ message: "Insufficient leave balance" })
          }
        }

        // Create leave request
        const requestId = await createLeaveRequest({
          user_id: user.id,
          leave_type_id,
          start_date,
          end_date,
          total_days: totalDays,
          reason,
        })

        return res.status(201).json({
          message: "Leave request created successfully",
          requestId,
        })
      } catch (error) {
        console.error("Error creating leave request:", error)
        return res.status(500).json({ message: "Internal server error", error: error.message })
      }
    }

    return res.status(405).json({ message: "Method not allowed" })
  } catch (error) {
    console.error("Global error in leave requests API:", error)
    return res.status(500).json({ message: "Server error", error: error.message })
  }
}
