import { NextResponse } from "next/server"

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL

    // Check if DATABASE_URL is configured
    if (!databaseUrl) {
      return NextResponse.json({
        status: "not_configured",
        message: "DATABASE_URL environment variable not set",
        canConnect: false,
        isReal: false,
        recommendation: "Add DATABASE_URL to your environment variables",
      })
    }

    // Check if DATABASE_URL has valid format
    if (!databaseUrl.includes("://")) {
      return NextResponse.json({
        status: "invalid_format",
        message: "DATABASE_URL format is invalid",
        canConnect: false,
        isReal: false,
        recommendation: "DATABASE_URL should be in format: postgresql://user:pass@host:port/db",
      })
    }

    // Try to connect to the database
    try {
      const { Pool } = await import("pg")
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
      })

      const client = await pool.connect()
      await client.query("SELECT NOW()")
      client.release()
      await pool.end()

      return NextResponse.json({
        status: "connected",
        message: "Successfully connected to PostgreSQL database",
        canConnect: true,
        isReal: true,
        recommendation: "Database is working correctly",
      })
    } catch (dbError) {
      console.error("Database connection error:", dbError)

      return NextResponse.json({
        status: "connection_failed",
        message: `Database connection failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
        canConnect: false,
        isReal: false,
        recommendation: "Check your DATABASE_URL and ensure the database is accessible",
      })
    }
  } catch (error) {
    console.error("Database status check error:", error)

    // If pg module is not available, use mock database
    return NextResponse.json({
      status: "mock_mode",
      message: "Using mock database (pg module not available)",
      canConnect: true,
      isReal: false,
      recommendation: "This is normal in development environments",
    })
  }
}
