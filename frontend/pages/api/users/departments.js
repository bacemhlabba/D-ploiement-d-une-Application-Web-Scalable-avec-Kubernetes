import { getDepartments } from "../../../backend/models/user"
import { withAuth } from "../../../backend/middleware/auth"

async function handler(req, res) {
  if (req.method === "GET") {
    try {
      console.log("API: Fetching departments...")
      const departments = await getDepartments()
      console.log("API: Departments fetched:", departments)

      // Ensure we always return an array
      if (!Array.isArray(departments)) {
        console.error("API: getDepartments did not return an array:", departments)
        return res.status(200).json([])
      }

      // Filter out any null or undefined values
      const filteredDepartments = departments.filter((dept) => dept != null)
      console.log("API: Filtered departments:", filteredDepartments)

      return res.status(200).json(filteredDepartments)
    } catch (error) {
      console.error("API: Error fetching departments:", error)
      // Return an empty array instead of an error to avoid breaking the client
      return res.status(200).json([])
    }
  } else {
    return res.status(405).json({ message: "Méthode non autorisée" })
  }
}

export default withAuth(handler)
