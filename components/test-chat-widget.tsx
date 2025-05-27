"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, X, Minimize2, Maximize2 } from "lucide-react"

interface ChatMessage {
  text: string
  isUser: boolean
  timestamp: Date
}

interface ChatWidgetProps {
  businessId?: string
  businessName?: string
  webhookUrl?: string
  position?: "bottom-right" | "bottom-left"
  primaryColor?: string
  secondaryColor?: string
}

export default function TestChatWidget({
  businessId = "22",
  businessName = "Critter Dog Walking, Grooming STAGE",
  webhookUrl = "https://jleib03.app.n8n.cloud/webhook/a4ea3fb7-e89f-4dd8-b0d6-bb2ad7f9a890/chat",
  position = "bottom-right",
  primaryColor = "#e75837",
  secondaryColor = "#745e25",
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userId, setUserId] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [minimized, setMinimized] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate a unique user ID and session ID on component mount
  useEffect(() => {
    const newUserId = `user_${Math.random().toString(36).substring(2, 10)}`
    const newSessionId = `session_${Math.random().toString(36).substring(2, 15)}`
    setUserId(newUserId)
    setSessionId(newSessionId)

    // Add welcome message
    setMessages([
      {
        text: `Welcome to ${businessName}! How can I help you today?`,
        isUser: false,
        timestamp: new Date(),
      },
    ])
  }, [businessName])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message to chat
    const userMessage = {
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Prepare payload with business context
      const payload = {
        message: inputValue.trim(),
        userId: userId,
        sessionId: sessionId,
        businessContext: {
          businessId: businessId,
          businessName: businessName,
        },
        timestamp: new Date().toISOString(),
      }

      // Send message to webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Parse response
      const data = await response.json()
      setIsTyping(false)

      // Add bot response to chat
      const botMessage = {
        text: data.message || data.response || "I'm not sure how to respond to that.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setIsTyping(false)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, there was an error processing your request. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setMinimized(false)
  }

  const toggleMinimize = () => {
    setMinimized(!minimized)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Position styles
  const positionStyles = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }

  return (
    <div className="fixed z-50" style={{ fontFamily: "var(--font-body)" }}>
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed shadow-lg rounded-full p-4 text-white transition-all duration-300 hover:scale-110 focus:outline-none"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
          data-testid="chat-button"
          data-business-id={businessId}
          data-business-name={businessName}
          className={`${positionStyles[position]}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed ${positionStyles[position]} bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 flex flex-col`}
          style={{ width: "350px", height: minimized ? "60px" : "500px", maxHeight: "80vh" }}
          data-testid="chat-window"
        >
          {/* Chat header */}
          <div
            className="p-4 text-white flex justify-between items-center cursor-pointer"
            style={{ backgroundColor: primaryColor }}
            onClick={toggleMinimize}
          >
            <div className="font-medium header-font">{businessName}</div>
            <div className="flex items-center">
              {minimized ? (
                <Maximize2 size={18} className="cursor-pointer mr-2" onClick={toggleMinimize} />
              ) : (
                <Minimize2 size={18} className="cursor-pointer mr-2" onClick={toggleMinimize} />
              )}
              <X size={18} className="cursor-pointer" onClick={toggleChat} />
            </div>
          </div>

          {/* Chat body - hidden when minimized */}
          {!minimized && (
            <>
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.map((msg, index) => (
                  <div key={index} className={`mb-4 flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.isUser
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <div className="text-sm">{msg.text}</div>
                      <div className={`text-xs mt-1 ${msg.isUser ? "text-blue-100" : "text-gray-500"}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-[80%]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex">
                  <input
                    type="text"
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 text-white rounded-r-md focus:outline-none"
                    style={{ backgroundColor: secondaryColor }}
                    disabled={!inputValue.trim()}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  <span>Business ID: {businessId}</span>
                  <span className="mx-2">•</span>
                  <span>Session: {sessionId.substring(0, 8)}...</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
