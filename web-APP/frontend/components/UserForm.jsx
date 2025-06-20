"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import toast from "react-hot-toast"
import { User, Lock, UserCheck, Mail, Building, UserCog } from "lucide-react"

const UserForm = ({ user = null, departments = [], onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    role: "employee",
    department: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        password: "", // Ne pas remplir le mot de passe en mode édition
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "employee",
        department: user.department || "",
      })
      setIsEdit(true)
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }

    // Check password strength if it's the password field
    if (name === "password" && value) {
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

  const validateForm = () => {
    const newErrors = {}

    // Validate username
    if (!isEdit && !formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis"
    } else if (!isEdit && formData.username.length < 3) {
      newErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères"
    }

    // Validate password
    if (!isEdit && !formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (!isEdit && passwordStrength < 3) {
      newErrors.password = "Le mot de passe n'est pas assez fort"
    } else if (isEdit && formData.password && passwordStrength < 3) {
      newErrors.password = "Le mot de passe n'est pas assez fort"
    }

    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Le nom complet est requis"
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validation
      if (!validateForm()) {
        setIsLoading(false)
        return
      }

      // Si c'est une édition et que le mot de passe est vide, on le supprime
      const dataToSubmit = { ...formData }
      if (isEdit && !dataToSubmit.password) {
        delete dataToSubmit.password
      }

      // Si c'est une édition, on supprime le nom d'utilisateur car il ne peut pas être modifié
      if (isEdit) {
        delete dataToSubmit.username
      }

      await onSubmit(dataToSubmit)

      setIsLoading(false)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error(error.message || "Une erreur est survenue")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEdit && (
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Nom d'utilisateur
          </label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`pl-10 block w-full rounded-md ${
                errors.username
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              } shadow-sm`}
            />
          </div>
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {isEdit ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`pl-10 block w-full rounded-md ${
              errors.password
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } shadow-sm`}
            required={!isEdit}
          />
        </div>
        {formData.password && (
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
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Nom complet
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserCheck className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`pl-10 block w-full rounded-md ${
              errors.full_name
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } shadow-sm`}
            required
          />
        </div>
        {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`pl-10 block w-full rounded-md ${
              errors.email
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } shadow-sm`}
            required
          />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Rôle
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserCog className="h-5 w-5 text-gray-400" />
          </div>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="employee">Employé</option>
            <option value="hr">Ressources Humaines</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
          Département
        </label>
        <div className="relative mt-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building className="h-5 w-5 text-gray-400" />
          </div>
          {departments && departments.length > 0 ? (
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Sélectionner un département</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Entrez le nom du département"
            />
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Chargement..." : isEdit ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </form>
  )
}

export default UserForm
