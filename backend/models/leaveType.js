import { query } from "../lib/db"

export async function getAllLeaveTypes() {
  return await query("SELECT * FROM leave_types")
}

export async function getLeaveTypeById(id) {
  const types = await query("SELECT * FROM leave_types WHERE id = ?", [id])
  return types.length ? types[0] : null
}

export async function createLeaveType(typeData) {
  const { name, description, requires_approval, requires_justification } = typeData

  const result = await query(
    "INSERT INTO leave_types (name, description, requires_approval, requires_justification) VALUES (?, ?, ?, ?)",
    [name, description, requires_approval, requires_justification],
  )

  return result.insertId
}

export async function updateLeaveType(id, typeData) {
  const { name, description, requires_approval, requires_justification } = typeData

  const result = await query(
    "UPDATE leave_types SET name = ?, description = ?, requires_approval = ?, requires_justification = ? WHERE id = ?",
    [name, description, requires_approval, requires_justification, id],
  )

  return result.affectedRows > 0
}

export async function deleteLeaveType(id) {
  // Check if there are any leave requests using this type
  const requests = await query("SELECT COUNT(*) as count FROM leave_requests WHERE leave_type_id = ?", [id])

  if (requests[0].count > 0) {
    throw new Error("Cannot delete leave type that is being used by leave requests")
  }

  // Check if there are any leave balances using this type
  const balances = await query("SELECT COUNT(*) as count FROM leave_balances WHERE leave_type_id = ?", [id])

  if (balances[0].count > 0) {
    throw new Error("Cannot delete leave type that is being used by leave balances")
  }

  return await query("DELETE FROM leave_types WHERE id = ?", [id])
}
