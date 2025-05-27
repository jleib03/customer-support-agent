export interface CritterConfig {
  businessId: string
  businessName: string
  agentId?: string
  webhookUrl: string
  apiKey?: string
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  primaryColor: string
  secondaryColor: string
  welcomeMessage: string
  width: number
  height: number
  showTimestamp: boolean
  enableTypingIndicator: boolean
  maxMessages?: number
}

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
  metadata?: {
    businessId?: string
    sessionId?: string
    sentiment?: "positive" | "negative" | "neutral"
    intent?: string
    confidence?: number
  }
}

export interface AgentResponse {
  message: string
  intent?: string
  confidence?: number
  suggestedActions?: string[]
  requiresHuman?: boolean
  metadata?: Record<string, any>
}

export interface FeedbackData {
  messageId: string
  rating: "helpful" | "not-helpful"
  comment?: string
  timestamp: Date
  businessId: string
}

export interface WebhookPayload {
  message: string
  userId: string
  sessionId: string
  businessId: string
  businessName: string
  timestamp: string
}

export interface WebhookResponse {
  message: string
  success: boolean
  error?: string
}
