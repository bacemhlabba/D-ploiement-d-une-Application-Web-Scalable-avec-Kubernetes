"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveRequests, updateLeaveRequest } from "../../frontend/services/api"
import Link from "next/link"
import { CheckCircle, XCircle, Clock, User, Calendar, AlertTriangle } from "lucide-react"

const PendingRequests = () => {
  const { user } = useAuth()
  const [pendingRequests, setPendingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rejectionReasons, setRejectionReasons] = useState({})
  const [isSubmitting, setIsSubmitting] = useState({})
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    // Redirect if not HR
    if (user && user.role !== "hr") {
      window.location.href = "/dashboard"
      return
    }

    const fetchPendingRequests = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await getLeaveRequests("pending")

        // Vérifier si la réponse est un tableau
        if (Array.isArray(response)) {
          setPendingRequests(response)
        } else if (response && response.error) {
          // Si la réponse contient une erreur
          setError(response.message || "Une erreur s'est produite lors de la récupération des demandes")
          setPendingRequests([])
        } else {
          // Si la réponse n'est pas un tableau et n'a pas d'erreur explicite
          console.error("Réponse inattendue:", response)
          setError("Format de réponse inattendu. Veuillez réessayer.")
          setPendingRequests([])
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Erreur lors de la récupération des demandes en attente:", err)
        setError(err.message || "Une erreur s'est produite")
        setPendingRequests([])
        setIsLoading(false)
      }
    }

    if (user) {
      fetchPendingRequests()
    }
  }, [user])

  const handleReasonChange = (id, value) => {
    setRejectionReasons({
      ...rejectionReasons,
      [id]: value,
    })
  }

  const handleApprove = async (id) => {
    try {
      setIsSubmitting({ ...isSubmitting, [id]: true })
      setError(null)

      const response = await updateLeaveRequest(id, { status: "approved" })

      if (response && response.error) {
        setError(response.message || "Erreur lors de l'approbation de la demande")
        setIsSubmitting({ ...isSubmitting, [id]: false })
        return
      }

      // Remove the approved request from the list
      setPendingRequests(pendingRequests.filter((req) => req.id !== id))

      setSuccessMessage("Demande approuvée avec succès")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      setIsSubmitting({ ...isSubmitting, [id]: false })
    } catch (err) {
      console.error("Erreur lors de l'approbation:", err)
      setError(err.message || "Une erreur s'est produite")
      setIsSubmitting({ ...isSubmitting, [id]: false })
    }
  }

  const handleReject = async (id) => {
    const reason = rejectionReasons[id]

    if (!reason || reason.trim() === "") {
      setError("Veuillez fournir un motif de refus")
      return
    }

    try {
      setIsSubmitting({ ...isSubmitting, [id]: true })
      setError(null)

      const response = await updateLeaveRequest(id, {
        status: "rejected",
        rejection_reason: reason,
      })

      if (response && response.error) {
        setError(response.message || "Erreur lors du refus de la demande")
        setIsSubmitting({ ...isSubmitting, [id]: false })
        return
      }

      // Remove the rejected request from the list
      setPendingRequests(pendingRequests.filter((req) => req.id !== id))

      // Clear the rejection reason
      const updatedReasons = { ...rejectionReasons }
      delete updatedReasons[id]
      setRejectionReasons(updatedReasons)

      setSuccessMessage("Demande refusée avec succès")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)

      setIsSubmitting({ ...isSubmitting, [id]: false })
    } catch (err) {
      console.error("Erreur lors du refus:", err)
      setError(err.message || "Une erreur s'est produite")
      setIsSubmitting({ ...isSubmitting, [id]: false })
    }
  }

  const handleRetry = () => {
    if (user) {
      setIsLoading(true)
      setError(null)

      const fetchPendingRequests = async () => {
        try {
          const response = await getLeaveRequests("pending")

          if (Array.isArray(response)) {
            setPendingRequests(response)
          } else if (response && response.error) {
            setError(response.message || "Une erreur s'est produite lors de la récupération des demandes")
            setPendingRequests([])
          } else {
            console.error("Réponse inattendue:", response)
            setError("Format de réponse inattendu. Veuillez réessayer.")
            setPendingRequests([])
          }

          setIsLoading(false)
        } catch (err) {
          console.error("Erreur lors de la récupération des demandes en attente:", err)
          setError(err.message || "Une erreur s'est produite")
          setPendingRequests([])
          setIsLoading(false)
        }
      }

      fetchPendingRequests()
    }
  }

  if (isLoading) {
    return (
      <Layout title="Demandes en attente | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Demandes en attente | Gestion de Congés">
      <h1 className="text-2xl font-bold mb-6">Demandes en attente</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <strong className="font-bold">Erreur!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
          <div className="mt-2">
            <button
              onClick={handleRetry}
              className="bg-red-200 hover:bg-red-300 text-red-800 font-bold py-1 px-4 rounded"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {!error && Array.isArray(pendingRequests) && pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucune demande en attente</h2>
          <p className="text-gray-600">Toutes les demandes de congé ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(pendingRequests) &&
            pendingRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                    <div className="flex items-center mb-2 md:mb-0">
                      <div className="bg-blue-100 p-2 rounded-full mr-4">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{request.full_name}</h2>
                        <p className="text-sm text-gray-600">{request.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-600">
                        Demandé le {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Type de congé</p>
                        <p className="font-medium">{request.leave_type_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Période</p>
                        <p className="font-medium">
                          {new Date(request.start_date).toLocaleDateString()} -{" "}
                          {new Date(request.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Durée</p>
                        <p className="font-medium">{request.total_days} jour(s)</p>
                      </div>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-1">Motif</p>
                      <p className="p-3 bg-gray-50 rounded-md">{request.reason}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center">
                      <div className="flex-1 mb-4 md:mb-0 md:mr-4">
                        <label
                          htmlFor={`rejection-${request.id}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Motif de refus
                        </label>
                        <textarea
                          id={`rejection-${request.id}`}
                          rows="2"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Veuillez fournir un motif en cas de refus"
                          value={rejectionReasons[request.id] || ""}
                          onChange={(e) => handleReasonChange(request.id, e.target.value)}
                        ></textarea>
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          href={`/leave-requests/${request.id}`}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Détails
                        </Link>

                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={isSubmitting[request.id]}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Refuser
                        </button>

                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={isSubmitting[request.id]}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approuver
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </Layout>
  )
}

export default PendingRequests
