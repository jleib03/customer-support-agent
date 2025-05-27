import { type NextRequest, NextResponse } from "next/server"

// This endpoint can be used to receive responses from your n8n webhook
// if you want to implement real-time responses in the future
export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, businessId } = await request.json()

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Here you could implement real-time message delivery
    // For now, we'll just log the response
    console.log("Webhook response received:", {
      sessionId,
      message,
      businessId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Response received",
    })
  } catch (error) {
    console.error("Webhook Response API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
