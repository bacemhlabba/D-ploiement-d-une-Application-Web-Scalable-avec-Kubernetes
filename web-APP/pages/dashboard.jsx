"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Layout from "../frontend/components/Layout"
import { useAuth } from "../frontend/contexts/AuthContext"
import { getLeaveBalances, getLeaveRequests } from "../frontend/services/api"
import { Clock, FileText, CheckCircle, XCircle, ArrowRight } from "lucide-react"

const Dashboard = () => {
  const auth = useAuth()
  const user = auth?.user
  const isHR = user?.role === "hr"

  const [leaveBalances, setLeaveBalances] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [recentRequests, setRecentRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        setIsLoading(true)

        // Fetch leave balances
        const balances = await getLeaveBalances()
        setLeaveBalances(balances)

        // Fetch pending requests (for HR)
        if (isHR) {
          const pending = await getLeaveRequests("pending")
          setPendingRequests(pending)
        }

        // Fetch recent requests (for all users)
        const requests = await getLeaveRequests()
        setRecentRequests(requests.slice(0, 5)) // Get only the 5 most recent

        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err?.message || "An error occurred while fetching data")
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, isHR])

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
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
      default:
        return status
    }
  }

  return (
    <Layout title="Tableau de bord | Gestion de Congés">
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Leave Balances Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Soldes de congés</h2>

          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          ) : leaveBalances.length > 0 ? (
            <div className="space-y-4">
              {leaveBalances.slice(0, 3).map((balance) => (
                <div key={balance.id} className="flex justify-between items-center">
                  <span className="text-gray-700">{balance.leave_type_name}</span>
                  <span className="font-semibold">{balance.balance} jours</span>
                </div>
              ))}

              <Link href="/leave-balances" className="text-blue-600 hover:text-blue-800 flex items-center text-sm mt-2">
                Voir tous les soldes
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">Aucun solde de congé disponible</p>
          )}
        </div>

        {/* Pending Requests Card (for HR only) */}
        {isHR ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Demandes en attente</h2>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((request) => (
                  <Link
                    key={request.id}
                    href={`/leave-requests/${request.id}`}
                    className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{request.full_name}</span>
                      <span className="text-sm text-gray-500">{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {request.leave_type_name} - {request.total_days} jour(s)
                    </div>
                  </Link>
                ))}

                <Link
                  href="/hr/pending-requests"
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm mt-2"
                >
                  Voir toutes les demandes en attente
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">Aucune demande en attente</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Mes demandes en attente</h2>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : recentRequests.filter((req) => req.status === "pending").length > 0 ? (
              <div className="space-y-3">
                {recentRequests
                  .filter((req) => req.status === "pending")
                  .slice(0, 3)
                  .map((request) => (
                    <Link
                      key={request.id}
                      href={`/leave-requests/${request.id}`}
                      className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{request.leave_type_name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{request.total_days} jour(s)</div>
                    </Link>
                  ))}

                <Link
                  href="/leave-requests"
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm mt-2"
                >
                  Voir toutes mes demandes
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">Aucune demande en attente</p>
            )}
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              href="/leave-requests/new"
              className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700"
            >
              Nouvelle demande de congé
            </Link>

            {isHR && (
              <>
                <Link
                  href="/hr/pending-requests"
                  className="block w-full py-2 px-4 bg-green-600 text-white rounded-md text-center hover:bg-green-700"
                >
                  Gérer les demandes
                </Link>

                <Link
                  href="/hr/employees"
                  className="block w-full py-2 px-4 bg-purple-600 text-white rounded-md text-center hover:bg-purple-700"
                >
                  Gérer les employés
                </Link>
              </>
            )}

            <Link
              href="/profile"
              className="block w-full py-2 px-4 bg-gray-600 text-white rounded-md text-center hover:bg-gray-700"
            >
              Mon profil
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Requests Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Demandes récentes</h2>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        ) : recentRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentRequests.map((request) => (
                  <tr key={request.id}>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <span className="ml-1 text-sm text-gray-900">{getStatusText(request.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/leave-requests/${request.id}`} className="text-blue-600 hover:text-blue-900">
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-right">
              <Link
                href="/leave-requests"
                className="text-blue-600 hover:text-blue-800 flex items-center justify-end text-sm"
              >
                Voir toutes les demandes
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Aucune demande récente</p>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
