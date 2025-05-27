"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"

// This is a minimal standalone widget that can be compiled into a single JS file
// for embedding on any website

interface ChatMessage {
  text: string
  isUser: boolean
  timestamp: Date
}

declare global {
  interface Window {
    CritterConfig?: {
      businessId: string
      businessName: string
      webhookUrl: string
      position?: "bottom-right" | "bottom-left"
      primaryColor?: string
      secondaryColor?: string
    }
  }
}

export default function StandaloneWidget() {
  // Get configuration from global variable
  const config = window.CritterConfig || {
    businessId: "default",
    businessName: "Critter Chat",
    webhookUrl: "https://jleib03.app.n8n.cloud/webhook/a4ea3fb7-e89f-4dd8-b0d6-bb2ad7f9a890/chat",
  }

  const businessId = config.businessId
  const businessName = config.businessName
  const webhookUrl = config.webhookUrl
  const position = config.position || "bottom-right"
  const primaryColor = config.primaryColor || "#e75837"
  const secondaryColor = config.secondaryColor || "#745e25"

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userId, setUserId] = useState("")
  const [sessionId, setSessionId] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

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
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Position styles
  const positionStyles = {
    "bottom-right": { right: "20px", bottom: "20px" },
    "bottom-left": { left: "20px", bottom: "20px" },
  }

  // Create styles for the widget
  const styles = {
    chatButton: {
      position: "fixed",
      ...positionStyles[position],
      backgroundColor: primaryColor,
      color: "white",
      borderRadius: "50%",
      width: "60px",
      height: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      zIndex: 9999,
      transition: "transform 0.3s ease",
    },
    chatWindow: {
      position: "fixed",
      ...positionStyles[position],
      width: "350px",
      height: "500px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 9999,
    },
    chatHeader: {
      padding: "15px",
      backgroundColor: primaryColor,
      color: "white",
      fontWeight: 600,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      fontSize: "16px",
    },
    chatBody: {
      flex: 1,
      padding: "15px",
      overflowY: "auto",
      backgroundColor: "#f5f5f5",
    },
    userMessage: {
      alignSelf: "flex-end",
      backgroundColor: "#0084ff",
      color: "white",
      borderRadius: "18px 18px 0 18px",
      padding: "10px 15px",
      maxWidth: "80%",
      marginBottom: "10px",
      wordBreak: "break-word",
    },
    botMessage: {
      alignSelf: "flex-start",
      backgroundColor: "#e5e5ea",
      color: "black",
      borderRadius: "18px 18px 18px 0",
      padding: "10px 15px",
      maxWidth: "80%",
      marginBottom: "10px",
      wordBreak: "break-word",
    },
    inputArea: {
      display: "flex",
      padding: "10px",
      borderTop: "1px solid #e5e5ea",
      backgroundColor: "white",
    },
    textInput: {
      flex: 1,
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "20px",
      marginRight: "10px",
      outline: "none",
    },
    sendButton: {
      backgroundColor: secondaryColor,
      color: "white",
      border: "none",
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    timestamp: {
      fontSize: "10px",
      marginTop: "5px",
      opacity: 0.7,
    },
    typingIndicator: {
      display: "flex",
      padding: "10px 15px",
      backgroundColor: "#e5e5ea",
      borderRadius: "18px 18px 18px 0",
      alignSelf: "flex-start",
      marginBottom: "10px",
      width: "60px",
    },
    typingDot: {
      width: "8px",
      height: "8px",
      backgroundColor: "#999",
      borderRadius: "50%",
      margin: "0 2px",
      animation: "bounce 1.4s infinite ease-in-out",
    },
  }

  return (
    <div id="critter-chat-widget">
      {!isOpen ? (
        <div
          style={styles.chatButton as React.CSSProperties}
          onClick={toggleChat}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <div style={styles.chatWindow as React.CSSProperties}>
          <div style={styles.chatHeader as React.CSSProperties}>
            <div>{businessName}</div>
            <button style={styles.closeButton as React.CSSProperties} onClick={toggleChat}>
              ✕
            </button>
          </div>
          <div style={styles.chatBody as React.CSSProperties}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: msg.isUser ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div style={msg.isUser ? styles.userMessage : (styles.botMessage as React.CSSProperties)}>
                  <div>{msg.text}</div>
                  <div style={styles.timestamp as React.CSSProperties}>{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={styles.typingIndicator as React.CSSProperties}>
                <div
                  style={{
                    ...(styles.typingDot as React.CSSProperties),
                    animationDelay: "0s",
                  }}
                ></div>
                <div
                  style={{
                    ...(styles.typingDot as React.CSSProperties),
                    animationDelay: "0.2s",
                  }}
                ></div>
                <div
                  style={{
                    ...(styles.typingDot as React.CSSProperties),
                    animationDelay: "0.4s",
                  }}
                ></div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>
          <div style={styles.inputArea as React.CSSProperties}>
            <input
              type="text"
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.textInput as React.CSSProperties}
            />
            <button style={styles.sendButton as React.CSSProperties} onClick={handleSendMessage}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
