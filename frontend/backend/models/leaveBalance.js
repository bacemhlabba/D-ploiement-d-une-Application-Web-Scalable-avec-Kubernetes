import { query } from "../lib/db";

// Get leave balance for a user
export async function getLeaveBalanceForUser(userId) {
  try {
    return await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.color
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = $1`,
      [userId]
    );
  } catch (error) {
    console.error("Error in getLeaveBalanceForUser:", error);
    throw error;
  }
}

// Get leave balance by user ID (alias for consistent API)
export async function getLeaveBalanceByUserId(userId) {
  return getLeaveBalanceForUser(userId);
}

// Get leave balance by ID
export async function getLeaveBalanceById(id) {
  try {
    const balances = await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.color
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.id = $1`,
      [id]
    );
    return balances[0];
  } catch (error) {
    console.error("Error in getLeaveBalanceById:", error);
    throw error;
  }
}

// Create leave balance
export async function createLeaveBalance(leaveBalance) {
  try {
    const { user_id, leave_type_id, balance, allocated, used, year } = leaveBalance;
    
    const result = await query(
      `INSERT INTO leave_balances (user_id, leave_type_id, balance, allocated, used, year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, leave_type_id, balance, allocated, used, year]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in createLeaveBalance:", error);
    throw error;
  }
}

// Update leave balance
export async function updateLeaveBalance(id, updateData) {
  try {
    const { balance, allocated, used } = updateData;
    
    const result = await query(
      `UPDATE leave_balances
       SET balance = $1, allocated = $2, used = $3
       WHERE id = $4
       RETURNING *`,
      [balance, allocated, used, id]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in updateLeaveBalance:", error);
    throw error;
  }
}

// Initialize default leave balances for a new user
export async function initializeLeaveBalancesForUser(userId) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get all leave types
    const leaveTypes = await query("SELECT id FROM leave_types");
    
    // Create default balance for each leave type
    for (const leaveType of leaveTypes) {
      await query(
        `INSERT INTO leave_balances (user_id, leave_type_id, balance, allocated, used, year)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, leave_type_id, year) DO NOTHING`,
        [userId, leaveType.id, 10, 10, 0, currentYear]
      );
    }
    
    return await getLeaveBalanceForUser(userId);
  } catch (error) {
    console.error("Error in initializeLeaveBalancesForUser:", error);
    throw error;
  }
}

// Alias for consistency with other parts of the codebase
export async function initializeUserLeaveBalances(userId) {
  return initializeLeaveBalancesForUser(userId);
}

// Alias for consistent API naming
export async function initializeUserLeaveBalances(userId) {
  return initializeLeaveBalancesForUser(userId);
}

// Get all users with their leave balances
export async function getAllUsersWithBalances() {
  try {
    const users = await query("SELECT id, username, email, role FROM users");
    
    // For each user, fetch their leave balances
    for (const user of users) {
      user.leaveBalances = await getLeaveBalanceForUser(user.id);
    }
    
    return users;
  } catch (error) {
    console.error("Error in getAllUsersWithBalances:", error);
    throw error;
  }
}

// Get leave balance for a specific user and leave type
export async function getLeaveBalanceByUserAndType(userId, leaveTypeId) {
  try {
    const balances = await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.color
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.user_id = $1 AND lb.leave_type_id = $2`,
      [userId, leaveTypeId]
    );
    return balances[0];
  } catch (error) {
    console.error("Error in getLeaveBalanceByUserAndType:", error);
    throw error;
  }
}

// Create or update leave balance
export async function createOrUpdateLeaveBalance(userId, leaveTypeId, balance, allocated, used) {
  try {
    const year = new Date().getFullYear();
    
    // Check if the leave balance exists
    const existingBalance = await query(
      "SELECT id FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3",
      [userId, leaveTypeId, year]
    );
    
    if (existingBalance.length > 0) {
      // Update existing balance
      const result = await query(
        `UPDATE leave_balances 
         SET balance = $1, allocated = $2, used = $3
         WHERE id = $4
         RETURNING *`,
        [balance, allocated, used, existingBalance[0].id]
      );
      return result[0];
    } else {
      // Create new balance
      const result = await query(
        `INSERT INTO leave_balances (user_id, leave_type_id, balance, allocated, used, year)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, leaveTypeId, balance, allocated, used, year]
      );
      return result[0];
    }
  } catch (error) {
    console.error("Error in createOrUpdateLeaveBalance:", error);
    throw error;
  }
}

// Deduct days from leave balance
export async function deductLeaveBalance(userId, leaveTypeId, days) {
  try {
    const year = new Date().getFullYear();
    
    // Get current balance
    const balances = await query(
      "SELECT * FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3",
      [userId, leaveTypeId, year]
    );
    
    if (balances.length === 0) {
      throw new Error("Leave balance not found");
    }
    
    const balance = balances[0];
    
    // Update balance
    const result = await query(
      `UPDATE leave_balances
       SET balance = balance - $1, used = used + $1
       WHERE id = $2
       RETURNING *`,
      [days, balance.id]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in deductLeaveBalance:", error);
    throw error;
  }
}

// Add days back to leave balance
export async function addLeaveBalance(userId, leaveTypeId, days) {
  try {
    const year = new Date().getFullYear();
    
    // Get current balance
    const balances = await query(
      "SELECT * FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3",
      [userId, leaveTypeId, year]
    );
    
    if (balances.length === 0) {
      throw new Error("Leave balance not found");
    }
    
    const balance = balances[0];
    
    // Update balance
    const result = await query(
      `UPDATE leave_balances
       SET balance = balance + $1, used = used - $1
       WHERE id = $2
       RETURNING *`,
      [days, balance.id]
    );
    
    return result[0];
  } catch (error) {
    console.error("Error in addLeaveBalance:", error);
    throw error;
  }
}

// Get all leave balances
export async function getAllLeaveBalances() {
  try {
    return await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.color, u.username, u.email
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       JOIN users u ON lb.user_id = u.id`
    );
  } catch (error) {
    console.error("Error in getAllLeaveBalances:", error);
    throw error;
  }
}
