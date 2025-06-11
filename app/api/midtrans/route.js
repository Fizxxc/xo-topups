import { NextResponse } from "next/server"

const midtransClient = require("midtrans-client")

const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
})

export async function POST(request) {
  try {
    const { orderId, amount, customerDetails, itemDetails } = await request.json()

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: customerDetails,
      item_details: itemDetails,
    }

    const transaction = await snap.createTransaction(parameter)

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    })
  } catch (error) {
    console.error("Midtrans error:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}
