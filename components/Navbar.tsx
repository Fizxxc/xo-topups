"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Swal from "sweetalert2"

export default function Navbar() {
  const { user, userRole, logout } = useAuth()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data())
      }
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Logout",
      text: "Apakah Anda yakin ingin keluar?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
    })

    if (result.isConfirmed) {
      await logout()
      router.push("/login")
      Swal.fire("Berhasil!", "Anda telah keluar.", "success")
    }
  }

  const goToProfile = () => {
    if (userRole === "admin") {
      router.push("/admin/profile")
    } else {
      router.push("/profile")
    }
    setShowDropdown(false)
  }

  const goToDashboard = () => {
    if (userRole === "admin") {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
    setShowDropdown(false)
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={goToDashboard}>
              TopUp Premium
            </h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {userData && (
                <div className="text-sm text-gray-600">
                  Saldo:{" "}
                  <span className="font-semibold text-green-600">
                    Rp {userData.balance?.toLocaleString("id-ID") || "0"}
                  </span>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {userData?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:block">{userData?.name || "User"}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={goToProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={goToDashboard}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
