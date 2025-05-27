import type { WebhookPayload } from "@/types"

export async function testWebhookConnection(
  webhookUrl: string,
  businessId: string,
  businessName: string,
): Promise<boolean> {
  try {
    const testPayload: WebhookPayload = {
      message: "Test connection",
      userId: "test_user",
      sessionId: "test_session",
      businessId,
      businessName,
      timestamp: new Date().toISOString(),
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    })

    return response.ok
  } catch (error) {
    console.error("Webhook test failed:", error)
    return false
  }
}

export function generateWebhookPayload(
  message: string,
  userId: string,
  sessionId: string,
  businessId: string,
  businessName: string,
): WebhookPayload {
  return {
    message,
    userId,
    sessionId,
    businessId,
    businessName,
    timestamp: new Date().toISOString(),
  }
}
