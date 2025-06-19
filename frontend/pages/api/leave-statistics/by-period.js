import { getLeaveStatisticsByPeriod } from "../../../backend/models/leaveRequest"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { period } = req.query
    const statistics = await getLeaveStatisticsByPeriod(period || null)
    res.status(200).json(statistics)
  } catch (error) {
    console.error("Error fetching leave statistics by period:", error)
    res.status(500).json({ message: "Error fetching leave statistics" })
  }
}
