import type { CritterConfig, ChatMessage, AgentResponse, WebhookPayload } from "@/types"

export class CritterAIAgent {
  private config: CritterConfig
  private conversationHistory: ChatMessage[] = []
  private pendingResponses: Map<string, (response: any) => void> = new Map()

  constructor(config: CritterConfig) {
    this.config = config
  }

  async generateResponse(userMessage: string, sessionId: string, userId: string): Promise<AgentResponse> {
    try {
      // Add user message to history
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        content: userMessage,
        role: "user",
        timestamp: new Date(),
        metadata: { businessId: this.config.businessId, sessionId },
      }

      this.conversationHistory.push(userMsg)

      // Prepare webhook payload
      const webhookPayload: WebhookPayload = {
        message: userMessage,
        userId,
        sessionId,
        businessId: this.config.businessId,
        businessName: this.config.businessName,
        timestamp: new Date().toISOString(),
      }

      // Send to webhook
      const response = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      })

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`)
      }

      const webhookResponse = await response.json()

      // Parse the response according to the expected format
      let responseMessage = "I'm processing your request..."

      try {
        responseMessage = this.parseWebhookResponse(webhookResponse)
      } catch (parseError) {
        console.error("Error parsing webhook response:", parseError)
        responseMessage = "I'm sorry, I'm having trouble processing that request. Please try again."
      }

      // Simple intent detection
      const intent = this.detectIntent(userMessage)
      const confidence = this.calculateConfidence(userMessage, responseMessage)

      // Add assistant response to history
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        content: responseMessage,
        role: "assistant",
        timestamp: new Date(),
        metadata: {
          businessId: this.config.businessId,
          sessionId,
          intent,
          confidence,
        },
      }

      this.conversationHistory.push(assistantMsg)

      return {
        message: responseMessage,
        intent,
        confidence,
        requiresHuman: confidence < 0.7 || intent === "complaint",
        metadata: {
          sessionId,
          businessId: this.config.businessId,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error("Webhook Agent Error:", error)
      return {
        message: "I'm sorry, I'm having trouble responding right now. Please try again or contact us directly.",
        intent: "error",
        confidence: 0,
        requiresHuman: true,
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      }
    }
  }

  private parseWebhookResponse(webhookResponse: any): string {
    console.log("Raw webhook response:", webhookResponse)

    // Handle the expected JSON array format: [{"output": "response text"}]
    if (Array.isArray(webhookResponse)) {
      if (webhookResponse.length > 0 && webhookResponse[0] && webhookResponse[0].output) {
        const output = webhookResponse[0].output
        console.log("Extracted output from array:", output)
        return this.formatResponseText(output)
      }
    }

    // Handle direct object format: {"output": "response text"}
    if (webhookResponse && typeof webhookResponse === "object" && webhookResponse.output) {
      console.log("Extracted output from object:", webhookResponse.output)
      return this.formatResponseText(webhookResponse.output)
    }

    // Handle string response that might be JSON
    if (typeof webhookResponse === "string") {
      try {
        const parsed = JSON.parse(webhookResponse)
        console.log("Parsed string response:", parsed)
        return this.parseWebhookResponse(parsed)
      } catch {
        // If it's not JSON, treat as plain text
        console.log("Treating as plain text:", webhookResponse)
        return this.formatResponseText(webhookResponse)
      }
    }

    // Handle nested response formats
    if (webhookResponse && typeof webhookResponse === "object") {
      // Check for common response patterns
      if (webhookResponse.message) {
        return this.formatResponseText(webhookResponse.message)
      }
      if (webhookResponse.response) {
        return this.formatResponseText(webhookResponse.response)
      }
      if (webhookResponse.text) {
        return this.formatResponseText(webhookResponse.text)
      }
      if (webhookResponse.data && webhookResponse.data.output) {
        return this.formatResponseText(webhookResponse.data.output)
      }
    }

    // Fallback - log the response for debugging
    console.error("Unable to parse webhook response:", webhookResponse)
    throw new Error("Unable to parse webhook response format")
  }

  private formatResponseText(text: string): string {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid response text")
    }

    // Convert \n to actual line breaks for proper display
    let formatted = text.replace(/\\n/g, "\n").trim()

    // Remove any remaining JSON artifacts
    formatted = formatted.replace(/^\[?\{?"?output"?:?\s*"?/, "").replace(/"?\}?\]?$/, "")

    console.log("Formatted text:", formatted)
    return formatted
  }

  // Method to handle incoming webhook responses (for future use)
  handleWebhookResponse(sessionId: string, response: any) {
    const pendingResolver = this.pendingResponses.get(sessionId)
    if (pendingResolver) {
      pendingResolver(response)
      this.pendingResponses.delete(sessionId)
    }
  }

  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("book") || lowerMessage.includes("appointment") || lowerMessage.includes("schedule")) {
      return "booking"
    }
    if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("how much")) {
      return "pricing"
    }
    if (lowerMessage.includes("hours") || lowerMessage.includes("open") || lowerMessage.includes("closed")) {
      return "hours"
    }
    if (lowerMessage.includes("complaint") || lowerMessage.includes("problem") || lowerMessage.includes("issue")) {
      return "complaint"
    }
    if (lowerMessage.includes("service") || lowerMessage.includes("what do you")) {
      return "services"
    }

    return "general"
  }

  private calculateConfidence(userMessage: string, response: string): number {
    // Simple confidence calculation based on message characteristics
    let confidence = 0.8

    if (userMessage.length < 10) confidence -= 0.1
    if (response.includes("I don't know") || response.includes("not sure")) confidence -= 0.2
    if (response.includes("contact us directly")) confidence -= 0.3

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  clearHistory(): void {
    this.conversationHistory = []
  }
}
