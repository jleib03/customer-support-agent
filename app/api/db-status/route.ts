import { NextResponse } from "next/server"

// Enhanced endpoint to check database status
export async function GET() {
  try {
    console.log("🔍 Checking database status...")

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        status: "not_configured",
        message: "DATABASE_URL environment variable not set",
        canConnect: false,
        isReal: false,
      })
    }

    // Try to connect to the database
    const { testConnection, initializeDatabase } = await import("@/lib/db")

    const connectionResult = await testConnection()

    if (!connectionResult.success) {
      return NextResponse.json({
        success: false,
        status: "error",
        message: connectionResult.message,
        canConnect: false,
        isReal: connectionResult.isReal,
      })
    }

    // Try to initialize tables if using real database
    let tablesInitialized = true
    if (connectionResult.isReal) {
      tablesInitialized = await initializeDatabase()
    }

    return NextResponse.json({
      success: true,
      status: connectionResult.isReal ? "connected" : "mock",
      message: connectionResult.message,
      canConnect: true,
      isReal: connectionResult.isReal,
      tablesInitialized,
    })
  } catch (error) {
    console.error("❌ Database status check failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json({
      success: false,
      status: "error",
      message: errorMessage,
      canConnect: false,
      isReal: false,
      error: errorMessage,
    })
  }
}
