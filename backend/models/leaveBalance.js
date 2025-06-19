import { query } from "../lib/db"

export async function getLeaveBalanceByUserId(userId) {
  return await query(
    `
    SELECT lb.*, lt.name as leave_type_name
    FROM leave_balances lb
    JOIN leave_types lt ON lb.leave_type_id = lt.id
    WHERE lb.user_id = ? AND lb.year = YEAR(CURDATE())
  `,
    [userId],
  )
}

export async function getLeaveBalanceByUserAndType(userId, leaveTypeId) {
  const balances = await query(
    `
    SELECT * FROM leave_balances
    WHERE user_id = ? AND leave_type_id = ? AND year = YEAR(CURDATE())
  `,
    [userId, leaveTypeId],
  )

  return balances.length ? balances[0] : null
}

export async function createOrUpdateLeaveBalance(userId, leaveTypeId, balance) {
  const currentYear = new Date().getFullYear()

  // Check if balance exists
  const existingBalance = await getLeaveBalanceByUserAndType(userId, leaveTypeId)

  if (existingBalance) {
    // Update existing balance
    return await query("UPDATE leave_balances SET balance = ? WHERE id = ?", [balance, existingBalance.id])
  } else {
    // Create new balance
    return await query("INSERT INTO leave_balances (user_id, leave_type_id, balance, year) VALUES (?, ?, ?, ?)", [
      userId,
      leaveTypeId,
      balance,
      currentYear,
    ])
  }
}

export async function deductLeaveBalance(userId, leaveTypeId, days) {
  const balance = await getLeaveBalanceByUserAndType(userId, leaveTypeId)

  if (!balance) {
    throw new Error("No leave balance found for this user and leave type")
  }

  const newBalance = balance.balance - days

  if (newBalance < 0) {
    throw new Error("Insufficient leave balance")
  }

  return await query("UPDATE leave_balances SET balance = ? WHERE id = ?", [newBalance, balance.id])
}

export async function addLeaveBalance(userId, leaveTypeId, days) {
  const balance = await getLeaveBalanceByUserAndType(userId, leaveTypeId)

  if (!balance) {
    // Create new balance with the specified days
    return await createOrUpdateLeaveBalance(userId, leaveTypeId, days)
  }

  const newBalance = balance.balance + days

  return await query("UPDATE leave_balances SET balance = ? WHERE id = ?", [newBalance, balance.id])
}

export async function initializeUserLeaveBalances(userId) {
  // Get all leave types
  const leaveTypes = await query("SELECT * FROM leave_types")

  // Initialize balances for each leave type
  for (const leaveType of leaveTypes) {
    // Default annual leave: 30 days
    // Default sick leave: 15 days
    // Default exceptional leave: 5 days
    let initialBalance = 0

    if (leaveType.name === "Congé annuel") {
      initialBalance = 30
    } else if (leaveType.name === "Congé maladie") {
      initialBalance = 15
    } else if (leaveType.name === "Congé exceptionnel") {
      initialBalance = 5
    }

    await createOrUpdateLeaveBalance(userId, leaveType.id, initialBalance)
  }
}

export async function getAllUsersWithBalances() {
  const users = await query(`
    SELECT id, username, full_name, email, role, department, created_at 
    FROM users
  `)

  // Get balances for each user
  for (const user of users) {
    const balances = await getLeaveBalanceByUserId(user.id)
    user.balances = balances
  }

  return users
}
