import type { Agent } from "@/types"

export const fallbackConfig: Agent = {
  businessId: "demo",
  businessName: "Demo Business",
  webhookUrl: "https://example.com/webhook",
  position: "bottom-right",
  primaryColor: "#3b82f6",
  secondaryColor: "#1e40af",
  welcomeMessage: "Hello! How can I help you today?",
  width: 350,
  height: 500,
  showTimestamp: true,
  enableTypingIndicator: true,
}

export const defaultConfig = fallbackConfig

export function validateConfig(config: Partial<Agent>): Agent {
  return {
    ...fallbackConfig,
    ...config,
  }
}

export function isValidWebhookUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith("http://") || url.startsWith("https://")
  } catch {
    return false
  }
}
