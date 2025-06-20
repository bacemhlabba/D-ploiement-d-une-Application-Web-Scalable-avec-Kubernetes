"use client"

import { useState, useEffect, useRef } from "react"
import Layout from "../frontend/components/Layout"
import { useAuth } from "../frontend/contexts/AuthContext"
import { getUserProfile, updateUserProfile, uploadAvatar } from "../frontend/services/api"
import { User, Mail, Briefcase, Save, Lock, Clock, Camera, X, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

const Profile = () => {
  const { user, updateUserProfile: updateAuthUser } = useAuth()
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    department: "",
  })
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("profile") // profile, password, activity
  const [avatarUrl, setAvatarUrl] = useState("/placeholder.svg?key=deunb")
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const profile = await getUserProfile()

        if (profile.error) {
          throw new Error(profile.message || "Erreur lors de la récupération du profil")
        }

        setProfileData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          department: profile.department || "",
        })

        // Set avatar if available
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }

        setIsLoading(false)
      } catch (err) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData({
      ...profileData,
      [name]: value,
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData({
      ...passwordData,
      [name]: value,
    })

    // Check password strength if it's the new password field
    if (name === "new_password") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password) => {
    // Simple password strength checker
    let strength = 0
    let feedback = ""

    if (password.length >= 8) {
      strength += 1
    } else {
      feedback = "Le mot de passe doit contenir au moins 8 caractères"
    }

    if (/[A-Z]/.test(password)) {
      strength += 1
    } else if (password.length > 0) {
      feedback = "Le mot de passe doit contenir au moins une majuscule"
    }

    if (/[0-9]/.test(password)) {
      strength += 1
    } else if (password.length > 0) {
      feedback = "Le mot de passe doit contenir au moins un chiffre"
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1
    } else if (password.length > 0) {
      feedback = "Le mot de passe doit contenir au moins un caractère spécial"
    }

    setPasswordStrength(strength)
    setPasswordFeedback(feedback)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      // Validation
      if (!profileData.full_name.trim()) {
        throw new Error("Le nom complet est requis")
      }

      if (!profileData.email.trim() || !/\S+@\S+\.\S+/.test(profileData.email)) {
        throw new Error("Veuillez entrer une adresse email valide")
      }

      const result = await updateUserProfile(profileData)

      if (result.error) {
        throw new Error(result.message || "Erreur lors de la mise à jour du profil")
      }

      // Update user in auth context
      updateAuthUser({
        full_name: profileData.full_name,
        email: profileData.email,
        department: profileData.department,
      })

      setSuccessMessage("Profil mis à jour avec succès")
      toast.success("Profil mis à jour avec succès")
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage("")

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("Les nouveaux mots de passe ne correspondent pas")
      return
    }

    // Validate password strength
    if (passwordStrength < 3) {
      setError("Le mot de passe n'est pas assez fort. " + passwordFeedback)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateUserProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })

      if (result.error) {
        throw new Error(result.message || "Erreur lors de la mise à jour du mot de passe")
      }

      // Reset password fields
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })

      setSuccessMessage("Mot de passe mis à jour avec succès")
      toast.success("Mot de passe mis à jour avec succès")
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarClick = () => {
    // Trigger file input click
    fileInputRef.current.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Type de fichier non valide. Seuls JPEG, PNG, GIF et WebP sont autorisés.")
      toast.error("Type de fichier non valide")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. La taille maximale est de 5 Mo.")
      toast.error("Fichier trop volumineux")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create a local preview
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarUrl(reader.result)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const result = await uploadAvatar(file)

      if (result.error) {
        throw new Error(result.message || "Erreur lors de l'upload de l'avatar")
      }

      // Update avatar URL with the one from server
      setAvatarUrl(result.avatar_url)

      // Update user in auth context
      updateAuthUser({
        avatar_url: result.avatar_url,
      })

      setSuccessMessage("Avatar mis à jour avec succès")
      toast.success("Avatar mis à jour avec succès")
    } catch (err) {
      setError(err.message)
      toast.error(err.message)

      // Revert to previous avatar if there was an error
      const profile = await getUserProfile()
      if (!profile.error && profile.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      } else {
        setAvatarUrl("/placeholder.svg?key=deunb")
      }
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <Layout title="Mon profil | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Mon profil | Gestion de Congés">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
          role="alert"
        >
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{successMessage}</span>
          </div>
          <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage("")}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "profile" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Informations personnelles
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("password")}
          >
            Mot de passe
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === "activity"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("activity")}
          >
            Activité récente
          </button>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit}>
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={avatarUrl || "/placeholder.svg?key=deunb"}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarChange}
                        disabled={isUploading}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Cliquez sur l'icône pour changer votre photo</p>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={profileData.full_name}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Département
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={profileData.department}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  {passwordData.new_password && (
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              passwordStrength === 0
                                ? "bg-red-500 w-1/4"
                                : passwordStrength === 1
                                  ? "bg-orange-500 w-2/4"
                                  : passwordStrength === 2
                                    ? "bg-yellow-500 w-3/4"
                                    : "bg-green-500 w-full"
                            }`}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          {passwordStrength === 0
                            ? "Faible"
                            : passwordStrength === 1
                              ? "Moyen"
                              : passwordStrength === 2
                                ? "Bon"
                                : "Fort"}
                        </span>
                      </div>
                      {passwordFeedback && <p className="text-xs text-red-500 mt-1">{passwordFeedback}</p>}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      id="confirm_password"
                      name="confirm_password"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        passwordData.new_password &&
                        passwordData.confirm_password &&
                        passwordData.new_password !== passwordData.confirm_password
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      } rounded-md shadow-sm focus:outline-none sm:text-sm`}
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  {passwordData.new_password &&
                    passwordData.confirm_password &&
                    passwordData.new_password !== passwordData.confirm_password && (
                      <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                    )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Changer le mot de passe
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === "activity" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Activité récente</h3>
              <div className="space-y-4">
                <div className="border-l-2 border-blue-500 pl-4 py-2">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500">Aujourd'hui</span>
                  </div>
                  <p className="mt-1 text-gray-800">Connexion au système</p>
                </div>
                <div className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500">Il y a 2 jours</span>
                  </div>
                  <p className="mt-1 text-gray-800">Mise à jour du profil</p>
                </div>
                <div className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500">Il y a 5 jours</span>
                  </div>
                  <p className="mt-1 text-gray-800">Demande de congé créée</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Profile
