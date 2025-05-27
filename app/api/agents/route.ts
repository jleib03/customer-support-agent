import { type NextRequest, NextResponse } from "next/server"
import type { CritterConfig } from "@/types"

// Dynamic import to avoid client-side issues
async function getAgentService() {
  const { AgentService } = await import("@/lib/agent-service")
  return AgentService
}

// GET /api/agents - Get all agents
export async function GET() {
  try {
    console.log("GET /api/agents - Starting request")

    // Check if we're in the right environment
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL not found")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const AgentService = await getAgentService()
    const agents = await AgentService.getAllAgents()
    console.log("GET /api/agents - Success:", agents.length, "agents")
    return NextResponse.json({ success: true, agents })
  } catch (error) {
    console.error("GET /api/agents - Error:", error)

    // Return a more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 },
    )
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/agents - Starting request")

    // Check database configuration
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL not found")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    let config: CritterConfig
    try {
      config = await request.json()
      console.log("POST /api/agents - Parsed config:", config.businessId)
    } catch (parseError) {
      console.error("POST /api/agents - JSON parse error:", parseError)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate required fields
    if (!config.businessId || !config.businessName || !config.webhookUrl) {
      console.error("POST /api/agents - Missing required fields:", {
        businessId: !!config.businessId,
        businessName: !!config.businessName,
        webhookUrl: !!config.webhookUrl,
      })
      return NextResponse.json(
        { success: false, error: "Missing required fields: businessId, businessName, webhookUrl" },
        { status: 400 },
      )
    }

    const AgentService = await getAgentService()
    const agent = await AgentService.createAgent(config)
    console.log("POST /api/agents - Success:", agent.businessId)
    return NextResponse.json({ success: true, agent }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/agents - Error:", error)

    // Handle unique constraint violation
    if (error.code === "23505") {
      return NextResponse.json({ success: false, error: "Business ID already exists" }, { status: 409 })
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to create agent"
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 },
    )
  }
}
