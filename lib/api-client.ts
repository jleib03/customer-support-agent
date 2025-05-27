import type { CritterConfig } from "@/types"

export class ApiClient {
  private static async request(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      const isJson = contentType && contentType.includes("application/json")

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`

        if (isJson) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || errorMessage
          }
        } else {
          // If not JSON, try to get text for debugging
          try {
            const errorText = await response.text()
            console.error("Non-JSON error response:", errorText)
            errorMessage = response.statusText || errorMessage
          } catch {
            errorMessage = response.statusText || errorMessage
          }
        }

        throw new Error(errorMessage)
      }

      if (!isJson) {
        throw new Error("Server returned non-JSON response")
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", { url, options, error })
      throw error
    }
  }

  // Get all agents
  static async getAgents(): Promise<CritterConfig[]> {
    const data = await this.request("/api/agents")
    return data.agents || []
  }

  // Get a specific agent
  static async getAgent(businessId: string): Promise<CritterConfig> {
    const data = await this.request(`/api/agents/${encodeURIComponent(businessId)}`)
    return data.agent
  }

  // Create a new agent
  static async createAgent(config: CritterConfig): Promise<CritterConfig> {
    const data = await this.request("/api/agents", {
      method: "POST",
      body: JSON.stringify(config),
    })
    return data.agent
  }

  // Update an agent
  static async updateAgent(businessId: string, updates: Partial<CritterConfig>): Promise<CritterConfig> {
    const data = await this.request(`/api/agents/${encodeURIComponent(businessId)}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
    return data.agent
  }

  // Delete an agent
  static async deleteAgent(businessId: string): Promise<void> {
    await this.request(`/api/agents/${encodeURIComponent(businessId)}`, {
      method: "DELETE",
    })
  }
}
