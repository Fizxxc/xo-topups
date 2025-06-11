import { doc, updateDoc, getDoc, addDoc, collection } from "firebase/firestore"
import { db } from "./firebase"

export async function updateUserBalance(userId, amount, action = "add", reason = "Manual update") {
  try {
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const currentBalance = userDoc.data().balance || 0
    let newBalance = currentBalance

    switch (action) {
      case "add":
        newBalance = currentBalance + amount
        break
      case "subtract":
        newBalance = Math.max(0, currentBalance - amount)
        break
      case "set":
        newBalance = amount
        break
      default:
        throw new Error("Invalid action")
    }

    // Update user balance
    await updateDoc(userRef, {
      balance: newBalance,
    })

    // Log the balance change
    await addDoc(collection(db, "balance_logs"), {
      userId,
      previousBalance: currentBalance,
      newBalance,
      amount,
      action,
      reason,
      timestamp: new Date(),
    })

    return {
      success: true,
      previousBalance: currentBalance,
      newBalance,
    }
  } catch (error) {
    console.error("Error updating balance:", error)
    throw error
  }
}

export async function getUserBalance(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return userDoc.data().balance || 0
    }
    return 0
  } catch (error) {
    console.error("Error getting balance:", error)
    return 0
  }
}
