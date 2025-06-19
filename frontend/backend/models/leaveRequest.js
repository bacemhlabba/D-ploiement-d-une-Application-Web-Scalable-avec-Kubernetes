import { query } from "../lib/db";
import { updateLeaveBalance, getLeaveBalanceById, deductLeaveBalance, addLeaveBalance } from "./leaveBalance";

// Get all leave requests
export async function getAllLeaveRequests() {
  try {
    return await query(
      `SELECT lr.*, u.username, u.email, lt.name as leave_type_name, lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       ORDER BY lr.created_at DESC`
    );
  } catch (error) {
    console.error("Error in getAllLeaveRequests:", error);
    throw error;
  }
}

// Get pending leave requests
export async function getPendingLeaveRequests() {
  try {
    return await query(
      `SELECT lr.*, u.username, u.email, lt.name as leave_type_name, lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'pending'
       ORDER BY lr.created_at DESC`
    );
  } catch (error) {
    console.error("Error in getPendingLeaveRequests:", error);
    throw error;
  }
}

// Get leave statistics
export async function getLeaveStatistics(userId = null) {
  try {
    let sql = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(*) AS total
      FROM leave_requests
    `;
    
    let params = [];
    
    if (userId) {
      sql += ' WHERE user_id = $1';
      params.push(userId);
    }
    
    const result = await query(sql, params);
    return result[0];
  } catch (error) {
    console.error("Error in getLeaveStatistics:", error);
    throw error;
  }
}

// Get leave statistics by department
export async function getLeaveStatisticsByDepartment() {
  try {
    // This would typically join with a department table
    // For simplicity, we'll use a mock response
    return [
      { department: "Human Resources", approved: 12, pending: 5, rejected: 3 },
      { department: "Engineering", approved: 45, pending: 8, rejected: 2 },
      { department: "Finance", approved: 10, pending: 2, rejected: 1 },
      { department: "Marketing", approved: 22, pending: 7, rejected: 4 }
    ];
  } catch (error) {
    console.error("Error in getLeaveStatisticsByDepartment:", error);
    throw error;
  }
}

// Get leave statistics by period
export async function getLeaveStatisticsByPeriod() {
  try {
    // This would typically aggregate data by month or other periods
    // For simplicity, we'll use a mock response
    return [
      { period: "Jan 2025", count: 15 },
      { period: "Feb 2025", count: 18 },
      { period: "Mar 2025", count: 25 },
      { period: "Apr 2025", count: 22 },
      { period: "May 2025", count: 30 },
      { period: "Jun 2025", count: 28 }
    ];
  } catch (error) {
    console.error("Error in getLeaveStatisticsByPeriod:", error);
    throw error;
  }
}

// Get leave requests for a user
export async function getLeaveRequestsByUser(userId) {
  try {
    return await query(
      `SELECT lr.*, u.username, u.email, lt.name as leave_type_name, lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.user_id = $1
       ORDER BY lr.created_at DESC`,
      [userId]
    );
  } catch (error) {
    console.error("Error in getLeaveRequestsByUser:", error);
    throw error;
  }
}

// Get leave request by ID
export async function getLeaveRequestById(id) {
  try {
    const requests = await query(
      `SELECT lr.*, u.username, u.email, lt.name as leave_type_name, lt.color
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.id = $1`,
      [id]
    );
    return requests[0];
  } catch (error) {
    console.error("Error in getLeaveRequestById:", error);
    throw error;
  }
}

// Create leave request
export async function createLeaveRequest(leaveRequest) {
  try {
    const { user_id, leave_type_id, start_date, end_date, reason } = leaveRequest;
    
    const result = await query(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [user_id, leave_type_id, start_date, end_date, reason]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in createLeaveRequest:", error);
    throw error;
  }
}

// Update leave request status
export async function updateLeaveRequestStatus(id, status, comment) {
  try {
    // First get the request to check if we need to update leave balance
    const leaveRequest = await getLeaveRequestById(id);
    
    if (!leaveRequest) {
      throw new Error("Leave request not found");
    }
    
    // Update the request status
    const result = await query(
      `UPDATE leave_requests
       SET status = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, comment, id]
    );
    
    // If approved, update leave balance
    if (status === 'approved' && leaveRequest.status !== 'approved') {
      // Calculate days between start and end date
      const startDate = new Date(leaveRequest.start_date);
      const endDate = new Date(leaveRequest.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
      
      // Get current leave balance
      // Assuming there's a way to get leave balance by user and leave type
      const balances = await query(
        `SELECT * FROM leave_balances
         WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
        [leaveRequest.user_id, leaveRequest.leave_type_id, new Date().getFullYear()]
      );
      
      if (balances.length > 0) {
        const balance = balances[0];
        
        // Update balance
        await updateLeaveBalance(balance.id, {
          balance: parseFloat(balance.balance) - diffDays,
          allocated: parseFloat(balance.allocated),
          used: parseFloat(balance.used) + diffDays
        });
      }
    }
    
    // If request was approved but now rejected, restore the balance
    if (status === 'rejected' && leaveRequest.status === 'approved') {
      // Calculate days between start and end date
      const startDate = new Date(leaveRequest.start_date);
      const endDate = new Date(leaveRequest.end_date);
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Get current leave balance
      const balances = await query(
        `SELECT * FROM leave_balances
         WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
        [leaveRequest.user_id, leaveRequest.leave_type_id, new Date().getFullYear()]
      );
      
      if (balances.length > 0) {
        const balance = balances[0];
        
        // Update balance
        await updateLeaveBalance(balance.id, {
          balance: parseFloat(balance.balance) + diffDays,
          allocated: parseFloat(balance.allocated),
          used: parseFloat(balance.used) - diffDays
        });
      }
    }
    
    return result[0];
  } catch (error) {
    console.error("Error in updateLeaveRequestStatus:", error);
    throw error;
  }
}

// Delete leave request
export async function deleteLeaveRequest(id) {
  try {
    await query("DELETE FROM leave_requests WHERE id = $1", [id]);
    return { success: true, id };
  } catch (error) {
    console.error("Error in deleteLeaveRequest:", error);
    throw error;
  }
}
