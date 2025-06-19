"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveRequestById, updateLeaveRequest } from "../../frontend/services/api"
import { CheckCircle, XCircle, Clock, FileText, Calendar, User, MessageSquare } from "lucide-react"

const LeaveRequestDetail = () => {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [leaveRequest, setLeaveRequest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const fetchLeaveRequest = async () => {
      if (!id) return

      try {
        setIsLoading(true)
        const request = await getLeaveRequestById(id)
        setLeaveRequest(request)
        setIsLoading(false)
      } catch (err) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    fetchLeaveRequest()
  }, [id])

  const handleApprove = async () => {
    try {
      setIsSubmitting(true)
      await updateLeaveRequest(id, { status: "approved" })
      setSuccessMessage("Demande approuvée avec succès")

      // Refresh the leave request
      const updatedRequest = await getLeaveRequestById(id)
      setLeaveRequest(updatedRequest)

      setIsSubmitting(false)
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Veuillez fournir un motif de refus")
      return
    }

    try {
      setIsSubmitting(true)
      await updateLeaveRequest(id, {
        status: "rejected",
        rejection_reason: rejectionReason,
      })
      setSuccessMessage("Demande refusée avec succès")

      // Refresh the leave request
      const updatedRequest = await getLeaveRequestById(id)
      setLeaveRequest(updatedRequest)

      setIsSubmitting(false)
      setRejectionReason("")
    } catch (err) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approuvé
          </span>
        )
      case "rejected":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Refusé
          </span>
        )
      case "pending":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            En attente
          </span>
        )
      case "modified":
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Modifié
          </span>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Layout title="Détails de la demande | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Détails de la demande | Gestion de Congés">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </Layout>
    )
  }

  if (!leaveRequest) {
    return (
      <Layout title="Détails de la demande | Gestion de Congés">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Attention!</strong>
          <span className="block sm:inline"> Demande de congé non trouvée.</span>
        </div>
      </Layout>
    )
  }

  const isHR = user?.role === "hr"
  const isPending = leaveRequest.status === "pending"

  return (
    <Layout title="Détails de la demande | Gestion de Congés">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 flex items-center">
          ← Retour
        </button>
      </div>

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Demande de congé</h1>
            {getStatusBadge(leaveRequest.status)}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Informations générales</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Période</p>
                    <p className="text-gray-600">
                      Du {new Date(leaveRequest.start_date).toLocaleDateString()} au{" "}
                      {new Date(leaveRequest.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Durée</p>
                    <p className="text-gray-600">{leaveRequest.total_days} jour(s)</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Type de congé</p>
                    <p className="text-gray-600">{leaveRequest.leave_type_name}</p>
                  </div>
                </div>

                {leaveRequest.reason && (
                  <div className="flex items-start">
                    <MessageSquare className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Motif</p>
                      <p className="text-gray-600">{leaveRequest.reason}</p>
                    </div>
                  </div>
                )}

                {leaveRequest.rejection_reason && (
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Motif de refus</p>
                      <p className="text-gray-600">{leaveRequest.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Informations de la demande</h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Demandeur</p>
                    <p className="text-gray-600">{leaveRequest.full_name || user.full_name}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Date de la demande</p>
                    <p className="text-gray-600">{new Date(leaveRequest.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {leaveRequest.updated_at !== leaveRequest.created_at && (
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Dernière mise à jour</p>
                      <p className="text-gray-600">{new Date(leaveRequest.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {leaveRequest.department && (
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Département</p>
                      <p className="text-gray-600">{leaveRequest.department}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isHR && isPending && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approuver
                </button>

                <div className="flex-1">
                  <div className="mb-2">
                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                      Motif de refus
                    </label>
                    <textarea
                      id="rejectionReason"
                      rows="2"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Veuillez fournir un motif de refus"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    ></textarea>
                  </div>

                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default LeaveRequestDetail
