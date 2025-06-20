"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveRequests, getLeaveTypes, getDepartments } from "../../frontend/services/api"
import { Calendar, FileText, Filter, Download, Printer, RefreshCw } from "lucide-react"
import PrintableReport from "../../frontend/components/PrintableReport"
import Link from "next/link"
import toast from "react-hot-toast"

const LeaveSummary = () => {
  const { user } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    status: "all",
    period: "all",
    department: "all",
    leaveType: "all",
  })
  const [departments, setDepartments] = useState([])
  const [view, setView] = useState("summary") // summary, byStatus, byDepartment, byType, detailed
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all leave requests
      console.log("Fetching leave requests...")
      const requests = await getLeaveRequests()

      // Check if requests is an array
      if (!Array.isArray(requests)) {
        console.error("Leave requests is not an array:", requests)
        if (requests && requests.error) {
          throw new Error(requests.message || "Failed to fetch leave requests")
        }
        setLeaveRequests([])
      } else {
        console.log(`Fetched ${requests.length} leave requests`)
        setLeaveRequests(requests)
      }

      // Fetch leave types
      console.log("Fetching leave types...")
      const types = await getLeaveTypes()

      // Check if types is an array
      if (!Array.isArray(types)) {
        console.error("Leave types is not an array:", types)
        if (types && types.error) {
          throw new Error(types.message || "Failed to fetch leave types")
        }
        setLeaveTypes([])
      } else {
        console.log(`Fetched ${types.length} leave types`)
        setLeaveTypes(types)
      }

      // Fetch departments
      console.log("Fetching departments...")
      const depts = await getDepartments()

      // Check if depts is an array
      if (!Array.isArray(depts)) {
        console.error("Departments is not an array:", depts)
        if (depts && depts.error) {
          throw new Error(depts.message || "Failed to fetch departments")
        }
        setDepartments([])
      } else {
        console.log(`Fetched ${depts.length} departments`)
        setDepartments(depts)
      }

      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.message || "Une erreur s'est produite lors du chargement des données")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Redirect if not HR
    if (user && user.role !== "hr") {
      window.location.href = "/dashboard"
      return
    }

    fetchData()
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    toast.promise(
      fetchData().finally(() => setRefreshing(false)),
      {
        loading: "Actualisation des données...",
        success: "Données actualisées avec succès",
        error: "Erreur lors de l'actualisation des données",
      },
    )
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilter({
      ...filter,
      [name]: value,
    })
  }

  // Filter requests based on selected filters
  const filteredRequests = Array.isArray(leaveRequests)
    ? leaveRequests.filter((request) => {
        // Filter by status
        if (filter.status !== "all" && request.status !== filter.status) {
          return false
        }

        // Filter by department
        if (filter.department !== "all" && request.department !== filter.department) {
          return false
        }

        // Filter by leave type
        if (
          filter.leaveType !== "all" &&
          request.leave_type_id &&
          request.leave_type_id.toString() !== filter.leaveType
        ) {
          return false
        }

        // Filter by period
        if (filter.period !== "all") {
          const requestDate = new Date(request.start_date)
          const now = new Date()

          if (filter.period === "thisMonth") {
            return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear()
          } else if (filter.period === "lastMonth") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
            return (
              requestDate.getMonth() === lastMonth.getMonth() && requestDate.getFullYear() === lastMonth.getFullYear()
            )
          } else if (filter.period === "thisYear") {
            return requestDate.getFullYear() === now.getFullYear()
          }
        }

        return true
      })
    : []

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!Array.isArray(filteredRequests) || filteredRequests.length === 0)
      return { pending: 0, approved: 0, rejected: 0, modified: 0, total: 0, totalDays: 0 }

    return filteredRequests.reduce(
      (acc, req) => {
        acc.pending += req.status === "pending" ? 1 : 0
        acc.approved += req.status === "approved" ? 1 : 0
        acc.rejected += req.status === "rejected" ? 1 : 0
        acc.modified += req.status === "modified" ? 1 : 0
        acc.total += 1
        // Ensure total_days is a number and handle potential null/undefined values
        acc.totalDays += Number(req.total_days) || 0
        return acc
      },
      { pending: 0, approved: 0, rejected: 0, modified: 0, total: 0, totalDays: 0 },
    )
  }

  // Group requests by department
  const requestsByDepartment = () => {
    const grouped = {}

    // Ensure departments is an array before calling forEach
    if (!Array.isArray(departments)) {
      console.error("departments is not an array:", departments)
      return {}
    }

    departments.forEach((dept) => {
      if (!dept) return // Skip null or undefined departments

      const deptRequests = Array.isArray(filteredRequests)
        ? filteredRequests.filter((req) => req.department === dept)
        : []

      grouped[dept] = {
        total: deptRequests.length,
        pending: deptRequests.filter((req) => req.status === "pending").length,
        approved: deptRequests.filter((req) => req.status === "approved").length,
        rejected: deptRequests.filter((req) => req.status === "rejected").length,
        modified: deptRequests.filter((req) => req.status === "modified").length,
        totalDays: deptRequests.reduce((sum, req) => sum + (Number(req.total_days) || 0), 0),
      }
    })

    return grouped
  }

  // Group requests by leave type
  const requestsByType = () => {
    const grouped = {}

    // Ensure leaveTypes is an array before calling forEach
    if (!Array.isArray(leaveTypes)) {
      console.error("leaveTypes is not an array:", leaveTypes)
      return {}
    }

    leaveTypes.forEach((type) => {
      if (!type || !type.id) return // Skip invalid types

      const typeRequests = Array.isArray(filteredRequests)
        ? filteredRequests.filter((req) => req.leave_type_id === type.id)
        : []

      grouped[type.name] = {
        total: typeRequests.length,
        pending: typeRequests.filter((req) => req.status === "pending").length,
        approved: typeRequests.filter((req) => req.status === "approved").length,
        rejected: typeRequests.filter((req) => req.status === "rejected").length,
        modified: typeRequests.filter((req) => req.status === "modified").length,
        totalDays: typeRequests.reduce((sum, req) => sum + (Number(req.total_days) || 0), 0),
      }
    })

    return grouped
  }

  const summary = calculateSummary()
  const byDepartment = requestsByDepartment()
  const byType = requestsByType()

  if (isLoading) {
    return (
      <Layout title="Résumé des demandes | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Résumé des demandes | Gestion de Congés">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Réessayer
        </button>
      </Layout>
    )
  }

  return (
    <Layout title="Résumé des demandes | Gestion de Congés">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Résumé des demandes de congés</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
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
              // Simple CSV export
              const headers = ["Employé", "Type", "Début", "Fin", "Jours", "Statut", "Date de demande"]
              const csvContent = [
                headers.join(","),
                ...filteredRequests.map((req) =>
                  [
                    req.full_name || "N/A",
                    req.leave_type_name || "N/A",
                    req.start_date ? new Date(req.start_date).toLocaleDateString() : "N/A",
                    req.end_date ? new Date(req.end_date).toLocaleDateString() : "N/A",
                    req.total_days || "0",
                    req.status || "N/A",
                    req.created_at ? new Date(req.created_at).toLocaleDateString() : "N/A",
                  ].join(","),
                ),
              ].join("\n")

              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
              const url = URL.createObjectURL(blob)
              const link = document.createElement("a")
              link.setAttribute("href", url)
              link.setAttribute("download", "demandes_conges.csv")
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              id="status"
              name="status"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filter.status}
              onChange={handleFilterChange}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="rejected">Refusé</option>
              <option value="modified">Modifié</option>
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
              {Array.isArray(departments) &&
                departments.map(
                  (dept, index) =>
                    dept && (
                      <option key={index} value={dept}>
                        {dept}
                      </option>
                    ),
                )}
            </select>
          </div>

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
              {Array.isArray(leaveTypes) &&
                leaveTypes.map(
                  (type) =>
                    type &&
                    type.id && (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ),
                )}
            </select>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView("summary")}
            className={`px-4 py-2 rounded-md ${
              view === "summary" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Résumé global
          </button>
          <button
            onClick={() => setView("byDepartment")}
            className={`px-4 py-2 rounded-md ${
              view === "byDepartment" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Par département
          </button>
          <button
            onClick={() => setView("byType")}
            className={`px-4 py-2 rounded-md ${
              view === "byType" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Par type de congé
          </button>
          <button
            onClick={() => setView("detailed")}
            className={`px-4 py-2 rounded-md ${
              view === "detailed" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Liste détaillée
          </button>
        </div>
      </div>

      {/* Summary View */}
      {view === "summary" && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <PrintableReport title="Résumé des demandes de congés">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total des demandes</p>
                    <p className="text-2xl font-bold">{summary.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-100 p-3 rounded-full mr-4">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">En attente</p>
                    <p className="text-2xl font-bold">{summary.pending}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approuvées</p>
                    <p className="text-2xl font-bold">{summary.approved}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 p-3 rounded-full mr-4">
                    <Calendar className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Refusées</p>
                    <p className="text-2xl font-bold">{summary.rejected}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Répartition des demandes par statut</h3>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                    {summary.total > 0 && (
                      <>
                        <div
                          className="h-full bg-yellow-500 float-left"
                          style={{ width: `${(summary.pending / summary.total) * 100}%` }}
                        ></div>
                        <div
                          className="h-full bg-green-500 float-left"
                          style={{ width: `${(summary.approved / summary.total) * 100}%` }}
                        ></div>
                        <div
                          className="h-full bg-red-500 float-left"
                          style={{ width: `${(summary.rejected / summary.total) * 100}%` }}
                        ></div>
                        <div
                          className="h-full bg-blue-500 float-left"
                          style={{ width: `${(summary.modified / summary.total) * 100}%` }}
                        ></div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                      <span>En attente ({summary.pending})</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                      <span>Approuvées ({summary.approved})</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                      <span>Refusées ({summary.rejected})</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                      <span>Modifiées ({summary.modified})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Informations supplémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-600">Nombre total de jours demandés</p>
                  <p className="text-xl font-bold">{(summary.totalDays || 0).toFixed(1)} jours</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-600">Moyenne de jours par demande</p>
                  <p className="text-xl font-bold">
                    {summary.total > 0 ? (summary.totalDays / summary.total).toFixed(1) : 0} jours
                  </p>
                </div>
              </div>
            </div>
          </PrintableReport>
        </div>
      )}

      {/* By Department View */}
      {view === "byDepartment" && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <PrintableReport title="Demandes de congés par département">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Département
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                      Jours totaux
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(byDepartment).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  ) : (
                    Object.entries(byDepartment).map(([dept, data]) => (
                      <tr key={dept}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dept}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.pending}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.approved}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.rejected}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.modified}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.totalDays.toFixed(1)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.pending}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.approved}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.rejected}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.modified}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.totalDays.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PrintableReport>
        </div>
      )}

      {/* By Type View */}
      {view === "byType" && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <PrintableReport title="Demandes de congés par type">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type de congé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                      Jours totaux
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(byType).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  ) : (
                    Object.entries(byType).map(([type, data]) => (
                      <tr key={type}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.total}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.pending}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.approved}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.rejected}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.modified}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{data.totalDays.toFixed(1)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.pending}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.approved}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.rejected}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.modified}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{summary.totalDays.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PrintableReport>
        </div>
      )}

      {/* Detailed View */}
      {view === "detailed" && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <PrintableReport title="Liste détaillée des demandes de congés">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Département
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jours
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
                  {!Array.isArray(filteredRequests) || filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        Aucune demande trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.full_name || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.department || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.leave_type_name || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {request.start_date ? new Date(request.start_date).toLocaleDateString() : "N/A"} -{" "}
                            {request.end_date ? new Date(request.end_date).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{request.total_days || "0"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : request.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : request.status === "modified"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {request.status === "approved"
                              ? "Approuvé"
                              : request.status === "rejected"
                                ? "Refusé"
                                : request.status === "modified"
                                  ? "Modifié"
                                  : "En attente"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {request.created_at ? new Date(request.created_at).toLocaleDateString() : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/leave-requests/${request.id}`} className="text-blue-600 hover:text-blue-900">
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </PrintableReport>
        </div>
      )}
    </Layout>
  )
}

export default LeaveSummary
