"use client"

import { useState, useEffect } from "react"
import Layout from "../../frontend/components/Layout"
import { useAuth } from "../../frontend/contexts/AuthContext"
import { getLeaveBalances } from "../../frontend/services/api"
import { Clock, AlertCircle, Calendar } from "lucide-react"

const LeaveBalances = () => {
  const { user } = useAuth()
  const [leaveBalances, setLeaveBalances] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLeaveBalances = async () => {
      try {
        setIsLoading(true)
        const balances = await getLeaveBalances()
        setLeaveBalances(balances)
        setIsLoading(false)
      } catch (err) {
        setError(err.message)
        setIsLoading(false)
      }
    }

    fetchLeaveBalances()
  }, [])

  if (isLoading) {
    return (
      <Layout title="Mes soldes de congés | Gestion de Congés">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Mes soldes de congés | Gestion de Congés">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Mes soldes de congés | Gestion de Congés">
      <h1 className="text-2xl font-bold mb-6">Mes soldes de congés</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {leaveBalances.map((balance) => (
          <div key={balance.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-xl font-semibold">{balance.leave_type_name}</h2>
            </div>

            <div className="flex items-center justify-center my-6">
              <div className="text-4xl font-bold text-blue-600">{balance.balance}</div>
              <div className="ml-2 text-gray-600">jours disponibles</div>
            </div>

            <div className="text-center text-sm text-gray-500">Année {new Date().getFullYear()}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">Informations sur les congés</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Congé annuel</h3>
            <p className="text-gray-600">
              Le congé annuel est accordé à tous les employés. Chaque employé dispose de 30 jours de congés annuels par
              an.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Congé maladie</h3>
            <p className="text-gray-600">
              Le congé maladie est accordé en cas de maladie justifiée. Chaque employé dispose de 15 jours de congés
              maladie par an.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Congé exceptionnel</h3>
            <p className="text-gray-600">
              Le congé exceptionnel est accordé pour des événements particuliers (mariage, décès, etc.). Ces congés sont
              accordés au cas par cas et nécessitent une justification.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center mb-4">
          <Calendar className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold">Historique d'utilisation</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de congé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disponible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveBalances.map((balance) => {
                // Calculate used days (assuming initial values: 30 for annual, 15 for sick, 5 for exceptional)
                let initialBalance = 30
                if (balance.leave_type_name === "Congé maladie") initialBalance = 15
                if (balance.leave_type_name === "Congé exceptionnel") initialBalance = 5

                const used = initialBalance - balance.balance

                return (
                  <tr key={`history-${balance.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{balance.leave_type_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{used} jours</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{balance.balance} jours</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{initialBalance} jours</div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default LeaveBalances
