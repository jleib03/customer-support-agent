import { type NextRequest, NextResponse } from "next/server"
import { CritterAIAgent } from "@/lib/ai-agent"
import type { CritterConfig } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const { message, config, sessionId, userId } = await request.json()

    if (!message || !config || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure userId is provided or generate one
    const finalUserId = userId || `user_${Math.random().toString(36).substr(2, 8)}`

    const agent = new CritterAIAgent(config as CritterConfig)
    const response = await agent.generateResponse(message, sessionId, finalUserId)

    return NextResponse.json({
      success: true,
      response,
    })
  } catch (error) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
