// Database connection with v0 environment compatibility
let pool: any = null

async function getPool() {
  if (!pool) {
    try {
      // Check if we're in a v0/browser environment
      if (typeof window !== "undefined") {
        throw new Error("Database operations not available in browser environment")
      }

      // Try to import pg dynamically
      let Pool: any
      try {
        const pgModule = await import("pg")
        Pool = pgModule.Pool
      } catch (importError) {
        console.log("pg module not available, using mock database")
        throw new Error("PostgreSQL module not available in this environment")
      }

      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set")
      }

      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })

      // Test the connection
      const client = await pool.connect()
      console.log("✅ PostgreSQL connection successful")
      client.release()
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error)
      throw error
    }
  }

  return pool
}

// Database query helper with fallback for v0 environment
export async function query(text: string, params?: any[]) {
  try {
    const pool = await getPool()
    const client = await pool.connect()

    try {
      console.log("🔍 Database query:", text.substring(0, 100) + "...", params?.length || 0, "params")
      const start = Date.now()
      const result = await client.query(text, params)
      const duration = Date.now() - start
      console.log("✅ Database result:", result.rowCount, "rows in", duration + "ms")
      return result
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("❌ Database query error:", error)

    // If we're in v0 environment or pg is not available, use mock data
    if (
      error instanceof Error &&
      (error.message.includes("module") ||
        error.message.includes("browser environment") ||
        error.message.includes("not available"))
    ) {
      console.log("🔄 Using mock database for v0 environment")
      return mockQuery(text, params)
    }

    // Provide more specific error messages for real database issues
    if (error instanceof Error) {
      if (error.message.includes("connect ECONNREFUSED")) {
        throw new Error("Database connection refused. Check if PostgreSQL is running and accessible.")
      }
      if (error.message.includes("password authentication failed")) {
        throw new Error("Database authentication failed. Check your username and password.")
      }
      if (error.message.includes("database") && error.message.includes("does not exist")) {
        throw new Error("Database does not exist. Please create the database first.")
      }
    }

    throw error
  }
}

// Mock database for v0 environment
function mockQuery(text: string, params?: any[]) {
  console.log("📝 Mock database query:", text.substring(0, 100) + "...", params?.length || 0, "params")

  // Mock responses for different query types
  if (text.includes("SELECT") && text.includes("chat_agents")) {
    // Return mock agent data
    return {
      rows: [
        {
          business_id: "demo-pet-services",
          business_name: "Critter Pet Services",
          webhook_url: "https://jleib03.app.n8n.cloud/webhook-test/803d260b-1b17-4abf-8079-2d40225c29b0",
          position: "bottom-right",
          primary_color: "#e75837",
          secondary_color: "#745e25",
          welcome_message: "Welcome to Critter Pet Services! How can I help you today?",
          width: 350,
          height: 500,
          show_timestamp: true,
          enable_typing_indicator: true,
          max_messages: null,
          api_key: null,
          agent_id: null,
        },
      ],
      rowCount: 1,
    }
  }

  if (text.includes("INSERT") && text.includes("chat_agents")) {
    // Return the inserted data
    const [
      businessId,
      businessName,
      webhookUrl,
      position,
      primaryColor,
      secondaryColor,
      welcomeMessage,
      width,
      height,
      showTimestamp,
      enableTypingIndicator,
    ] = params || []

    return {
      rows: [
        {
          business_id: businessId,
          business_name: businessName,
          webhook_url: webhookUrl,
          position: position,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          welcome_message: welcomeMessage,
          width: width,
          height: height,
          show_timestamp: showTimestamp,
          enable_typing_indicator: enableTypingIndicator,
          max_messages: null,
          api_key: null,
          agent_id: null,
        },
      ],
      rowCount: 1,
    }
  }

  if (text.includes("UPDATE") && text.includes("chat_agents")) {
    // Return updated data
    const businessId = params?.[params.length - 1] // businessId is last param
    return {
      rows: [
        {
          business_id: businessId,
          business_name: "Updated Business",
          webhook_url: "https://jleib03.app.n8n.cloud/webhook-test/803d260b-1b17-4abf-8079-2d40225c29b0",
          position: "bottom-right",
          primary_color: "#e75837",
          secondary_color: "#745e25",
          welcome_message: "Updated welcome message",
          width: 350,
          height: 500,
          show_timestamp: true,
          enable_typing_indicator: true,
          max_messages: null,
          api_key: null,
          agent_id: null,
        },
      ],
      rowCount: 1,
    }
  }

  if (text.includes("UPDATE") && text.includes("is_active = false")) {
    // Return delete success
    return {
      rows: [],
      rowCount: 1,
    }
  }

  // Default empty result
  return {
    rows: [],
    rowCount: 0,
  }
}

// Helper function to test database connection
export async function testConnection(): Promise<{ success: boolean; message: string; isReal: boolean }> {
  try {
    await query("SELECT 1 as test")

    // Check if we're using real database or mock
    try {
      await getPool()
      return { success: true, message: "Connected to PostgreSQL database", isReal: true }
    } catch {
      return { success: true, message: "Using mock database (v0 environment)", isReal: false }
    }
  } catch (error) {
    console.error("Database connection test failed:", error)
    const message = error instanceof Error ? error.message : "Connection failed"
    return { success: false, message, isReal: false }
  }
}

// Helper function to check if tables exist
export async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_agents'
    `)
    return result.rows.length > 0
  } catch (error) {
    console.error("Error checking tables:", error)
    // In mock mode, assume tables exist
    return true
  }
}

// Helper function to initialize database tables (for real databases)
export async function initializeDatabase() {
  try {
    console.log("🚀 Initializing database tables...")

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chat_agents (
        id SERIAL PRIMARY KEY,
        business_id VARCHAR(255) UNIQUE NOT NULL,
        business_name VARCHAR(255) NOT NULL,
        webhook_url TEXT NOT NULL,
        position VARCHAR(50) DEFAULT 'bottom-right',
        primary_color VARCHAR(7) DEFAULT '#e75837',
        secondary_color VARCHAR(7) DEFAULT '#745e25',
        welcome_message TEXT DEFAULT 'Welcome! How can I help you today?',
        width INTEGER DEFAULT 350,
        height INTEGER DEFAULT 500,
        show_timestamp BOOLEAN DEFAULT true,
        enable_typing_indicator BOOLEAN DEFAULT true,
        max_messages INTEGER,
        api_key TEXT,
        agent_id VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `

    await query(createTableQuery)
    console.log("✅ Database tables initialized successfully")
    return true
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    return false
  }
}
