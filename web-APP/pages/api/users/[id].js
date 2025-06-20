import { getUserById, updateUser, deleteUser, changePassword } from "../../../backend/models/user"
import { withAuth } from "../../../backend/middleware/auth"

async function handler(req, res) {
  // Vérifier si l'utilisateur est un administrateur RH
  if (req.user.role !== "hr") {
    return res.status(403).json({ message: "Accès non autorisé" })
  }

  const { id } = req.query

  if (req.method === "GET") {
    try {
      const user = await getUserById(id)
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }
      return res.status(200).json(user)
    } catch (error) {
      console.error("Error fetching user:", error)
      return res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" })
    }
  } else if (req.method === "PUT") {
    try {
      const { full_name, email, department, role, password } = req.body

      // Validation
      if (!full_name || !email) {
        return res.status(400).json({ message: "Le nom complet et l'email sont obligatoires" })
      }

      // Mettre à jour l'utilisateur
      const updated = await updateUser(id, {
        full_name,
        email,
        department,
        role,
      })

      // Si un nouveau mot de passe est fourni, le mettre à jour
      if (password) {
        await changePassword(id, password)
      }

      if (!updated) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }

      return res.status(200).json({ message: "Utilisateur mis à jour avec succès" })
    } catch (error) {
      console.error("Error updating user:", error)
      return res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" })
    }
  } else if (req.method === "DELETE") {
    try {
      const deleted = await deleteUser(id)
      if (!deleted) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }
      return res.status(200).json({ message: "Utilisateur supprimé avec succès" })
    } catch (error) {
      console.error("Error deleting user:", error)
      return res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur" })
    }
  } else {
    return res.status(405).json({ message: "Méthode non autorisée" })
  }
}

export default withAuth(handler)
