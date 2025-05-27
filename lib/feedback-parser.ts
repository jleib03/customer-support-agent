import type { ChatMessage, FeedbackData } from "@/types"

export interface ParsedFeedback {
  sentiment: "positive" | "negative" | "neutral"
  topics: string[]
  actionItems: string[]
  urgency: "low" | "medium" | "high"
  summary: string
}

export interface ConversationAnalytics {
  totalMessages: number
  averageResponseTime: number
  sentimentDistribution: Record<string, number>
  commonIntents: Record<string, number>
  satisfactionScore: number
  escalationRate: number
}

export class FeedbackParser {
  static parseFeedback(messages: ChatMessage[], feedback: FeedbackData[]): ParsedFeedback {
    const allContent = messages.map((m) => m.content).join(" ")

    // Simple sentiment analysis
    const sentiment = this.analyzeSentiment(allContent)

    // Extract topics
    const topics = this.extractTopics(allContent)

    // Generate action items
    const actionItems = this.generateActionItems(messages, feedback)

    // Determine urgency
    const urgency = this.calculateUrgency(messages, feedback)

    // Create summary
    const summary = this.generateSummary(messages, sentiment, topics)

    return {
      sentiment,
      topics,
      actionItems,
      urgency,
      summary,
    }
  }

  static analyzeConversation(messages: ChatMessage[], feedback: FeedbackData[]): ConversationAnalytics {
    const totalMessages = messages.length

    // Calculate average response time (simplified)
    const averageResponseTime = this.calculateAverageResponseTime(messages)

    // Sentiment distribution
    const sentimentDistribution = this.calculateSentimentDistribution(messages)

    // Common intents
    const commonIntents = this.calculateCommonIntents(messages)

    // Satisfaction score based on feedback
    const satisfactionScore = this.calculateSatisfactionScore(feedback)

    // Escalation rate
    const escalationRate = this.calculateEscalationRate(messages)

    return {
      totalMessages,
      averageResponseTime,
      sentimentDistribution,
      commonIntents,
      satisfactionScore,
      escalationRate,
    }
  }

  private static analyzeSentiment(content: string): "positive" | "negative" | "neutral" {
    const positiveWords = ["great", "excellent", "amazing", "wonderful", "fantastic", "love", "perfect", "awesome"]
    const negativeWords = ["terrible", "awful", "horrible", "hate", "worst", "bad", "disappointed", "frustrated"]

    const lowerContent = content.toLowerCase()
    const positiveCount = positiveWords.filter((word) => lowerContent.includes(word)).length
    const negativeCount = negativeWords.filter((word) => lowerContent.includes(word)).length

    if (positiveCount > negativeCount) return "positive"
    if (negativeCount > positiveCount) return "negative"
    return "neutral"
  }

  private static extractTopics(content: string): string[] {
    const topicKeywords = {
      booking: ["book", "appointment", "schedule", "reserve"],
      pricing: ["price", "cost", "fee", "charge", "expensive", "cheap"],
      services: ["service", "grooming", "walking", "boarding", "training"],
      staff: ["staff", "employee", "worker", "person", "team"],
      quality: ["quality", "professional", "clean", "dirty", "good", "bad"],
      timing: ["time", "late", "early", "punctual", "schedule", "hours"],
    }

    const lowerContent = content.toLowerCase()
    const topics: string[] = []

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some((keyword) => lowerContent.includes(keyword))) {
        topics.push(topic)
      }
    })

    return topics
  }

  private static generateActionItems(messages: ChatMessage[], feedback: FeedbackData[]): string[] {
    const actionItems: string[] = []

    // Check for negative feedback
    const negativeFeedback = feedback.filter((f) => f.rating === "not-helpful")
    if (negativeFeedback.length > 0) {
      actionItems.push("Review and improve responses that received negative feedback")
    }

    // Check for escalation requests
    const escalationMessages = messages.filter(
      (m) =>
        m.content.toLowerCase().includes("manager") ||
        m.content.toLowerCase().includes("human") ||
        m.metadata?.requiresHuman,
    )
    if (escalationMessages.length > 0) {
      actionItems.push("Follow up on escalation requests")
    }

    // Check for booking requests
    const bookingMessages = messages.filter((m) => m.metadata?.intent === "booking")
    if (bookingMessages.length > 0) {
      actionItems.push("Ensure booking requests were properly handled")
    }

    return actionItems
  }

  private static calculateUrgency(messages: ChatMessage[], feedback: FeedbackData[]): "low" | "medium" | "high" {
    let urgencyScore = 0

    // Negative feedback increases urgency
    const negativeFeedback = feedback.filter((f) => f.rating === "not-helpful").length
    urgencyScore += negativeFeedback * 2

    // Escalation requests increase urgency
    const escalations = messages.filter((m) => m.metadata?.requiresHuman).length
    urgencyScore += escalations * 3

    // Complaint intent increases urgency
    const complaints = messages.filter((m) => m.metadata?.intent === "complaint").length
    urgencyScore += complaints * 2

    if (urgencyScore >= 5) return "high"
    if (urgencyScore >= 2) return "medium"
    return "low"
  }

  private static generateSummary(messages: ChatMessage[], sentiment: string, topics: string[]): string {
    const userMessages = messages.filter((m) => m.role === "user").length
    const assistantMessages = messages.filter((m) => m.role === "assistant").length

    let summary = `Conversation with ${userMessages} user messages and ${assistantMessages} assistant responses. `
    summary += `Overall sentiment: ${sentiment}. `

    if (topics.length > 0) {
      summary += `Main topics discussed: ${topics.join(", ")}.`
    }

    return summary
  }

  private static calculateAverageResponseTime(messages: ChatMessage[]): number {
    // Simplified calculation - in real implementation, you'd track actual response times
    return 2.5 // seconds
  }

  private static calculateSentimentDistribution(messages: ChatMessage[]): Record<string, number> {
    const distribution = { positive: 0, negative: 0, neutral: 0 }

    messages.forEach((message) => {
      const sentiment = this.analyzeSentiment(message.content)
      distribution[sentiment]++
    })

    return distribution
  }

  private static calculateCommonIntents(messages: ChatMessage[]): Record<string, number> {
    const intents: Record<string, number> = {}

    messages.forEach((message) => {
      const intent = message.metadata?.intent
      if (intent) {
        intents[intent] = (intents[intent] || 0) + 1
      }
    })

    return intents
  }

  private static calculateSatisfactionScore(feedback: FeedbackData[]): number {
    if (feedback.length === 0) return 0

    const helpfulCount = feedback.filter((f) => f.rating === "helpful").length
    return (helpfulCount / feedback.length) * 100
  }

  private static calculateEscalationRate(messages: ChatMessage[]): number {
    const totalMessages = messages.length
    const escalations = messages.filter((m) => m.metadata?.requiresHuman).length

    return totalMessages > 0 ? (escalations / totalMessages) * 100 : 0
  }
}
