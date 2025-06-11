import { NextResponse } from "next/server"
import { doc, updateDoc, getDoc, addDoc, collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import crypto from "crypto"

export async function POST(request) {
  try {
    // Check if request has body
    const contentType = request.headers.get("content-type")
    console.log("Content-Type:", contentType)

    let notification

    // Handle different content types
    if (contentType && contentType.includes("application/json")) {
      const body = await request.text()
      console.log("Raw body:", body)

      if (!body || body.trim() === "") {
        console.log("Empty request body")
        return NextResponse.json({ error: "Empty request body" }, { status: 400 })
      }

      try {
        notification = JSON.parse(body)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        console.log("Body that failed to parse:", body)
        return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 })
      }
    } else if (contentType && contentType.includes("application/x-www-form-urlencoded")) {
      // Handle form data
      const formData = await request.formData()
      notification = Object.fromEntries(formData)
    } else {
      // Try to get as text first
      const body = await request.text()
      console.log("Unknown content type, raw body:", body)

      if (!body) {
        return NextResponse.json({ error: "No request body" }, { status: 400 })
      }

      // Try to parse as JSON
      try {
        notification = JSON.parse(body)
      } catch (parseError) {
        console.error("Failed to parse body as JSON:", parseError)
        return NextResponse.json({ error: "Unable to parse request body" }, { status: 400 })
      }
    }

    console.log("Parsed notification:", notification)

    // Verify required fields
    if (!notification.order_id || !notification.transaction_status) {
      console.log("Missing required fields:", {
        order_id: notification.order_id,
        transaction_status: notification.transaction_status,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify signature (optional but recommended for security)
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (serverKey && notification.signature_key) {
      const orderId = notification.order_id
      const statusCode = notification.status_code
      const grossAmount = notification.gross_amount

      const signatureKey = crypto
        .createHash("sha512")
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest("hex")

      if (signatureKey !== notification.signature_key) {
        console.log("Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const orderId = notification.order_id
    const transactionStatus = notification.transaction_status
    const fraudStatus = notification.fraud_status

    console.log(`Processing webhook for order: ${orderId}, status: ${transactionStatus}`)

    // Determine transaction status
    let status = "pending"
    if (transactionStatus === "capture") {
      if (fraudStatus === "challenge") {
        status = "challenge"
      } else if (fraudStatus === "accept") {
        status = "success"
      }
    } else if (transactionStatus === "settlement") {
      status = "success"
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      status = "failed"
    } else if (transactionStatus === "pending") {
      status = "pending"
    }

    console.log(`Final status: ${status}`)

    // Update transaction in Firestore
    try {
      // Find transaction by orderId
      const transactionsRef = collection(db, "transactions")
      const transactionQuery = await getDocs(query(transactionsRef, where("orderId", "==", orderId)))

      if (transactionQuery.empty) {
        console.log(`Transaction not found for orderId: ${orderId}`)
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
      }

      const transactionDoc = transactionQuery.docs[0]
      const transactionData = transactionDoc.data()

      // Update transaction status
      await updateDoc(doc(db, "transactions", transactionDoc.id), {
        status: status,
        updatedAt: new Date(),
        midtransResponse: notification,
      })

      console.log(`Transaction ${transactionDoc.id} updated to status: ${status}`)

      // If payment is successful, update user balance
      if (status === "success" && transactionData.userId && transactionData.amount) {
        const userRef = doc(db, "users", transactionData.userId)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const currentBalance = userDoc.data().balance || 0
          const newBalance = currentBalance + transactionData.amount

          await updateDoc(userRef, {
            balance: newBalance,
          })

          console.log(`User ${transactionData.userId} balance updated: ${currentBalance} -> ${newBalance}`)

          // Log balance change
          await addDoc(collection(db, "balance_logs"), {
            userId: transactionData.userId,
            amount: transactionData.amount,
            action: "add",
            reason: `Payment success - ${transactionData.serviceName}`,
            orderId: orderId,
            previousBalance: currentBalance,
            newBalance: newBalance,
            createdAt: new Date(),
          })
        } else {
          console.log(`User not found: ${transactionData.userId}`)
        }
      }

      return NextResponse.json({
        message: "Webhook processed successfully",
        orderId: orderId,
        status: status,
      })
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Midtrans webhook endpoint is working",
    timestamp: new Date().toISOString(),
  })
}
