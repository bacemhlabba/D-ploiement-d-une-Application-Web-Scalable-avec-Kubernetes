import toast from "react-hot-toast"

const getAuthHeaders = () => {
  const token = localStorage.getItem("token")
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

// Completely rewritten fetch wrapper to avoid reading body stream twice
const fetchWithErrorHandling = async (url, options = {}) => {
  try {
    console.log(`API Request to ${url}`)
    const response = await fetch(url, options)

    console.log(`API Response (${url}):`, response.status, response.statusText)

    // Clone the response for potential error handling
    // This allows us to read the body twice if needed
    const responseClone = response.clone()

    if (!response.ok) {
      // Handle error response
      let errorMessage = `${response.status} ${response.statusText}`

      try {
        // Try to parse as JSON first
        const errorData = await responseClone.json()
        errorMessage = errorData.message || errorMessage
      } catch (jsonError) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage += `: ${errorText.substring(0, 100)}...`
          }
        } catch (textError) {
          console.error("Could not read error response body:", textError)
        }
      }

      console.error(`API Error (${url}):`, errorMessage)
      toast.error(errorMessage)
      return { error: true, message: errorMessage }
    }

    // For successful responses
    try {
      const data = await response.json()
      return data
    } catch (jsonError) {
      console.error(`Failed to parse response as JSON (${url}):`, jsonError)

      // Try to get response text for debugging
      try {
        const text = await responseClone.text()
        console.error("Response text:", text.substring(0, 200))
      } catch (textError) {
        console.error("Could not read response text:", textError)
      }

      const errorMessage = "La réponse du serveur n'est pas au format JSON valide"
      toast.error(errorMessage)
      return { error: true, message: errorMessage }
    }
  } catch (error) {
    // Network errors or other exceptions
    console.error(`API Request failed (${url}):`, error)
    const message = error.message || "Une erreur s'est produite"
    toast.error(message)
    return { error: true, message }
  }
}

// Specialized function for getting leave requests
export const getLeaveRequests = async (status) => {
  try {
    const url = status ? `/api/leave-requests?status=${status}` : "/api/leave-requests"
    console.log(`Fetching leave requests with status: ${status || "all"}`)

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    console.log(`API Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Clone the response for potential error handling
      const responseClone = response.clone()

      let errorMessage = `${response.status} ${response.statusText}`

      try {
        const errorData = await responseClone.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const text = await response.text()
          if (text) {
            errorMessage += `: ${text.substring(0, 100)}...`
          }
        } catch (textError) {
          // If we can't read the text either, just use the status
        }
      }

      throw new Error(errorMessage)
    }

    // For successful responses, directly use json()
    const data = await response.json()

    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn("API did not return an array for leave requests:", data)
      return []
    }

    return data
  } catch (error) {
    console.error("getLeaveRequests error:", error)
    toast.error(error.message || "Une erreur s'est produite lors de la récupération des demandes")
    return []
  }
}

// Auth API
export const getUserProfile = async () => {
  return fetchWithErrorHandling("/api/auth/profile", {
    headers: getAuthHeaders(),
  })
}

export const updateUserProfile = async (profileData) => {
  return fetchWithErrorHandling("/api/auth/profile", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  })
}

export const uploadAvatar = async (file) => {
  try {
    console.log("Uploading avatar file:", file.name)

    const formData = new FormData()
    formData.append("avatar", file)

    const token = localStorage.getItem("token")

    const response = await fetch("/api/auth/upload-avatar", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    })

    console.log(`API Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Clone the response for potential error handling
      const responseClone = response.clone()

      let errorMessage = `${response.status} ${response.statusText}`

      try {
        const errorData = await responseClone.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const text = await response.text()
          if (text) {
            errorMessage += `: ${text.substring(0, 100)}...`
          }
        } catch (textError) {
          // If we can't read the text either, just use the status
        }
      }

      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error("uploadAvatar error:", error)
    toast.error(error.message || "Une erreur s'est produite lors de l'upload de l'avatar")
    return { error: true, message: error.message || "Une erreur s'est produite lors de l'upload de l'avatar" }
  }
}

export const getLeaveRequestById = async (id) => {
  return fetchWithErrorHandling(`/api/leave-requests/${id}`, {
    headers: getAuthHeaders(),
  })
}

export const createLeaveRequest = async (requestData) => {
  return fetchWithErrorHandling("/api/leave-requests", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(requestData),
  })
}

export const updateLeaveRequest = async (id, requestData) => {
  return fetchWithErrorHandling(`/api/leave-requests/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(requestData),
  })
}

export const deleteLeaveRequest = async (id) => {
  return fetchWithErrorHandling(`/api/leave-requests/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
}

export const getLeaveStatistics = async () => {
  try {
    const url = "/api/leave-requests?stats=true"
    console.log("Fetching leave statistics...")

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    console.log(`API Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Clone the response for potential error handling
      const responseClone = response.clone()

      let errorMessage = `${response.status} ${response.statusText}`

      try {
        const errorData = await responseClone.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const text = await response.text()
          if (text) {
            errorMessage += `: ${text.substring(0, 100)}...`
          }
        } catch (textError) {
          // If we can't read the text either, just use the status
        }
      }

      throw new Error(errorMessage)
    }

    // For successful responses, directly use json()
    const data = await response.json()

    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn("API did not return an array for leave statistics:", data)
      return []
    }

    return data
  } catch (error) {
    console.error("getLeaveStatistics error:", error)
    toast.error(error.message || "Une erreur s'est produite lors de la récupération des statistiques")
    return []
  }
}

// Leave Balances API
export const getLeaveBalances = async (userId) => {
  const url = userId ? `/api/leave-balances?userId=${userId}` : "/api/leave-balances"
  return fetchWithErrorHandling(url, {
    headers: getAuthHeaders(),
  })
}

export const updateLeaveBalance = async (userId, leaveTypeId, balance) => {
  return fetchWithErrorHandling("/api/leave-balances", {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, leaveTypeId, balance }),
  })
}

// Leave Types API
export const getLeaveTypes = async () => {
  try {
    const url = "/api/leave-types"
    console.log("Fetching leave types...")

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    console.log(`API Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Clone the response for potential error handling
      const responseClone = response.clone()

      let errorMessage = `${response.status} ${response.statusText}`

      try {
        const errorData = await responseClone.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const text = await response.text()
          if (text) {
            errorMessage += `: ${text.substring(0, 100)}...`
          }
        } catch (textError) {
          // If we can't read the text either, just use the status
        }
      }

      throw new Error(errorMessage)
    }

    // For successful responses, directly use json()
    const data = await response.json()

    // Ensure we always return an array
    if (!Array.isArray(data)) {
      console.warn("API did not return an array for leave types:", data)
      return []
    }

    return data
  } catch (error) {
    console.error("getLeaveTypes error:", error)
    toast.error(error.message || "Une erreur s'est produite lors de la récupération des types de congés")
    return []
  }
}

export const createLeaveType = async (typeData) => {
  return fetchWithErrorHandling("/api/leave-types", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(typeData),
  })
}

export const updateLeaveType = async (id, typeData) => {
  return fetchWithErrorHandling(`/api/leave-types/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(typeData),
  })
}

export const deleteLeaveType = async (id) => {
  return fetchWithErrorHandling(`/api/leave-types/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
}

// User Management API (for HR)
export const getAllUsers = async () => {
  return fetchWithErrorHandling("/api/users", {
    headers: getAuthHeaders(),
  })
}

export const getUserById = async (id) => {
  return fetchWithErrorHandling(`/api/users/${id}`, {
    headers: getAuthHeaders(),
  })
}

export const createUser = async (userData) => {
  return fetchWithErrorHandling("/api/users", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  })
}

export const updateUser = async (id, userData) => {
  return fetchWithErrorHandling(`/api/users/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  })
}

export const deleteUser = async (id) => {
  return fetchWithErrorHandling(`/api/users/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
}

// Modified to use the public endpoint without authentication
export const getDepartments = async () => {
  try {
    // Use the public endpoint instead of the authenticated one
    const url = "/api/users/departments-public"
    console.log("Client: Fetching departments from public endpoint...")

    // Don't include auth headers for the public endpoint
    const response = await fetch(url)

    console.log(`Client: API Response status: ${response.status} ${response.statusText}`)

    // Clone the response for potential error handling
    const responseClone = response.clone()

    if (!response.ok) {
      let errorMessage = `${response.status} ${response.statusText}`

      try {
        const errorData = await responseClone.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        try {
          const text = await response.text()
          if (text) {
            // Log the first part of the response for debugging
            console.error("Client: Non-JSON error response:", text.substring(0, 200))
            errorMessage += `: Non-JSON response received`
          }
        } catch (textError) {
          // If we can't read the text either, just use the status
        }
      }

      console.error(`Client: API Error (${url}):`, errorMessage)

      // Return default departments instead of an empty array
      console.log("Client: Returning default departments due to API error")
      return getDefaultDepartments()
    }

    // For successful responses, directly use json()
    try {
      const data = await response.json()
      console.log("Client: Departments data received:", data)

      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.warn("Client: API did not return an array for departments:", data)
        return getDefaultDepartments()
      }

      // If the array is empty, return default departments
      if (data.length === 0) {
        console.log("Client: API returned empty departments array, using defaults")
        return getDefaultDepartments()
      }

      return data
    } catch (jsonError) {
      console.error("Client: Failed to parse departments response as JSON:", jsonError)
      return getDefaultDepartments()
    }
  } catch (error) {
    console.error("Client: getDepartments error:", error)
    // Return default departments instead of an empty array
    return getDefaultDepartments()
  }
}

// Function to provide default departments when the API fails
function getDefaultDepartments() {
  return [
    "Ressources Humaines",
    "Informatique",
    "Finance",
    "Marketing",
    "Opérations",
    "Ventes",
    "Direction",
    "Recherche et Développement",
    "Service Client",
    "Juridique",
  ]
}

// Récupérer les statistiques par département
export const getLeaveStatisticsByDepartment = async (department = null) => {
  const url = department
    ? `/api/leave-statistics/by-department?department=${encodeURIComponent(department)}`
    : "/api/leave-statistics/by-department"

  return fetchWithErrorHandling(url, {
    headers: getAuthHeaders(),
  })
}

// Récupérer les statistiques par période
export const getLeaveStatisticsByPeriod = async (period = null) => {
  const url = period
    ? `/api/leave-statistics/by-period?period=${encodeURIComponent(period)}`
    : "/api/leave-statistics/by-period"

  return fetchWithErrorHandling(url, {
    headers: getAuthHeaders(),
  })
}

export const getUsers = async () => {
  return fetchWithErrorHandling("/api/users", {
    headers: getAuthHeaders(),
  })
}
