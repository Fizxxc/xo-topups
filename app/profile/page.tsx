"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Swal from "sweetalert2"

export default function Profile() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchTransactions()
    }
  }, [user])

  const fetchUserData = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData(data)
        setName(data.name)
      }
    }
  }

  const fetchTransactions = async () => {
    if (user) {
      try {
        // Solusi 1: Gunakan query dengan index yang sudah dibuat
        const q = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

        // Solusi 2 (alternatif): Jika tidak ingin membuat index
        // const q = query(collection(db, "transactions"), where("userId", "==", user.uid))

        const querySnapshot = await getDocs(q)
        const transactionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Jika menggunakan Solusi 2, sort data di client
        // transactionsData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())

        setTransactions(transactionsData)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }
    setLoading(false)
  }

  const handleUpdateProfile = async () => {
    try {
      await updateDoc(doc(db, "users", user!.uid), {
        name: name,
      })
      setUserData({ ...userData, name })
      setEditing(false)
      Swal.fire("Berhasil!", "Profile berhasil diupdate!", "success")
    } catch (error) {
      Swal.fire("Error!", "Gagal mengupdate profile!", "error")
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Informasi Akun</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nama</label>
                      {editing ? (
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{userData?.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{userData?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Saldo</label>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        Rp {userData?.balance?.toLocaleString("id-ID") || "0"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    {editing ? (
                      <div className="space-x-2">
                        <button
                          onClick={handleUpdateProfile}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditing(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-4">Riwayat Transaksi</h2>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Belum ada riwayat transaksi</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{transaction.serviceName}</p>
                              <p className="text-sm text-gray-600">
                                {transaction.createdAt?.toDate?.()?.toLocaleDateString("id-ID") || "N/A"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">Rp {transaction.amount?.toLocaleString("id-ID")}</p>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  transaction.status === "success"
                                    ? "bg-green-100 text-green-800"
                                    : transaction.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
