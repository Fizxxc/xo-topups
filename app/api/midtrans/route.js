import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    console.log("=== Midtrans API Called ===")

    // Check environment variables first
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    console.log("Server Key exists:", !!serverKey)

    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY is not set")
      return NextResponse.json(
        {
          error: "Payment configuration error",
          details: "Server key not configured",
        },
        { status: 500 },
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("Request body:", body)
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { orderId, amount, customerDetails, itemDetails } = body

    // Validate required fields
    if (!orderId || !amount || !customerDetails || !itemDetails) {
      console.error("Missing required fields:", { orderId, amount, customerDetails, itemDetails })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Import midtrans-client dynamically
    let midtransClient
    try {
      midtransClient = await import("midtrans-client")
      console.log("Midtrans client imported successfully")
    } catch (importError) {
      console.error("Failed to import midtrans-client:", importError)
      return NextResponse.json(
        {
          error: "Payment service unavailable",
          details: "Midtrans client not available",
        },
        { status: 500 },
      )
    }

    // Initialize Midtrans Snap
    const snap = new midtransClient.default.Snap({
      isProduction: false, // Set to true for production
      serverKey: serverKey,
    })

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

    console.log("Creating transaction with parameter:", JSON.stringify(parameter, null, 2))

    // Create transaction
    const transaction = await snap.createTransaction(parameter)
    console.log("Transaction created successfully:", transaction.token)

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    })
  } catch (error) {
    console.error("=== Midtrans API Error ===")
    console.error("Error message:", error.message)
    console.error("Error stack:", error.stack)

    // Handle specific Midtrans API errors
    if (error.message && error.message.includes("API")) {
      return NextResponse.json(
        {
          error: "Midtrans API error",
          details: error.message,
          suggestion: "Please check your Midtrans configuration",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to create transaction",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Handle GET requests for testing
export async function GET() {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY

    return NextResponse.json({
      message: "Midtrans API endpoint is working",
      hasServerKey: !!serverKey,
      hasClientKey: !!clientKey,
      serverKeyLength: serverKey ? serverKey.length : 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
