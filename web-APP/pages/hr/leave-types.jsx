"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from "../../frontend/services/api"
import { Plus, Edit, Trash2, Check, X, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

const LeaveTypesManagement = () => {
  const { user } = useAuth()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requires_approval: true,
    requires_justification: false,
    default_days: 0,
    color: "#3b82f6", // Bleu par défaut
    icon: "calendar",
    is_active: true,
  })

  useEffect(() => {
    // Redirect if not HR
    if (user && user.role !== "hr") {
      window.location.href = "/dashboard"
      return
    }

    fetchLeaveTypes()
  }, [user])

  const fetchLeaveTypes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const types = await getLeaveTypes()
      setLeaveTypes(types)
      setIsLoading(false)
    } catch (err) {
      setError(err.message || "Une erreur s'est produite lors de la récupération des types de congés")
      setIsLoading(false)
      toast.error("Erreur lors du chargement des types de congés")
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchLeaveTypes()
    setIsRefreshing(false)
    toast.success("Données actualisées")
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      setSuccessMessage("")

      if (!formData.name) {
        toast.error("Le nom du type de congé est requis")
        return
      }

      if (editingId) {
        await updateLeaveType(editingId, formData)
        setSuccessMessage("Type de congé mis à jour avec succès")
        toast.success("Type de congé mis à jour avec succès")
      } else {
        await createLeaveType(formData)
        setSuccessMessage("Type de congé créé avec succès")
        toast.success("Type de congé créé avec succès")
      }

      // Reset form and fetch updated data
      resetForm()
      fetchLeaveTypes()
    } catch (err) {
      setError(err.message || "Une erreur s'est produite")
      toast.error(err.message || "Une erreur s'est produite")
    }
  }

  const handleEdit = (type) => {
    setFormData({
      name: type.name,
      description: type.description || "",
      requires_approval: type.requires_approval,
      requires_justification: type.requires_justification,
      default_days: type.default_days || 0,
      color: type.color || "#3b82f6",
      icon: type.icon || "calendar",
      is_active: type.is_active !== false, // default to true if not specified
    })
    setEditingId(type.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      setError(null)
      setSuccessMessage("")

      await deleteLeaveType(id)

      setSuccessMessage("Type de congé supprimé avec succès")
      toast.success("Type de congé supprimé avec succès")

      fetchLeaveTypes()
      setDeleteConfirmId(null)
    } catch (err) {
      setError(err.message || "Une erreur s'est produite")
      toast.error(err.message || "Une erreur s'est produite")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      requires_approval: true,
      requires_justification: false,
      default_days: 0,
      color: "#3b82f6",
      icon: "calendar",
      is_active: true,
    })
    setEditingId(null)
    setShowForm(false)
  }

  if (isLoading) {
    return (
      <Layout title="Gestion des types de congés | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Gestion des types de congés | Gestion de Congés">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des types de congés</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 flex items-center"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
          >
            {showForm ? (
              <>
                <X className="h-5 w-5 mr-2" />
                Annuler
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un type de congé
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="block sm:inline">{error}</span>
          </div>
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

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Modifier le type de congé" : "Ajouter un type de congé"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label htmlFor="default_days" className="block text-sm font-medium text-gray-700 mb-1">
                    Jours par défaut
                  </label>
                  <input
                    type="number"
                    id="default_days"
                    name="default_days"
                    min="0"
                    step="0.5"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.default_days}
                    onChange={handleChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nombre de jours attribués par défaut pour ce type de congé (0 = illimité)
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      className="h-10 w-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.color}
                      onChange={handleChange}
                    />
                    <input
                      type="text"
                      className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requires_approval"
                      name="requires_approval"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.requires_approval}
                      onChange={handleChange}
                    />
                    <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-700">
                      Nécessite une approbation
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Si coché, les demandes de ce type nécessiteront une approbation par un responsable RH.
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requires_justification"
                      name="requires_justification"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.requires_justification}
                      onChange={handleChange}
                    />
                    <label htmlFor="requires_justification" className="ml-2 block text-sm text-gray-700">
                      Nécessite une justification
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Si coché, les employés devront fournir une justification lors de la demande de ce type de congé.
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Actif
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Si décoché, ce type de congé ne sera pas disponible pour les nouvelles demandes.
                  </p>
                </div>

                <div className="mb-4">
                  <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                    Icône
                  </label>
                  <select
                    id="icon"
                    name="icon"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.icon}
                    onChange={handleChange}
                  >
                    <option value="calendar">Calendrier</option>
                    <option value="briefcase">Mallette</option>
                    <option value="heart">Cœur</option>
                    <option value="umbrella">Parapluie</option>
                    <option value="plane">Avion</option>
                    <option value="home">Maison</option>
                    <option value="baby">Bébé</option>
                    <option value="graduation-cap">Diplôme</option>
                    <option value="medkit">Médical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2"
              >
                Annuler
              </button>
              <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                {editingId ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jours par défaut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approbation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Justification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveTypes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Aucun type de congé trouvé
                  </td>
                </tr>
              ) : (
                leaveTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center mr-2"
                          style={{ backgroundColor: type.color || "#3b82f6" }}
                        >
                          <span className="text-white text-xs">{type.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{type.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{type.default_days || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          type.requires_approval ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.requires_approval ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          type.requires_justification ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {type.requires_justification ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          type.is_active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {type.is_active !== false ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {deleteConfirmId === type.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-red-600">Confirmer?</span>
                          <button
                            onClick={() => handleDelete(type.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Confirmer la suppression"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Annuler"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(type)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(type.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default LeaveTypesManagement
