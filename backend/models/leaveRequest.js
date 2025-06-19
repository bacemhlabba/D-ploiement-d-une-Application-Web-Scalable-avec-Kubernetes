import { query } from "../lib/db"

export async function getAllLeaveRequests() {
  return await query(`
    SELECT lr.*, u.full_name, u.department, lt.name as leave_type_name
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    ORDER BY lr.created_at DESC
  `)
}

export async function getLeaveRequestById(id) {
  const requests = await query(
    `
    SELECT lr.*, u.full_name, u.department, lt.name as leave_type_name
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.id = ?
  `,
    [id],
  )

  return requests.length ? requests[0] : null
}

export async function getLeaveRequestsByUserId(userId) {
  return await query(
    `
    SELECT lr.*, lt.name as leave_type_name
    FROM leave_requests lr
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.user_id = ?
    ORDER BY lr.created_at DESC
  `,
    [userId],
  )
}

export async function getPendingLeaveRequests() {
  return await query(`
    SELECT lr.*, u.full_name, u.department, lt.name as leave_type_name
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.status = 'pending'
    ORDER BY lr.created_at ASC
  `)
}

export async function createLeaveRequest(requestData) {
  const { user_id, leave_type_id, start_date, end_date, total_days, reason } = requestData

  const result = await query(
    "INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, total_days, reason) VALUES (?, ?, ?, ?, ?, ?)",
    [user_id, leave_type_id, start_date, end_date, total_days, reason],
  )

  return result.insertId
}

export async function updateLeaveRequestStatus(id, status, rejection_reason = null) {
  return await query("UPDATE leave_requests SET status = ?, rejection_reason = ? WHERE id = ?", [
    status,
    rejection_reason,
    id,
  ])
}

export async function updateLeaveRequest(id, requestData) {
  const { leave_type_id, start_date, end_date, total_days, reason, status, rejection_reason } = requestData

  return await query(
    "UPDATE leave_requests SET leave_type_id = ?, start_date = ?, end_date = ?, total_days = ?, reason = ?, status = ?, rejection_reason = ? WHERE id = ?",
    [leave_type_id, start_date, end_date, total_days, reason, status, rejection_reason, id],
  )
}

export async function deleteLeaveRequest(id) {
  return await query("DELETE FROM leave_requests WHERE id = ?", [id])
}

export async function getLeaveStatistics(userId = null) {
  let sql = `
    SELECT 
      lt.name as leave_type,
      COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_count,
      COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_count,
      COUNT(CASE WHEN lr.status = 'modified' THEN 1 END) as modified_count,
      COUNT(*) as total_count
    FROM leave_requests lr
    JOIN leave_types lt ON lr.leave_type_id = lt.id
  `

  if (userId) {
    sql += " WHERE lr.user_id = ?"
    sql += " GROUP BY lt.name"
    return await query(sql, [userId])
  } else {
    sql += " GROUP BY lt.name"
    return await query(sql)
  }
}
