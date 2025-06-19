"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveRequests, deleteLeaveRequest } from "../../frontend/services/api"
import Link from "next/link"
import { CheckCircle, XCircle, Clock, FileText, Trash2, Plus, Filter } from "lucide-react"
import toast from "react-hot-toast"

const LeaveRequests = () => {
  const { user } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("all")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true)
      const requests = await getLeaveRequests()
      setLeaveRequests(requests)
      setIsLoading(false)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteLeaveRequest(id)
      toast.success("Demande supprimée avec succès")
      setShowDeleteConfirm(null)
      fetchLeaveRequests()
    } catch (err) {
      toast.error(err.message || "Erreur lors de la suppression")
    }
  }

  const filteredRequests =
    filter === "all" ? leaveRequests : leaveRequests.filter((request) => request.status === filter)

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "modified":
        return <FileText className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approuvé"
      case "rejected":
        return "Refusé"
      case "pending":
        return "En attente"
      case "modified":
        return "Modifié"
      default:
        return status
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approuvé
          </span>
        )
      case "rejected":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Refusé
          </span>
        )
      case "pending":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            En attente
          </span>
        )
      case "modified":
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Modifié
          </span>
        )
      default:
        return null
    }
  }

  return (
    <Layout title="Mes demandes de congés | Gestion de Congés">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes demandes de congés</h1>
        <Link
          href="/leave-requests/new"
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle demande
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-2">Filtrer par statut:</span>
            <select
              className="border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Refusé</option>
              <option value="modified">Modifié</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {filteredRequests.length} demande{filteredRequests.length !== 1 ? "s" : ""}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune demande trouvée</h3>
            <p className="text-gray-500">
              {filter === "all"
                ? "Vous n'avez pas encore fait de demande de congé."
                : `Vous n'avez pas de demande avec le statut "${getStatusText(filter)}".`}
            </p>
            <Link
              href="/leave-requests/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Créer une demande
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de demande
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.leave_type_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(request.start_date).toLocaleDateString()} -{" "}
                        {new Date(request.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{request.total_days} jour(s)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/leave-requests/${request.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir les détails"
                        >
                          Détails
                        </Link>
                        {request.status === "pending" && (
                          <button
                            onClick={() => setShowDeleteConfirm(request.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer la demande"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {showDeleteConfirm === request.id && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
                          <div className="p-4">
                            <p className="text-sm text-gray-700">Êtes-vous sûr de vouloir supprimer cette demande ?</p>
                            <div className="mt-3 flex justify-end space-x-2">
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default LeaveRequests
