"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, X, Minimize2, Maximize2 } from "lucide-react"

interface ChatMessage {
  text: string
  isUser: boolean
  timestamp: Date
  html?: string
}

export interface ChatWidgetProps {
  businessId?: string
  businessName?: string
  webhookUrl?: string
  position?: "bottom-right" | "bottom-left"
  primaryColor?: string
  secondaryColor?: string
  welcomeMessage?: string
  width?: number
  height?: number
  showTimestamp?: boolean
}

export default function ChatWidget({
  businessId = "default",
  businessName = "Critter Pet Services",
  webhookUrl = "https://jleib03.app.n8n.cloud/webhook/93c29983-1098-4ff9-a3c5-eae58e04fbab",
  position = "bottom-right",
  primaryColor = "#e75837",
  secondaryColor = "#745e25",
  welcomeMessage = "Welcome! How can I help you with your pet care needs today?",
  width = 350,
  height = 500,
  showTimestamp = true,
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
        text: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      },
    ])
  }, [welcomeMessage])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && !minimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, minimized])

  const parseResponseText = (text: string): string => {
    if (!text) return text

    // Convert \n escape sequences to actual line breaks
    let parsed = text.replace(/\\n/g, "\n")

    // Convert markdown bold (**text**) to HTML bold for better display
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    return parsed
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    // Add user message to chat
    const userMessage = {
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    const messageToSend = inputValue
    setInputValue("")
    setIsTyping(true)

    try {
      // Prepare payload with business context - simplified format
      const payload = {
        message: messageToSend.trim(),
        userId: userId,
        sessionId: sessionId,
        businessId: businessId,
        businessName: businessName,
        timestamp: new Date().toISOString(),
      }

      console.log("Sending payload:", payload)

      // Send message to webhook with proper headers
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Response error:", errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      // Parse response
      const data = await response.json()
      console.log("Raw response data:", data)
      console.log("Response data type:", typeof data)
      console.log("Is array:", Array.isArray(data))

      if (Array.isArray(data)) {
        console.log("Array length:", data.length)
        console.log("First item:", data[0])
        if (data[0]) {
          console.log("First item keys:", Object.keys(data[0]))
          console.log("Output property:", data[0].output)
        }
      }

      setIsTyping(false)

      // Handle the specific response format: [{"output": "message text"}]
      let responseText = "I received your message and I'm processing it."

      // More detailed parsing with logging
      if (Array.isArray(data)) {
        console.log("Processing array response")
        if (data.length > 0) {
          console.log("Array has items")
          const firstItem = data[0]
          if (firstItem && typeof firstItem === "object") {
            console.log("First item is an object")
            if ("output" in firstItem) {
              console.log("Found output property:", firstItem.output)
              responseText = firstItem.output
            } else {
              console.log("No output property found, available keys:", Object.keys(firstItem))
            }
          }
        }
      } else if (data && typeof data === "object") {
        console.log("Processing object response")
        if (data.message) {
          console.log("Found message property:", data.message)
          responseText = data.message
        } else if (data.response) {
          console.log("Found response property:", data.response)
          responseText = data.response
        } else if (data.output) {
          console.log("Found output property:", data.output)
          responseText = data.output
        } else {
          console.log("No recognized properties found, available keys:", Object.keys(data))
        }
      } else {
        console.log("Response is not an object or array:", typeof data)
      }

      console.log("Final response text:", responseText)

      // Parse the response text for formatting
      responseText = parseResponseText(responseText)

      // Add bot response to chat
      const botMessage = {
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        html: responseText.includes("<strong>") ? responseText : undefined, // Use HTML if we have formatting
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      setIsTyping(false)

      // Add more specific error message based on error type
      let errorMessage = "Sorry, there was an error processing your request."

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Unable to connect to the chat service. Please check your internet connection and try again."
      } else if (error instanceof Error && error.message.includes("CORS")) {
        errorMessage = "Connection blocked by security policy. Please contact support."
      } else if (error instanceof Error && error.message.includes("HTTP error")) {
        errorMessage = `Server error: ${error.message}. Please try again later.`
      }

      setMessages((prev) => [
        ...prev,
        {
          text: errorMessage,
          isUser: false,
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    setMinimized(false)
  }

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
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
    <div className="fixed z-50">
      {/* Chat button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className={`fixed ${positionStyles[position]} shadow-lg rounded-full p-4 text-white transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
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
          style={{
            width: `${width}px`,
            height: minimized ? "60px" : `${height}px`,
            maxHeight: "80vh",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {/* Chat header */}
          <div
            className="p-4 text-white flex justify-between items-center cursor-pointer"
            style={{ backgroundColor: primaryColor }}
            onClick={minimized ? toggleMinimize : undefined}
          >
            <div className="font-medium truncate">{businessName}</div>
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
                      {msg.html ? (
                        <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.html }}></div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                      )}
                      {showTimestamp && (
                        <div className={`text-xs mt-1 ${msg.isUser ? "text-blue-100" : "text-gray-500"}`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none max-w-[80%]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full typing-dot"></div>
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
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    aria-label="Type your message"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 text-white rounded-r-md focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-50"
                    style={{ backgroundColor: secondaryColor }}
                    disabled={!inputValue.trim()}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
