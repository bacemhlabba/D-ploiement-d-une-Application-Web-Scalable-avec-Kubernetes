import { query } from "../lib/db";

// Get all leave types
export async function getAllLeaveTypes() {
  try {
    return await query("SELECT * FROM leave_types ORDER BY name ASC");
  } catch (error) {
    console.error("Error in getAllLeaveTypes:", error);
    throw error;
  }
}

// Get leave type by ID
export async function getLeaveTypeById(id) {
  try {
    const leaveTypes = await query("SELECT * FROM leave_types WHERE id = $1", [id]);
    return leaveTypes[0];
  } catch (error) {
    console.error("Error in getLeaveTypeById:", error);
    throw error;
  }
}

// Create leave type
export async function createLeaveType(leaveType) {
  try {
    const { name, description, color } = leaveType;
    
    const result = await query(
      "INSERT INTO leave_types (name, description, color) VALUES ($1, $2, $3) RETURNING *",
      [name, description, color]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in createLeaveType:", error);
    throw error;
  }
}

// Update leave type
export async function updateLeaveType(id, updateData) {
  try {
    const { name, description, color } = updateData;
    
    const result = await query(
      "UPDATE leave_types SET name = $1, description = $2, color = $3 WHERE id = $4 RETURNING *",
      [name, description, color, id]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in updateLeaveType:", error);
    throw error;
  }
}

// Delete leave type
export async function deleteLeaveType(id) {
  try {
    await query("DELETE FROM leave_types WHERE id = $1", [id]);
    return { success: true, id };
  } catch (error) {
    console.error("Error in deleteLeaveType:", error);
    throw error;
  }
}
