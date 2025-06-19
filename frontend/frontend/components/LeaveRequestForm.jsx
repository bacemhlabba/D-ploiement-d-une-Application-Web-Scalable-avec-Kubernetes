"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { getLeaveTypes, getLeaveBalances, createLeaveRequest } from "../services/api"
import { Calendar, FileText, Info } from "lucide-react"
import toast from "react-hot-toast"

const LeaveRequestForm = ({ onSuccess }) => {
  const router = useRouter()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalances, setLeaveBalances] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch leave types
        const types = await getLeaveTypes()
        setLeaveTypes(types)

        // Fetch leave balances
        const balances = await getLeaveBalances()
        setLeaveBalances(balances)

        setIsLoading(false)
      } catch (err) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const calculateTotalDays = () => {
    if (!formData.start_date || !formData.end_date) return 0

    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)

    if (startDate > endDate) return 0

    const diffTime = Math.abs(endDate - startDate)
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    return totalDays
  }

  const getLeaveBalance = (leaveTypeId) => {
    if (!leaveTypeId) return null

    const balance = leaveBalances.find((b) => b.leave_type_id === Number.parseInt(leaveTypeId))
    return balance ? balance.balance : 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (!formData.leave_type_id || !formData.start_date || !formData.end_date) {
      setError("Veuillez remplir tous les champs obligatoires")
      return
    }

    const totalDays = calculateTotalDays()

    if (totalDays <= 0) {
      setError("La date de fin doit être postérieure à la date de début")
      return
    }

    // Check if selected leave type requires a reason
    const selectedLeaveType = leaveTypes.find((type) => type.id === Number.parseInt(formData.leave_type_id))

    if (selectedLeaveType && selectedLeaveType.requires_justification && !formData.reason) {
      setError("Un motif est requis pour ce type de congé")
      return
    }

    // Check leave balance for annual and sick leave
    if (formData.leave_type_id === "1" || formData.leave_type_id === "2") {
      const balance = getLeaveBalance(formData.leave_type_id)

      if (balance < totalDays) {
        setError(`Solde de congé insuffisant. Solde actuel: ${balance} jour(s)`)
        return
      }
    }

    try {
      setIsSubmitting(true)

      await createLeaveRequest(formData)

      toast.success("Demande de congé créée avec succès")
      setFormData({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/leave-requests")
        }, 2000)
      }

      setIsSubmitting(false)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const selectedLeaveType = formData.leave_type_id
    ? leaveTypes.find((type) => type.id === Number.parseInt(formData.leave_type_id))
    : null

  const requiresJustification = selectedLeaveType ? selectedLeaveType.requires_justification : false
  const totalDays = calculateTotalDays()
  const currentBalance = getLeaveBalance(formData.leave_type_id)

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">Nouvelle demande de congé</h1>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="leave_type_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Type de congé *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="leave_type_id"
                    name="leave_type_id"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.leave_type_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner un type de congé</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {requiresJustification && (
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Motif *
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows="4"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Veuillez fournir un motif pour votre demande de congé"
                    value={formData.reason}
                    onChange={handleChange}
                    required={requiresJustification}
                  ></textarea>
                </div>
              )}
            </div>

            <div>
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Récapitulatif</h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type de congé:</span>
                    <span className="font-medium">{selectedLeaveType ? selectedLeaveType.name : "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Période:</span>
                    <span className="font-medium">
                      {formData.start_date && formData.end_date
                        ? `${formData.start_date} au ${formData.end_date}`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre de jours:</span>
                    <span className="font-medium">{totalDays || "-"}</span>
                  </div>

                  {(formData.leave_type_id === "1" || formData.leave_type_id === "2") && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solde disponible:</span>
                      <span className={`font-medium ${currentBalance < totalDays ? "text-red-600" : ""}`}>
                        {currentBalance !== null ? `${currentBalance} jour(s)` : "-"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {(formData.leave_type_id === "1" || formData.leave_type_id === "2") && totalDays > 0 && (
                <div
                  className={`p-4 rounded-md mb-6 ${
                    currentBalance < totalDays ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
                  }`}
                >
                  <div className="flex">
                    <Info className="h-5 w-5 mr-2" />
                    <div>
                      {currentBalance < totalDays
                        ? `Solde insuffisant. Il vous manque ${totalDays - currentBalance} jour(s).`
                        : `Solde suffisant. Il vous restera ${currentBalance - totalDays} jour(s) après cette demande.`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/leave-requests")}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 mr-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Soumission en cours..." : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeaveRequestForm
