const formidable = require("formidable")
const fs = require("fs")
const path = require("path")
const { query } = require("../../../backend/lib/db")
const { verifyJWT } = require("../../../backend/utils/auth-utils")
const { authenticateUser } = require("../../../backend/middleware/auth")

// Désactiver le body parser par défaut pour les requêtes multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Utiliser authenticateUser au lieu de vérifier manuellement le token
    const user = await authenticateUser(req)
    if (!user) {
      return res.status(401).json({ error: "Non authentifié" })
    }

    const userId = user.id

    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Configurer formidable
    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    })

    // Traiter le fichier
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Erreur lors du traitement du fichier:", err)
        return res.status(500).json({ error: "Erreur lors du traitement du fichier" })
      }

      const file = files.avatar && files.avatar[0]
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier fourni" })
      }

      // Vérifier le type de fichier
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"]
      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.filepath) // Supprimer le fichier
        return res.status(400).json({ error: "Type de fichier non autorisé. Utilisez JPG, PNG ou GIF." })
      }

      // Renommer le fichier avec un nom unique
      const fileName = `avatar-${userId}-${Date.now()}${path.extname(file.originalFilename)}`
      const newPath = path.join(uploadDir, fileName)

      fs.renameSync(file.filepath, newPath)

      // Mettre à jour l'URL de l'avatar dans la base de données
      const avatarUrl = `/uploads/${fileName}`
      await query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, userId])

      return res.status(200).json({
        success: true,
        avatarUrl,
      })
    })
  } catch (error) {
    console.error("Erreur lors de l'upload de l'avatar:", error)
    return res.status(500).json({ error: "Erreur serveur interne: " + error.message })
  }
}
