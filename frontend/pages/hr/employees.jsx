"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateLeaveBalance,
  getDepartments,
  getLeaveTypes,
} from "../../frontend/services/api"
import {
  User,
  Mail,
  Briefcase,
  Clock,
  Edit,
  Save,
  X,
  Trash2,
  Search,
  UserPlus,
  Download,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import toast from "react-hot-toast"
import UserForm from "../../frontend/components/UserForm"

const Employees = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [editingBalance, setEditingBalance] = useState(null)
  const [newBalance, setNewBalance] = useState("")
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [departments, setDepartments] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortField, setSortField] = useState("full_name")
  const [sortDirection, setSortDirection] = useState("asc")
  const [view, setView] = useState("list") // list, grid, table

  useEffect(() => {
    // Redirect if not HR
    if (user && user.role !== "hr") {
      window.location.href = "/dashboard"
      return
    }

    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all required data in parallel
      const [usersResult, departmentsResult, leaveTypesResult] = await Promise.all([
        getUsers(),
        getDepartments(),
        getLeaveTypes(),
      ])

      // Check for errors
      if (usersResult.error) {
        throw new Error(usersResult.message || "Erreur lors de la récupération des utilisateurs")
      }

      setEmployees(usersResult)
      setDepartments(departmentsResult)
      setLeaveTypes(leaveTypesResult)
      setIsLoading(false)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
      toast.error(err.message)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
    toast.success("Données actualisées")
  }

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee)
    setEditingBalance(null)
  }

  const startEditBalance = (balanceId, currentBalance) => {
    setEditingBalance(balanceId)
    setNewBalance(currentBalance.toString())
  }

  const cancelEditBalance = () => {
    setEditingBalance(null)
    setNewBalance("")
  }

  const saveBalance = async (userId, leaveTypeId, balanceId) => {
    try {
      const balanceValue = Number.parseFloat(newBalance)

      if (isNaN(balanceValue) || balanceValue < 0) {
        toast.error("Veuillez entrer un nombre valide")
        return
      }

      const result = await updateLeaveBalance(userId, leaveTypeId, balanceValue)

      if (result.error) {
        throw new Error(result.message || "Erreur lors de la mise à jour du solde")
      }

      // Update the local state
      const updatedEmployees = employees.map((emp) => {
        if (emp.id === userId) {
          const updatedBalances = emp.balances.map((bal) => {
            if (bal.id === balanceId) {
              return { ...bal, balance: balanceValue }
            }
            return bal
          })
          return { ...emp, balances: updatedBalances }
        }
        return emp
      })

      setEmployees(updatedEmployees)

      // If this is the selected employee, update that too
      if (selectedEmployee && selectedEmployee.id === userId) {
        const updatedBalances = selectedEmployee.balances.map((bal) => {
          if (bal.id === balanceId) {
            return { ...bal, balance: balanceValue }
          }
          return bal
        })
        setSelectedEmployee({ ...selectedEmployee, balances: updatedBalances })
      }

      setEditingBalance(null)
      setSuccessMessage("Solde mis à jour avec succès")
      toast.success("Solde mis à jour avec succès")
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    }
  }

  const handleCreateUser = async (userData) => {
    try {
      setError(null)
      setSuccessMessage("")

      const result = await createUser(userData)

      if (result.error) {
        throw new Error(result.message || "Erreur lors de la création de l'utilisateur")
      }

      setSuccessMessage("Utilisateur créé avec succès")
      toast.success("Utilisateur créé avec succès")
      setShowUserForm(false)
      await fetchData()
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
    }
  }

  const handleUpdateUser = async (userData) => {
    try {
      setError(null)
      setSuccessMessage("")

      const result = await updateUser(editingUser.id, userData)

      if (result.error) {
        throw new Error(result.message || "Erreur lors de la mise à jour de l'utilisateur")
      }

      setSuccessMessage("Utilisateur mis à jour avec succès")
      toast.success("Utilisateur mis à jour avec succès")
      setEditingUser(null)
      await fetchData()

      // Si l'utilisateur mis à jour est l'utilisateur sélectionné, mettre à jour la sélection
      if (selectedEmployee && selectedEmployee.id === editingUser.id) {
        const updatedUser = await getUserById(editingUser.id)
        setSelectedEmployee(updatedUser)
      }
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
    }
  }

  const handleDeleteUser = async (id) => {
    try {
      setError(null)
      setSuccessMessage("")

      const result = await deleteUser(id)

      if (result.error) {
        throw new Error(result.message || "Erreur lors de la suppression de l'utilisateur")
      }

      setSuccessMessage("Utilisateur supprimé avec succès")
      toast.success("Utilisateur supprimé avec succès")

      // Mettre à jour la liste des employés
      setEmployees(employees.filter((emp) => emp.id !== id))

      // Si l'utilisateur supprimé est l'utilisateur sélectionné, réinitialiser la sélection
      if (selectedEmployee && selectedEmployee.id === id) {
        setSelectedEmployee(null)
      }

      setConfirmDelete(null)
    } catch (error) {
      setError(error.message)
      toast.error(error.message)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const exportEmployees = () => {
    try {
      // Create CSV content
      let csvContent = "ID,Nom,Email,Département,Rôle,Date d'inscription\n"

      filteredEmployees.forEach((emp) => {
        csvContent += `${emp.id},"${emp.full_name}","${emp.email}","${emp.department || ""}","${
          emp.role
        }","${new Date(emp.created_at).toLocaleDateString()}"\n`
      })

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", "employees.csv")
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Export réussi")
    } catch (error) {
      toast.error("Erreur lors de l'export")
    }
  }

  // Filtrer et trier les employés
  const filteredEmployees = employees
    .filter((employee) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        employee.full_name.toLowerCase().includes(searchLower) ||
        employee.username.toLowerCase().includes(searchLower) ||
        (employee.department && employee.department.toLowerCase().includes(searchLower)) ||
        employee.email.toLowerCase().includes(searchLower)

      const matchesDepartment = filterDepartment ? employee.department === filterDepartment : true
      const matchesRole = filterRole ? employee.role === filterRole : true

      return matchesSearch && matchesDepartment && matchesRole
    })
    .sort((a, b) => {
      // Handle different field types
      if (sortField === "full_name" || sortField === "email" || sortField === "department") {
        const aValue = (a[sortField] || "").toLowerCase()
        const bValue = (b[sortField] || "").toLowerCase()
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (sortField === "created_at") {
        const aDate = new Date(a.created_at)
        const bDate = new Date(b.created_at)
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate
      }
      return 0
    })

  if (isLoading) {
    return (
      <Layout title="Gestion des employés | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Gestion des employés | Gestion de Congés">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des employés</h1>
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
            onClick={exportEmployees}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Exporter
          </button>
          <button
            onClick={() => {
              setShowUserForm(true)
              setEditingUser(null)
              setSelectedEmployee(null)
            }}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Nouvel employé
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

      {showUserForm && !editingUser && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Créer un nouvel employé</h2>
            <button onClick={() => setShowUserForm(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <UserForm departments={departments} onSubmit={handleCreateUser} onCancel={() => setShowUserForm(false)} />
        </div>
      )}

      {editingUser && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Modifier l'employé</h2>
            <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <UserForm
            user={editingUser}
            departments={departments}
            onSubmit={handleUpdateUser}
            onCancel={() => setEditingUser(null)}
          />
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer l'employé <strong>{confirmDelete.full_name}</strong> ? Cette action est
              irréversible et supprimera également toutes les demandes de congés et soldes associés.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteUser(confirmDelete.id)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Tous les départements</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>

            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="">Tous les rôles</option>
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
                <option value="hr">RH</option>
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>

            <div className="relative">
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="list">Vue liste</option>
                <option value="grid">Vue grille</option>
                <option value="table">Vue tableau</option>
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-blue-600 text-white">
              <h2 className="text-lg font-semibold">Liste des employés</h2>
              <p className="text-sm opacity-80">{filteredEmployees.length} employés trouvés</p>
            </div>

            <div className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    className={`w-full text-left p-4 hover:bg-gray-50 focus:outline-none ${
                      selectedEmployee && selectedEmployee.id === employee.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleEmployeeClick(employee)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{employee.full_name}</p>
                        <p className="text-sm text-gray-500">{employee.department || "Aucun département"}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">Aucun employé trouvé</div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedEmployee ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{selectedEmployee.full_name}</h2>
                  <p className="text-gray-600">
                    {selectedEmployee.role === "hr"
                      ? "DRH"
                      : selectedEmployee.role === "manager"
                        ? "Manager"
                        : "Employé"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingUser(selectedEmployee)
                      setShowUserForm(false)
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Modifier l'employé"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(selectedEmployee)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="Supprimer l'employé"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Nom d'utilisateur</p>
                      <p className="font-medium">{selectedEmployee.username}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedEmployee.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Briefcase className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Département</p>
                      <p className="font-medium">{selectedEmployee.department || "Non spécifié"}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Date d'inscription</p>
                      <p className="font-medium">{new Date(selectedEmployee.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Soldes de congés</h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type de congé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Solde disponible
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Année
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEmployee.balances && selectedEmployee.balances.length > 0 ? (
                        selectedEmployee.balances.map((balance) => (
                          <tr key={balance.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{balance.leave_type_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingBalance === balance.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  className="border border-gray-300 rounded-md px-2 py-1 w-20 text-sm"
                                  value={newBalance}
                                  onChange={(e) => setNewBalance(e.target.value)}
                                />
                              ) : (
                                <div className="text-sm text-gray-900">{balance.balance}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{balance.year}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingBalance === balance.id ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => saveBalance(selectedEmployee.id, balance.leave_type_id, balance.id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Enregistrer"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditBalance}
                                    className="text-red-600 hover:text-red-900"
                                    title="Annuler"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditBalance(balance.id, balance.balance)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Modifier le solde"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-center" colSpan={4}>
                            Aucun solde de congé disponible.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500">
                Sélectionnez un employé pour voir les détails ou cliquez sur "Nouvel employé" pour en créer un.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Employees
