"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function PaymentError() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [userBalance, setUserBalance] = useState(0)

  // Get parameters from URL
  const orderId = searchParams.get("order_id")
  const statusCode = searchParams.get("status_code")
  const transactionStatus = searchParams.get("transaction_status")

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserBalance(userDoc.data().balance || 0)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const goToDashboard = () => {
    router.push("/dashboard")
  }

  const tryAgain = () => {
    router.push("/dashboard")
  }

  const contactSupport = () => {
    // Bisa diarahkan ke halaman contact atau WhatsApp
    window.open("https://wa.me/6288991114939?text=Halo, saya mengalami masalah dengan pembayaran", "_blank")
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-2xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pembayaran Gagal</h1>
            <p className="text-lg text-gray-600 mb-8">
              Maaf, terjadi kesalahan dalam proses pembayaran Anda. Silakan coba lagi atau hubungi customer service.
            </p>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Transaksi</h3>
              <div className="space-y-3 text-left">
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium text-gray-900">{orderId}</span>
                  </div>
                )}
                {transactionStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-red-600 capitalize">{transactionStatus}</span>
                  </div>
                )}
                {statusCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Code:</span>
                    <span className="font-medium text-gray-900">{statusCode}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Saldo Saat Ini:</span>
                  <span className="font-bold text-blue-600">Rp {userBalance.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={tryAgain}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Coba Lagi
              </button>
              <button
                onClick={contactSupport}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Hubungi Customer Service
              </button>
              <button
                onClick={goToDashboard}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>

            {/* Error Reasons */}
            <div className="mt-8 p-4 bg-red-50 rounded-lg text-left">
              <h4 className="font-semibold text-red-900 mb-2">Kemungkinan Penyebab:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Saldo kartu kredit/debit tidak mencukupi</li>
                <li>• Koneksi internet terputus saat proses pembayaran</li>
                <li>• Kartu diblokir oleh bank</li>
                <li>• Melewati batas waktu pembayaran</li>
                <li>• Kesalahan teknis dari sistem pembayaran</li>
              </ul>
            </div>

            {/* Support Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Butuh Bantuan?</strong> Tim customer service kami siap membantu Anda 24/7. Hubungi kami melalui
                WhatsApp atau email untuk mendapatkan bantuan lebih lanjut.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
