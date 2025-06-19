"use client"

import { createContext, useState, useContext, useEffect } from "react"
import { useRouter } from "next/router"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    try {
      const storedUser = localStorage.getItem("user")
      const token = localStorage.getItem("token")

      if (storedUser && token) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Error loading auth state:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Save user and token to localStorage
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)

      setUser(data.user)
      toast.success("Connexion réussie")
      return data.user
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error.message || "Échec de la connexion")
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      toast.success("Inscription réussie")
      return data
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(error.message || "Échec de l'inscription")
      throw error
    }
  }

  const logout = () => {
    try {
      // Remove user and token from localStorage
      localStorage.removeItem("user")
      localStorage.removeItem("token")

      setUser(null)
      toast.success("Déconnexion réussie")
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const updateUserProfile = (updatedUser) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("user"))
      const updatedUserData = { ...currentUser, ...updatedUser }

      localStorage.setItem("user", JSON.stringify(updatedUserData))
      setUser(updatedUserData)
    } catch (error) {
      console.error("Update profile error:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
