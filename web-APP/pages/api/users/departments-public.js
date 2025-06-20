import { getDepartments } from "../../../backend/models/user"

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      console.log("Public API: Fetching departments...")
      const departments = await getDepartments()
      console.log("Public API: Departments fetched:", departments)

      // Ensure we always return an array
      if (!Array.isArray(departments)) {
        console.error("Public API: getDepartments did not return an array:", departments)
        return res.status(200).json([])
      }

      // Filter out any null or undefined values
      const filteredDepartments = departments.filter((dept) => dept != null)
      console.log("Public API: Filtered departments:", filteredDepartments)

      return res.status(200).json(filteredDepartments)
    } catch (error) {
      console.error("Public API: Error fetching departments:", error)
      // Return an empty array instead of an error to avoid breaking the client
      return res.status(200).json([])
    }
  } else {
    return res.status(405).json({ message: "Méthode non autorisée" })
  }
}
