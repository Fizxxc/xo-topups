"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import Navbar from "@/components/Navbar"
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Swal from "sweetalert2"

interface User {
  id: string
  name: string
  email: string
  balance: number
  role: string
  createdAt: any
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [balanceAmount, setBalanceAmount] = useState(0)
  const [balanceAction, setBalanceAction] = useState<"add" | "subtract" | "set">("add")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"))
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]

      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBalanceUpdate = async () => {
    if (!selectedUser || balanceAmount <= 0) {
      Swal.fire("Error!", "Masukkan jumlah yang valid!", "error")
      return
    }

    try {
      const userRef = doc(db, "users", selectedUser.id)
      const userDoc = await getDoc(userRef)
      const currentBalance = userDoc.data()?.balance || 0

      let newBalance = currentBalance

      switch (balanceAction) {
        case "add":
          newBalance = currentBalance + balanceAmount
          break
        case "subtract":
          newBalance = Math.max(0, currentBalance - balanceAmount) // Tidak boleh minus
          break
        case "set":
          newBalance = balanceAmount
          break
      }

      await updateDoc(userRef, {
        balance: newBalance,
      })

      // Update local state
      setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, balance: newBalance } : user)))

      setShowModal(false)
      setSelectedUser(null)
      setBalanceAmount(0)

      Swal.fire(
        "Berhasil!",
        `Saldo berhasil ${balanceAction === "add" ? "ditambah" : balanceAction === "subtract" ? "dikurangi" : "diatur"}!`,
        "success",
      )
    } catch (error) {
      console.error("Error updating balance:", error)
      Swal.fire("Error!", "Gagal mengupdate saldo!", "error")
    }
  }

  const openBalanceModal = (user: User) => {
    setSelectedUser(user)
    setShowModal(true)
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Kelola User</h1>
            <p className="mt-2 text-gray-600">Kelola saldo dan informasi user</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        Rp {user.balance?.toLocaleString("id-ID") || "0"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openBalanceModal(user)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Kelola Saldo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Balance Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Kelola Saldo - {selectedUser.name}</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Saldo saat ini:{" "}
                    <span className="font-semibold text-green-600">
                      Rp {selectedUser.balance?.toLocaleString("id-ID") || "0"}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aksi</label>
                    <select
                      value={balanceAction}
                      onChange={(e) => setBalanceAction(e.target.value as "add" | "subtract" | "set")}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="add">Tambah Saldo</option>
                      <option value="subtract">Kurangi Saldo</option>
                      <option value="set">Set Saldo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {balanceAction === "add"
                        ? "Jumlah Tambahan"
                        : balanceAction === "subtract"
                          ? "Jumlah Pengurangan"
                          : "Saldo Baru"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(Number(e.target.value))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Masukkan jumlah"
                    />
                  </div>

                  {balanceAction !== "set" && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">
                        Saldo setelah {balanceAction === "add" ? "penambahan" : "pengurangan"}:
                        <span className="font-semibold text-blue-600 ml-1">
                          Rp{" "}
                          {(balanceAction === "add"
                            ? (selectedUser.balance || 0) + balanceAmount
                            : Math.max(0, (selectedUser.balance || 0) - balanceAmount)
                          ).toLocaleString("id-ID")}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setSelectedUser(null)
                      setBalanceAmount(0)
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleBalanceUpdate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Update Saldo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
