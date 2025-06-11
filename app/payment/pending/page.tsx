"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function PaymentPending() {
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

  const goToProfile = () => {
    router.push("/profile")
  }

  const checkPaymentStatus = () => {
    // Refresh halaman untuk mengecek status terbaru
    window.location.reload()
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
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
            {/* Pending Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Pending Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pembayaran Sedang Diproses</h1>
            <p className="text-lg text-gray-600 mb-8">
              Pembayaran Anda sedang dalam proses verifikasi. Mohon tunggu beberapa saat atau selesaikan pembayaran
              Anda.
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
                    <span className="font-medium text-yellow-600 capitalize">{transactionStatus}</span>
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
                onClick={checkPaymentStatus}
                className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
              >
                Cek Status Pembayaran
              </button>
              <button
                onClick={goToProfile}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Lihat Riwayat Transaksi
              </button>
              <button
                onClick={goToDashboard}
                className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Catatan:</strong> Jika Anda menggunakan transfer bank atau virtual account, pembayaran mungkin
                memerlukan waktu hingga 24 jam untuk diverifikasi. Saldo akan otomatis bertambah setelah pembayaran
                dikonfirmasi.
              </p>
            </div>

            {/* Payment Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
              <h4 className="font-semibold text-blue-900 mb-2">Instruksi Pembayaran:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Selesaikan pembayaran sesuai metode yang dipilih</li>
                <li>• Simpan bukti pembayaran untuk referensi</li>
                <li>• Cek email untuk konfirmasi pembayaran</li>
                <li>• Hubungi customer service jika ada kendala</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
