"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "../contexts/AuthContext"
import { LogOut, Menu, User, Settings } from "lucide-react"

const Navbar = () => {
  const auth = useAuth() // Store the entire auth object
  const user = auth?.user // Safely access user
  const logout = auth?.logout // Safely access logout function

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false)

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Gestion de Congés</span>
            </Link>
          </div>

          {user && (
            <>
              <div className="hidden md:flex items-center">
                <div className="ml-4 flex items-center md:ml-6">
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="flex items-center p-2 rounded-md hover:bg-blue-700"
                    >
                      <span className="mr-2">
                        Bonjour, {user.full_name} ({user.role === "hr" ? "DRH" : "Employé"})
                      </span>
                      <User className="h-5 w-5" />
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <Settings className="h-4 w-4 mr-2" />
                            Profil
                          </div>
                        </Link>
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false)
                            if (logout) logout()
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <LogOut className="h-4 w-4 mr-2" />
                            Déconnexion
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md hover:bg-blue-700"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && user && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <span className="block px-3 py-2 text-white">
              Bonjour, {user.full_name} ({user.role === "hr" ? "DRH" : "Employé"})
            </span>
            <Link
              href="/profile"
              className="block px-3 py-2 text-white hover:bg-blue-700 rounded-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Profil
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                if (logout) logout()
              }}
              className="block w-full text-left px-3 py-2 text-white hover:bg-blue-700 rounded-md"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
