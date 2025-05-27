import { type NextRequest, NextResponse } from "next/server"
import type { CritterConfig } from "@/types"

// Dynamic import to avoid client-side issues
async function getAgentService() {
  const { AgentService } = await import("@/lib/agent-service")
  return AgentService
}

// GET /api/agents/[businessId] - Get a specific agent
export async function GET(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    console.log("GET /api/agents/[businessId] - Starting request:", params.businessId)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const AgentService = await getAgentService()
    const agent = await AgentService.getAgent(params.businessId)

    if (!agent) {
      console.log("GET /api/agents/[businessId] - Agent not found:", params.businessId)
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    console.log("GET /api/agents/[businessId] - Success:", agent.businessId)
    return NextResponse.json({ success: true, agent })
  } catch (error) {
    console.error("GET /api/agents/[businessId] - Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to fetch agent"
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

// PUT /api/agents/[businessId] - Update an agent
export async function PUT(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    console.log("PUT /api/agents/[businessId] - Starting request:", params.businessId)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    let updates: Partial<CritterConfig>
    try {
      updates = await request.json()
      console.log("PUT /api/agents/[businessId] - Parsed updates")
    } catch (parseError) {
      console.error("PUT /api/agents/[businessId] - JSON parse error:", parseError)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const AgentService = await getAgentService()
    const agent = await AgentService.updateAgent(params.businessId, updates)

    if (!agent) {
      console.log("PUT /api/agents/[businessId] - Agent not found:", params.businessId)
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    console.log("PUT /api/agents/[businessId] - Success:", agent.businessId)
    return NextResponse.json({ success: true, agent })
  } catch (error) {
    console.error("PUT /api/agents/[businessId] - Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to update agent"
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

// DELETE /api/agents/[businessId] - Delete an agent
export async function DELETE(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    console.log("DELETE /api/agents/[businessId] - Starting request:", params.businessId)

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    const AgentService = await getAgentService()
    const success = await AgentService.deleteAgent(params.businessId)

    if (!success) {
      console.log("DELETE /api/agents/[businessId] - Agent not found:", params.businessId)
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 })
    }

    console.log("DELETE /api/agents/[businessId] - Success:", params.businessId)
    return NextResponse.json({ success: true, message: "Agent deleted successfully" })
  } catch (error) {
    console.error("DELETE /api/agents/[businessId] - Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Failed to delete agent"
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
