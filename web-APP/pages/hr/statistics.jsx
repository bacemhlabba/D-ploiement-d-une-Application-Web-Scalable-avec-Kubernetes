"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveStatistics, getLeaveTypes, getDepartments } from "../../frontend/services/api"
import { Calendar, FileText, Filter, Download, Printer, AlertTriangle, RefreshCw } from "lucide-react"
import PrintableReport from "../../frontend/components/PrintableReport"
import toast from "react-hot-toast"

const Statistics = () => {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState("summary") // summary, byType, byDepartment
  const [filter, setFilter] = useState({
    period: "all",
    department: "all",
    leaveType: "all",
  })
  const [departments, setDepartments] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [debugInfo, setDebugInfo] = useState(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setDebugInfo(null)

      // Fetch departments first to detect any database connection issues early
      console.log("Component: Fetching departments...")
      const depts = await getDepartments()
      console.log("Component: Departments received:", depts)

      // Even if departments is empty, continue with other data
      setDepartments(Array.isArray(depts) ? depts : [])

      // Fetch statistics
      console.log("Component: Fetching statistics...")
      const stats = await getLeaveStatistics()

      // Check if we got an error object
      if (stats && stats.error) {
        setError(stats.message || "Erreur lors de la récupération des statistiques")
        setDebugInfo("Erreur dans getLeaveStatistics()")
        setIsLoading(false)
        return
      }

      console.log("Component: Statistics received:", stats)
      setStatistics(Array.isArray(stats) ? stats : [])

      // Fetch leave types
      console.log("Component: Fetching leave types...")
      const types = await getLeaveTypes()

      // Check if we got an error object
      if (types && types.error) {
        setError(types.message || "Erreur lors de la récupération des types de congés")
        setDebugInfo("Erreur dans getLeaveTypes()")
        setIsLoading(false)
        return
      }

      console.log("Component: Leave types received:", types)
      setLeaveTypes(Array.isArray(types) ? types : [])

      setIsLoading(false)
    } catch (err) {
      console.error("Component: Error in fetchData:", err)
      setError(err?.message || "Une erreur s'est produite lors de la récupération des données")
      setDebugInfo(`Exception: ${err?.toString()}`)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Redirect if not HR
    if (user && user.role !== "hr") {
      window.location.href = "/dashboard"
      return
    }

    if (user) {
      fetchData()
    }
  }, [user])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilter((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Filter statistics based on selected filters
  const filteredStatistics = Array.isArray(statistics)
    ? statistics.filter((stat) => {
        // Filter by leave type
        if (filter.leaveType !== "all" && stat.leave_type !== filter.leaveType) {
          return false
        }
        return true
      })
    : []

  // Calculate totals
  const calculateTotals = () => {
    if (!filteredStatistics || filteredStatistics.length === 0)
      return { pending: 0, approved: 0, rejected: 0, modified: 0, total: 0 }

    return filteredStatistics.reduce(
      (acc, stat) => {
        acc.pending += Number(stat.pending_count) || 0
        acc.approved += Number(stat.approved_count) || 0
        acc.rejected += Number(stat.rejected_count) || 0
        acc.modified += Number(stat.modified_count) || 0
        acc.total += Number(stat.total_count) || 0
        return acc
      },
      { pending: 0, approved: 0, rejected: 0, modified: 0, total: 0 },
    )
  }

  const totals = calculateTotals()

  // Function to retry loading data
  const handleRetry = () => {
    toast.success("Tentative de rechargement des données...")
    fetchData()
  }

  if (isLoading) {
    return (
      <Layout title="Statistiques | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Statistiques | Gestion de Congés">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-6 w-6 mr-2" />
            <strong className="font-bold text-lg">Erreur!</strong>
          </div>
          <p className="mb-2">{error}</p>
          {debugInfo && (
            <div className="mt-2 p-2 bg-red-50 rounded text-sm font-mono overflow-x-auto">
              <p className="font-semibold">Informations de débogage:</p>
              <p>{debugInfo}</p>
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={handleRetry}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Suggestions de dépannage</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Vérifiez que vous êtes bien connecté et que votre session n'a pas expiré</li>
            <li>Assurez-vous que les API sont correctement configurées et accessibles</li>
            <li>Vérifiez les logs du serveur pour plus d'informations</li>
            <li>Contactez l'administrateur système si le problème persiste</li>
          </ul>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Statistiques | Gestion de Congés">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statistiques des congés</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Actualiser
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center"
          >
            <Printer className="h-5 w-5 mr-2" />
            Imprimer
          </button>
          <button
            onClick={() => {
              try {
                // Simple CSV export
                const headers = ["Type de congé", "En attente", "Approuvées", "Refusées", "Modifiées", "Total"]
                const csvContent = [
                  headers.join(","),
                  ...filteredStatistics.map((stat) =>
                    [
                      stat.leave_type,
                      stat.pending_count || 0,
                      stat.approved_count || 0,
                      stat.rejected_count || 0,
                      stat.modified_count || 0,
                      stat.total_count || 0,
                    ].join(","),
                  ),
                ].join("\n")

                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.setAttribute("href", url)
                link.setAttribute("download", "statistiques_conges.csv")
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success("Export CSV réussi")
              } catch (err) {
                console.error("Export error:", err)
                toast.error("Erreur lors de l'export: " + (err.message || "Erreur inconnue"))
              }
            }}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Exporter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center mb-2">
          <Filter className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
              Type de congé
            </label>
            <select
              id="leaveType"
              name="leaveType"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filter.leaveType}
              onChange={handleFilterChange}
            >
              <option value="all">Tous les types</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              id="period"
              name="period"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filter.period}
              onChange={handleFilterChange}
            >
              <option value="all">Toutes les périodes</option>
              <option value="thisMonth">Ce mois</option>
              <option value="lastMonth">Mois dernier</option>
              <option value="thisYear">Cette année</option>
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Département
            </label>
            <select
              id="department"
              name="department"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filter.department}
              onChange={handleFilterChange}
            >
              <option value="all">Tous les départements</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setView("summary")}
              className={`px-4 py-2 rounded-md ${
                view === "summary" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Résumé
            </button>
            <button
              onClick={() => setView("byType")}
              className={`px-4 py-2 rounded-md ${
                view === "byType" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Par type de congé
            </button>
          </div>
        </div>
      </div>

      {view === "summary" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total des demandes</p>
                  <p className="text-2xl font-bold">{totals.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold">{totals.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approuvées</p>
                  <p className="text-2xl font-bold">{totals.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Refusées</p>
                  <p className="text-2xl font-bold">{totals.rejected}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <PrintableReport title="Résumé des demandes de congés">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Répartition des demandes par statut</h3>
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                      {totals.total > 0 && (
                        <>
                          <div
                            className="h-full bg-yellow-500 float-left"
                            style={{ width: `${(totals.pending / totals.total) * 100}%` }}
                          ></div>
                          <div
                            className="h-full bg-green-500 float-left"
                            style={{ width: `${(totals.approved / totals.total) * 100}%` }}
                          ></div>
                          <div
                            className="h-full bg-red-500 float-left"
                            style={{ width: `${(totals.rejected / totals.total) * 100}%` }}
                          ></div>
                          <div
                            className="h-full bg-blue-500 float-left"
                            style={{ width: `${(totals.modified / totals.total) * 100}%` }}
                          ></div>
                        </>
                      )}
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                        <span>En attente ({totals.pending})</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Approuvées ({totals.approved})</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                        <span>Refusées ({totals.rejected})</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span>Modifiées ({totals.modified})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PrintableReport>
          </div>
        </>
      )}

      {view === "byType" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <PrintableReport title="Statistiques par type de congé">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type de congé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      En attente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Approuvées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Refusées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modifiées
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStatistics.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  ) : (
                    filteredStatistics.map((stat, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{stat.leave_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.pending_count || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.approved_count || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.rejected_count || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.modified_count || 0}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{stat.total_count || 0}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{totals.pending}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{totals.approved}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{totals.rejected}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{totals.modified}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{totals.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PrintableReport>
        </div>
      )}
    </Layout>
  )
}

export default Statistics
