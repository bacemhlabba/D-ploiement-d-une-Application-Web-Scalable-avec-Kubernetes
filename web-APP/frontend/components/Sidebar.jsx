"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useAuth } from "../contexts/AuthContext"
import {
  Home,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Settings,
  PieChart,
  List,
  User,
  BarChart2,
} from "lucide-react"

const Sidebar = () => {
  const router = useRouter()
  const auth = useAuth() // Store the entire auth object
  const user = auth?.user // Safely access user
  const isHR = user?.role === "hr"
  const [expandedMenus, setExpandedMenus] = useState({
    leaveRequests: false,
    hr: false,
  })

  const toggleMenu = (menu) => {
    setExpandedMenus({
      ...expandedMenus,
      [menu]: !expandedMenus[menu],
    })
  }

  const navItems = [
    {
      name: "Tableau de bord",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
      forAll: true,
    },
    {
      name: "Demandes de congés",
      icon: <Calendar className="h-5 w-5" />,
      submenu: true,
      key: "leaveRequests",
      forAll: true,
      items: [
        {
          name: "Mes demandes",
          href: "/leave-requests",
          icon: <List className="h-5 w-5" />,
        },
        {
          name: "Nouvelle demande",
          href: "/leave-requests/new",
          icon: <FileText className="h-5 w-5" />,
        },
      ],
    },
    {
      name: "Mes soldes",
      href: "/leave-balances",
      icon: <Clock className="h-5 w-5" />,
      forAll: true,
    },
    {
      name: "Administration",
      icon: <Settings className="h-5 w-5" />,
      submenu: true,
      key: "hr",
      forHR: true,
      items: [
        {
          name: "Demandes en attente",
          href: "/hr/pending-requests",
          icon: <CheckSquare className="h-5 w-5" />,
        },
        {
          name: "Gestion des employés",
          href: "/hr/employees",
          icon: <Users className="h-5 w-5" />,
        },
        {
          name: "Statistiques",
          href: "/hr/statistics",
          icon: <PieChart className="h-5 w-5" />,
        },
        {
          name: "Résumé des demandes",
          href: "/hr/leave-summary",
          icon: <BarChart2 className="h-5 w-5" />,
        },
      ],
    },
    {
      name: "Mon profil",
      href: "/profile",
      icon: <User className="h-5 w-5" />,
      forAll: true,
    },
  ]

  return (
    <div className="bg-white w-64 shadow-md h-screen overflow-y-auto">
      <div className="p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            if (item.forAll || (item.forHR && isHR)) {
              if (item.submenu) {
                return (
                  <div key={item.key} className="space-y-1">
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`flex items-center justify-between w-full px-4 py-3 text-sm rounded-md text-gray-700 hover:bg-gray-100`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </div>
                      {expandedMenus[item.key] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {expandedMenus[item.key] && (
                      <div className="pl-4 space-y-1">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center px-4 py-2 text-sm rounded-md ${
                              router.pathname === subItem.href
                                ? "bg-blue-100 text-blue-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {subItem.icon}
                            <span className="ml-3">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              } else {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm rounded-md ${
                      router.pathname === item.href ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                )
              }
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
