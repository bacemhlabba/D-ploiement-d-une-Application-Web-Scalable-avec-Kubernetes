"use client"

import { useEffect } from "react"
import { useRouter } from "next/router"

const Register = () => {
  const router = useRouter()

  useEffect(() => {
    // Rediriger vers la page de connexion
    router.push("/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Inscription désactivée</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            L'inscription directe a été désactivée. Veuillez contacter le service RH pour créer un compte.
          </p>
        </div>
        <div className="mt-6">
          <p className="text-center">Redirection vers la page de connexion...</p>
        </div>
      </div>
    </div>
  )
}

export default Register
