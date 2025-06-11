import { NextResponse } from "next/server"
import { doc, updateDoc, getDoc, addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request) {
  try {
    const { userId, amount, action = "add", reason = "Manual update" } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
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

    return NextResponse.json({
      success: true,
      previousBalance: currentBalance,
      newBalance,
      message: "Balance updated successfully",
    })
  } catch (error) {
    console.error("Error updating balance:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
