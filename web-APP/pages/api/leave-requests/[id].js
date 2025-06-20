import { authenticateUser, isHR } from "../../../backend/middleware/auth"
import {
  getLeaveRequestById,
  updateLeaveRequestStatus,
  updateLeaveRequest,
  deleteLeaveRequest,
} from "../../../backend/models/leaveRequest"
import { deductLeaveBalance, addLeaveBalance } from "../../../backend/models/leaveBalance"

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
      const leaveRequest = await getLeaveRequestById(id)

      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" })
      }

      // Check if user is authorized to view this request
      if (!isHR(user) && leaveRequest.user_id !== user.id) {
        return res.status(403).json({ message: "Forbidden" })
      }

      return res.status(200).json(leaveRequest)
    } catch (error) {
      console.error("Error fetching leave request:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  // Handle PUT request (update leave request)
  if (req.method === "PUT") {
    try {
      // Only HR can update leave requests
      if (!isHR(user)) {
        return res.status(403).json({ message: "Forbidden" })
      }

      const leaveRequest = await getLeaveRequestById(id)

      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" })
      }

      const { status, rejection_reason, start_date, end_date, leave_type_id, reason } = req.body

      // If modifying dates, recalculate total days
      let totalDays = leaveRequest.total_days

      if (start_date && end_date) {
        const startDate = new Date(start_date)
        const endDate = new Date(end_date)

        if (startDate > endDate) {
          return res.status(400).json({ message: "End date must be after start date" })
        }

        const diffTime = Math.abs(endDate - startDate)
        totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      }

      // Update leave request
      if (status === "approved" && leaveRequest.status === "pending") {
        // Deduct leave balance if request is approved
        if (leaveRequest.leave_type_id === 1 || leaveRequest.leave_type_id === 2) {
          // Annual or Sick leave
          await deductLeaveBalance(leaveRequest.user_id, leaveRequest.leave_type_id, leaveRequest.total_days)
        }

        await updateLeaveRequestStatus(id, "approved")
      } else if (status === "rejected" && leaveRequest.status === "pending") {
        // Validate rejection reason
        if (!rejection_reason) {
          return res.status(400).json({ message: "Rejection reason is required" })
        }

        await updateLeaveRequestStatus(id, "rejected", rejection_reason)
      } else if (status === "modified") {
        // Handle modification
        const updatedRequest = {
          leave_type_id: leave_type_id || leaveRequest.leave_type_id,
          start_date: start_date || leaveRequest.start_date,
          end_date: end_date || leaveRequest.end_date,
          total_days: totalDays,
          reason: reason || leaveRequest.reason,
          status: "modified",
          rejection_reason: rejection_reason || null,
        }

        await updateLeaveRequest(id, updatedRequest)

        // If leave was previously approved, adjust balances
        if (
          leaveRequest.status === "approved" &&
          (leaveRequest.leave_type_id === 1 || leaveRequest.leave_type_id === 2)
        ) {
          // Add back the original days
          await addLeaveBalance(leaveRequest.user_id, leaveRequest.leave_type_id, leaveRequest.total_days)

          // Deduct the new days if the leave type is still annual or sick
          if (updatedRequest.leave_type_id === 1 || updatedRequest.leave_type_id === 2) {
            await deductLeaveBalance(leaveRequest.user_id, updatedRequest.leave_type_id, totalDays)
          }
        }
      }

      return res.status(200).json({ message: "Leave request updated successfully" })
    } catch (error) {
      console.error("Error updating leave request:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  // Handle DELETE request
  if (req.method === "DELETE") {
    try {
      const leaveRequest = await getLeaveRequestById(id)

      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" })
      }

      // Only HR or the owner can delete a request
      if (!isHR(user) && leaveRequest.user_id !== user.id) {
        return res.status(403).json({ message: "Forbidden" })
      }

      // If the request was approved, add back the leave balance
      if (
        leaveRequest.status === "approved" &&
        (leaveRequest.leave_type_id === 1 || leaveRequest.leave_type_id === 2)
      ) {
        await addLeaveBalance(leaveRequest.user_id, leaveRequest.leave_type_id, leaveRequest.total_days)
      }

      await deleteLeaveRequest(id)

      return res.status(200).json({ message: "Leave request deleted successfully" })
    } catch (error) {
      console.error("Error deleting leave request:", error)
      return res.status(500).json({ message: "Internal server error" })
    }
  }

  return res.status(405).json({ message: "Method not allowed" })
}
