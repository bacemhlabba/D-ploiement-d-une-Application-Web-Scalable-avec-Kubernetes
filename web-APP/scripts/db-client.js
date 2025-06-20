// This file is for client-side database operations if needed
// For most operations, use the API endpoints

export async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`/api/${endpoint}`, options)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "An error occurred")
    }

    return data
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error)
    throw error
  }
}
