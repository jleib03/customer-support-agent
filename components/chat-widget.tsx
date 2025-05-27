"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, User, Bot, ExternalLink } from "lucide-react"
import { CritterAIAgent } from "@/lib/ai-agent"
import { FeedbackParser } from "@/lib/feedback-parser"
import type { CritterConfig, ChatMessage, FeedbackData } from "@/types"

interface ChatWidgetProps {
  config: CritterConfig
  onFeedback?: (feedback: FeedbackData) => void
  onAnalytics?: (analytics: any) => void
}

// Component to render formatted message content with clickable links
function MessageContent({ content }: { content: string }) {
  // URL detection regex
  const urlRegex =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?)/g

  // Function to normalize URLs for Critter domains
  const normalizeUrl = (url: string) => {
    // If it's a critter.pet/booking URL, convert it to booking.critter.pet
    if (url.includes("critter.pet/booking")) {
      return "booking.critter.pet"
    }
    return url
  }

  // Function to process text and convert URLs to clickable links
  const processTextWithLinks = (text: string) => {
    const parts = []
    let lastIndex = 0
    let match

    // Reset regex
    urlRegex.lastIndex = 0

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      const url = match[0]

      // Normalize the URL for display
      const normalizedUrl = normalizeUrl(url)

      // Ensure URL has protocol for href
      let href = normalizedUrl
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        href = `https://${normalizedUrl}`
      }

      // Add the clickable link
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 underline hover:text-blue-200 inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {normalizedUrl}
          <ExternalLink className="w-3 h-3" />
        </a>,
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after the last URL
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : [text]
  }

  // Split content by line breaks and render each line
  const lines = content.split("\n")

  return (
    <div className="text-sm">
      {lines.map((line, index) => {
        // Handle empty lines
        if (line.trim() === "") {
          return <br key={index} />
        }

        // Handle bullet points
        if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
          const bulletText = line.replace(/^[•-]\s*/, "")
          return (
            <div key={index} className="flex items-start space-x-2 my-1">
              <span className="text-xs mt-1">•</span>
              <span>{processTextWithLinks(bulletText)}</span>
            </div>
          )
        }

        // Handle numbered lists
        if (/^\d+\.\s/.test(line.trim())) {
          return (
            <div key={index} className="my-1">
              {processTextWithLinks(line)}
            </div>
          )
        }

        // Regular line with link processing
        return (
          <div key={index} className="my-1">
            {processTextWithLinks(line)}
          </div>
        )
      })}
    </div>
  )
}

export default function ChatWidget({ config, onFeedback, onAnalytics }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 8)}`)
  const [feedback, setFeedback] = useState<FeedbackData[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const agentRef = useRef<CritterAIAgent | null>(null)

  useEffect(() => {
    agentRef.current = new CritterAIAgent(config)

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      content: config.welcomeMessage,
      role: "assistant",
      timestamp: new Date(),
      metadata: { businessId: config.businessId, sessionId },
    }
    setMessages([welcomeMessage])
  }, [config, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !agentRef.current) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
      metadata: { businessId: config.businessId, sessionId },
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await agentRef.current.generateResponse(inputValue.trim(), sessionId, userId)

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        content: response.message,
        role: "assistant",
        timestamp: new Date(),
        metadata: {
          businessId: config.businessId,
          sessionId,
          intent: response.intent,
          confidence: response.confidence,
          requiresHuman: response.requiresHuman,
        },
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Generate analytics
      if (onAnalytics) {
        const analytics = FeedbackParser.analyzeConversation([...messages, userMessage, assistantMessage], feedback)
        onAnalytics(analytics)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        metadata: { businessId: config.businessId, sessionId },
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleFeedback = (messageId: string, rating: "helpful" | "not-helpful") => {
    const feedbackData: FeedbackData = {
      messageId,
      rating,
      timestamp: new Date(),
      businessId: config.businessId,
    }

    setFeedback((prev) => [...prev, feedbackData])

    if (onFeedback) {
      onFeedback(feedbackData)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }

  return (
    <div className={`fixed ${positionClasses[config.position]} z-50`}>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
          style={{ backgroundColor: config.primaryColor }}
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      )}

      {isOpen && (
        <Card
          className="shadow-2xl border-0 overflow-hidden flex flex-col"
          style={{ width: config.width, height: config.height }}
        >
          <CardHeader
            className="p-4 text-white flex flex-row items-center justify-between"
            style={{ backgroundColor: config.primaryColor }}
          >
            <div>
              <h3 className="font-semibold text-lg">{config.businessName}</h3>
              <p className="text-sm opacity-90">Chat with us!</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col" style={{ height: `${config.height - 80}px` }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-gray-300" : "text-white"
                      }`}
                      style={message.role === "assistant" ? { backgroundColor: config.primaryColor } : {}}
                    >
                      {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col">
                      <div
                        className={`rounded-lg p-3 ${message.role === "user" ? "bg-white border" : "text-white"}`}
                        style={message.role === "assistant" ? { backgroundColor: config.secondaryColor } : {}}
                      >
                        {message.role === "assistant" ? (
                          <MessageContent content={message.content} />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                      {config.showTimestamp && (
                        <span className="text-xs text-gray-500 mt-1 px-1">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {message.role === "assistant" && message.id !== "welcome" && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, "helpful")}
                            className="text-gray-500 hover:text-green-600 p-1"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFeedback(message.id, "not-helpful")}
                            className="text-gray-500 hover:text-red-600 p-1"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && config.enableTypingIndicator && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="rounded-lg p-3 text-white" style={{ backgroundColor: config.secondaryColor }}>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-white rounded-full typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  style={{ backgroundColor: config.primaryColor }}
                  className="text-white hover:opacity-90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
