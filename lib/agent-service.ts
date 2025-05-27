import { query } from "./db"
import type { CritterConfig } from "@/types"

export class AgentService {
  // Get all active agents
  static async getAllAgents(): Promise<CritterConfig[]> {
    try {
      console.log("AgentService.getAllAgents - Starting query")
      const result = await query(`
        SELECT 
          business_id,
          business_name,
          webhook_url,
          position,
          primary_color,
          secondary_color,
          welcome_message,
          width,
          height,
          show_timestamp,
          enable_typing_indicator,
          max_messages,
          api_key,
          agent_id
        FROM chat_agents 
        WHERE is_active = true 
        ORDER BY created_at DESC
      `)

      console.log("AgentService.getAllAgents - Query result:", result.rows.length, "rows")
      return result.rows.map(this.mapRowToConfig)
    } catch (error) {
      console.error("AgentService.getAllAgents - Database error:", error)
      throw error
    }
  }

  // Get a specific agent by business_id
  static async getAgent(businessId: string): Promise<CritterConfig | null> {
    try {
      console.log("AgentService.getAgent - Starting query for:", businessId)
      const result = await query(
        `
        SELECT 
          business_id,
          business_name,
          webhook_url,
          position,
          primary_color,
          secondary_color,
          welcome_message,
          width,
          height,
          show_timestamp,
          enable_typing_indicator,
          max_messages,
          api_key,
          agent_id
        FROM chat_agents 
        WHERE business_id = $1 AND is_active = true
      `,
        [businessId],
      )

      console.log("AgentService.getAgent - Query result:", result.rows.length, "rows")
      if (result.rows.length === 0) return null
      return this.mapRowToConfig(result.rows[0])
    } catch (error) {
      console.error("AgentService.getAgent - Database error:", error)
      throw error
    }
  }

  // Create a new agent
  static async createAgent(config: CritterConfig): Promise<CritterConfig> {
    try {
      console.log("AgentService.createAgent - Starting insert for:", config.businessId)
      const result = await query(
        `
        INSERT INTO chat_agents (
          business_id,
          business_name,
          webhook_url,
          position,
          primary_color,
          secondary_color,
          welcome_message,
          width,
          height,
          show_timestamp,
          enable_typing_indicator,
          max_messages,
          api_key,
          agent_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING 
          business_id,
          business_name,
          webhook_url,
          position,
          primary_color,
          secondary_color,
          welcome_message,
          width,
          height,
          show_timestamp,
          enable_typing_indicator,
          max_messages,
          api_key,
          agent_id
      `,
        [
          config.businessId,
          config.businessName,
          config.webhookUrl,
          config.position,
          config.primaryColor,
          config.secondaryColor,
          config.welcomeMessage,
          config.width,
          config.height,
          config.showTimestamp,
          config.enableTypingIndicator,
          config.maxMessages || null,
          config.apiKey || null,
          config.agentId || null,
        ],
      )

      console.log("AgentService.createAgent - Insert successful")
      return this.mapRowToConfig(result.rows[0])
    } catch (error) {
      console.error("AgentService.createAgent - Database error:", error)
      throw error
    }
  }

  // Update an existing agent
  static async updateAgent(businessId: string, config: Partial<CritterConfig>): Promise<CritterConfig | null> {
    try {
      console.log("AgentService.updateAgent - Starting update for:", businessId)
      const fields = []
      const values = []
      let paramCount = 1

      // Build dynamic update query
      if (config.businessName !== undefined) {
        fields.push(`business_name = $${paramCount++}`)
        values.push(config.businessName)
      }
      if (config.webhookUrl !== undefined) {
        fields.push(`webhook_url = $${paramCount++}`)
        values.push(config.webhookUrl)
      }
      if (config.position !== undefined) {
        fields.push(`position = $${paramCount++}`)
        values.push(config.position)
      }
      if (config.primaryColor !== undefined) {
        fields.push(`primary_color = $${paramCount++}`)
        values.push(config.primaryColor)
      }
      if (config.secondaryColor !== undefined) {
        fields.push(`secondary_color = $${paramCount++}`)
        values.push(config.secondaryColor)
      }
      if (config.welcomeMessage !== undefined) {
        fields.push(`welcome_message = $${paramCount++}`)
        values.push(config.welcomeMessage)
      }
      if (config.width !== undefined) {
        fields.push(`width = $${paramCount++}`)
        values.push(config.width)
      }
      if (config.height !== undefined) {
        fields.push(`height = $${paramCount++}`)
        values.push(config.height)
      }
      if (config.showTimestamp !== undefined) {
        fields.push(`show_timestamp = $${paramCount++}`)
        values.push(config.showTimestamp)
      }
      if (config.enableTypingIndicator !== undefined) {
        fields.push(`enable_typing_indicator = $${paramCount++}`)
        values.push(config.enableTypingIndicator)
      }
      if (config.maxMessages !== undefined) {
        fields.push(`max_messages = $${paramCount++}`)
        values.push(config.maxMessages)
      }
      if (config.apiKey !== undefined) {
        fields.push(`api_key = $${paramCount++}`)
        values.push(config.apiKey)
      }
      if (config.agentId !== undefined) {
        fields.push(`agent_id = $${paramCount++}`)
        values.push(config.agentId)
      }

      if (fields.length === 0) {
        console.log("AgentService.updateAgent - No fields to update")
        return this.getAgent(businessId)
      }

      values.push(businessId) // Add businessId as the last parameter

      const result = await query(
        `
        UPDATE chat_agents 
        SET ${fields.join(", ")}
        WHERE business_id = $${paramCount} AND is_active = true
        RETURNING 
          business_id,
          business_name,
          webhook_url,
          position,
          primary_color,
          secondary_color,
          welcome_message,
          width,
          height,
          show_timestamp,
          enable_typing_indicator,
          max_messages,
          api_key,
          agent_id
      `,
        values,
      )

      console.log("AgentService.updateAgent - Update result:", result.rows.length, "rows")
      if (result.rows.length === 0) return null
      return this.mapRowToConfig(result.rows[0])
    } catch (error) {
      console.error("AgentService.updateAgent - Database error:", error)
      throw error
    }
  }

  // Soft delete an agent
  static async deleteAgent(businessId: string): Promise<boolean> {
    try {
      console.log("AgentService.deleteAgent - Starting delete for:", businessId)
      const result = await query(
        `
        UPDATE chat_agents 
        SET is_active = false 
        WHERE business_id = $1 AND is_active = true
      `,
        [businessId],
      )

      console.log("AgentService.deleteAgent - Delete result:", result.rowCount, "rows affected")
      return (result.rowCount || 0) > 0
    } catch (error) {
      console.error("AgentService.deleteAgent - Database error:", error)
      throw error
    }
  }

  // Helper method to map database row to CritterConfig
  private static mapRowToConfig(row: any): CritterConfig {
    return {
      businessId: row.business_id,
      businessName: row.business_name,
      webhookUrl: row.webhook_url,
      position: row.position,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      welcomeMessage: row.welcome_message,
      width: row.width,
      height: row.height,
      showTimestamp: row.show_timestamp,
      enableTypingIndicator: row.enable_typing_indicator,
      maxMessages: row.max_messages,
      apiKey: row.api_key,
      agentId: row.agent_id,
    }
  }
}
