import { getLeaveStatisticsByDepartment } from "../../../backend/models/leaveRequest"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { department } = req.query
    const statistics = await getLeaveStatisticsByDepartment(department || null)
    res.status(200).json(statistics)
  } catch (error) {
    console.error("Error fetching leave statistics by department:", error)
    res.status(500).json({ message: "Error fetching leave statistics" })
  }
}
