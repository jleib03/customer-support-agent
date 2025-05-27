import { type NextRequest, NextResponse } from "next/server"
import type { FeedbackData } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const feedbackData: FeedbackData = await request.json()

    // Here you would typically save to a database
    console.log("Feedback received:", feedbackData)

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Feedback recorded",
    })
  } catch (error) {
    console.error("Feedback API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
