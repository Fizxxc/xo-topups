"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"
import { collection, getDocs, doc, updateDoc, addDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Swal from "sweetalert2"

// Declare global window with snap property
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void
    }
  }
}

interface Service {
  id: string
  name: string
  price: number
  category: string
  description: string
  active: boolean
}

export default function Dashboard() {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [midtransLoaded, setMidtransLoaded] = useState(false)

  useEffect(() => {
    if (user) {
      fetchServices()
      // Load Midtrans script
      const midtransScript = document.createElement("script")
      midtransScript.src = "https://app.sandbox.midtrans.com/snap/snap.js"
      midtransScript.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "")
      midtransScript.onload = () => {
        console.log("Midtrans script loaded")
        setMidtransLoaded(true)
      }
      document.body.appendChild(midtransScript)

      return () => {
        // Clean up script when component unmounts
        if (document.body.contains(midtransScript)) {
          document.body.removeChild(midtransScript)
        }
      }
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchServices = async () => {
    try {
      const servicesSnapshot = await getDocs(collection(db, "services"))
      const servicesData = servicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[]

      setServices(servicesData.filter((service) => service.active))
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopUp = async (service: Service) => {
    try {
      // Check if Midtrans is loaded
      if (!window.snap) {
        Swal.fire("Error!", "Payment system is not ready yet. Please try again.", "error")
        return
      }

      const orderId = `topup-${Date.now()}`

      const response = await fetch("/api/midtrans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount: service.price,
          customerDetails: {
            first_name: user?.displayName || "User",
            email: user?.email,
          },
          itemDetails: [
            {
              id: service.id,
              price: service.price,
              quantity: 1,
              name: service.name,
            },
          ],
        }),
      })

      const data = await response.json()

      if (data.token) {
        // Save transaction to Firestore
        await addDoc(collection(db, "transactions"), {
          userId: user?.uid,
          serviceId: service.id,
          serviceName: service.name,
          amount: service.price,
          orderId,
          status: "pending",
          createdAt: new Date(),
        })

        // Open Midtrans payment page
        window.snap?.pay(data.token, {
          onSuccess: async (result: any) => {
            // Update user balance
            if (user) {
              const userRef = doc(db, "users", user.uid)
              const userDoc = await getDoc(userRef)
              const currentBalance = userDoc.data()?.balance || 0

              await updateDoc(userRef, {
                balance: currentBalance + service.price,
              })

              Swal.fire("Berhasil!", "Top up berhasil!", "success")
              window.location.reload()
            }
          },
          onPending: (result: any) => {
            Swal.fire("Pending", "Pembayaran sedang diproses", "info")
          },
          onError: (result: any) => {
            Swal.fire("Error!", "Pembayaran gagal!", "error")
          },
        })
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      Swal.fire("Error!", "Terjadi kesalahan!", "error")
    }
  }

  const categories = ["all", "topup", "premium", "game"]
  const filteredServices =
    selectedCategory === "all" ? services : services.filter((service) => service.category === selectedCategory)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
          <p className="text-gray-600">You need to login to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Pilih layanan yang Anda butuhkan</p>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedCategory === category ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {category === "all" ? "Semua" : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Belum ada layanan tersedia. Silakan coba lagi nanti.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">Rp {service.price.toLocaleString("id-ID")}</span>
                    <button
                      onClick={() => handleTopUp(service)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!midtransLoaded}
                    >
                      {midtransLoaded ? "Beli Sekarang" : "Loading..."}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
