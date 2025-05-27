"use client"

interface ChatMessage {
  text: string
  isUser: boolean
  timestamp: Date
  html?: string
}

interface ChatWidgetConfig {
  businessId: string
  businessName: string
  webhookUrl: string
  position?: "bottom-right" | "bottom-left"
  primaryColor?: string
  secondaryColor?: string
  welcomeMessage?: string
  width?: number
  height?: number
  showTimestamp?: boolean
}

declare global {
  interface Window {
    CritterConfig?: ChatWidgetConfig
  }
}

export default function initCritterChatWidget() {
  // Create container for the widget
  const container = document.createElement("div")
  container.id = "critter-chat-widget-container"
  document.body.appendChild(container)

  // Get configuration from global variable
  const config = window.CritterConfig || {
    businessId: "default",
    businessName: "Critter Chat",
    webhookUrl: "https://jleib03.app.n8n.cloud/webhook-test/93c29983-1098-4ff9-a3c5-eae58e04fbab",
  }

  // Create and render the widget
  renderChatWidget(container, config)
}

function renderChatWidget(container: HTMLElement, config: ChatWidgetConfig) {
  const {
    businessId = "default",
    businessName = "Critter Pet Services",
    webhookUrl,
    position = "bottom-right",
    primaryColor = "#e75837",
    secondaryColor = "#745e25",
    welcomeMessage = "Welcome! How can I help you with your pet care needs today?",
    width = 350,
    height = 500,
    showTimestamp = true,
  } = config

  // State variables
  let isOpen = false
  const messages: ChatMessage[] = []
  let inputValue = ""
  let isTyping = false
  const userId = `user_${Math.random().toString(36).substring(2, 10)}`
  const sessionId = `session_${Math.random().toString(36).substring(2, 15)}`
  let minimized = false

  // Add welcome message
  messages.push({
    text: welcomeMessage,
    isUser: false,
    timestamp: new Date(),
  })

  // Parse response text to handle formatting
  function parseResponseText(text: string): string {
    if (!text) return text

    // Convert \n escape sequences to actual line breaks
    let parsed = text.replace(/\\n/g, "\n")

    // Convert markdown bold (**text**) to HTML bold for better display
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    return parsed
  }

  // Create styles
  const styles = document.createElement("style")
  styles.textContent = `
    #critter-chat-button {
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      background-color: ${primaryColor};
      color: white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 9999;
      transition: transform 0.3s ease;
    }
    #critter-chat-button:hover {
      transform: scale(1.1);
    }
    #critter-chat-window {
      position: fixed;
      ${position === "bottom-right" ? "right: 20px;" : "left: 20px;"}
      bottom: 20px;
      width: ${width}px;
      height: ${minimized ? "60px" : height + "px"};
      max-height: 80vh;
      max-width: calc(100vw - 32px);
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
    }
    #critter-chat-header {
      padding: 15px;
      background-color: ${primaryColor};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: ${minimized ? "pointer" : "default"};
    }
    .critter-chat-header-buttons {
      display: flex;
      align-items: center;
    }
    .critter-chat-header-button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      margin-left: 10px;
    }
    #critter-chat-body {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background-color: #f5f5f5;
      display: ${minimized ? "none" : "block"};
    }
    .critter-message-container {
      display: flex;
      margin-bottom: 15px;
    }
    .critter-user-message-container {
      justify-content: flex-end;
    }
    .critter-bot-message-container {
      justify-content: flex-start;
    }
    .critter-message {
      max-width: 80%;
      padding: 10px 15px;
      border-radius: 10px;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .critter-user-message {
      background-color: #0084ff;
      color: white;
      border-bottom-right-radius: 0;
    }
    .critter-bot-message {
      background-color: #e5e5ea;
      color: black;
      border-bottom-left-radius: 0;
    }
    .critter-message-timestamp {
      font-size: 10px;
      margin-top: 5px;
      opacity: 0.7;
    }
    .critter-typing-indicator {
      display: flex;
      padding: 10px 15px;
      background-color: #e5e5ea;
      border-radius: 10px;
      border-bottom-left-radius: 0;
      align-self: flex-start;
      margin-bottom: 15px;
      width: 60px;
    }
    .critter-typing-dot {
      width: 8px;
      height: 8px;
      background-color: #999;
      border-radius: 50%;
      margin: 0 2px;
      animation: critterBounce 1.4s infinite ease-in-out;
    }
    .critter-typing-dot:nth-child(1) {
      animation-delay: 0s;
    }
    .critter-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .critter-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes critterBounce {
      0%, 80%, 100% { 
        transform: translateY(0);
      }
      40% { 
        transform: translateY(-5px);
      }
    }
    #critter-chat-input-area {
      display: flex;
      padding: 10px;
      border-top: 1px solid #e5e5ea;
      background-color: white;
      display: ${minimized ? "none" : "flex"};
    }
    #critter-chat-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 20px;
      margin-right: 10px;
      outline: none;
    }
    #critter-chat-send-button {
      background-color: ${secondaryColor};
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    #critter-chat-send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `
  document.head.appendChild(styles)

  // Render function
  function render() {
    container.innerHTML = ""

    if (!isOpen) {
      // Render chat button
      const button = document.createElement("div")
      button.id = "critter-chat-button"
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      `
      button.addEventListener("click", toggleChat)
      container.appendChild(button)
    } else {
      // Render chat window
      const chatWindow = document.createElement("div")
      chatWindow.id = "critter-chat-window"

      // Header
      const header = document.createElement("div")
      header.id = "critter-chat-header"
      header.innerHTML = `
        <div>${businessName}</div>
        <div class="critter-chat-header-buttons">
          ${
            minimized
              ? `<button class="critter-chat-header-button critter-maximize-button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>`
              : `<button class="critter-chat-header-button critter-minimize-button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>`
          }
          <button class="critter-chat-header-button critter-close-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `
      if (minimized) {
        header.addEventListener("click", toggleMinimize)
      }
      chatWindow.appendChild(header)

      // Body
      const body = document.createElement("div")
      body.id = "critter-chat-body"

      // Messages
      messages.forEach((msg) => {
        const messageContainer = document.createElement("div")
        messageContainer.className = `critter-message-container ${msg.isUser ? "critter-user-message-container" : "critter-bot-message-container"}`

        const messageElement = document.createElement("div")
        messageElement.className = `critter-message ${msg.isUser ? "critter-user-message" : "critter-bot-message"}`

        if (msg.html) {
          messageElement.innerHTML = msg.html
        } else {
          messageElement.textContent = msg.text
        }

        if (showTimestamp) {
          const timestamp = document.createElement("div")
          timestamp.className = "critter-message-timestamp"
          timestamp.textContent = formatTime(msg.timestamp)
          messageElement.appendChild(timestamp)
        }

        messageContainer.appendChild(messageElement)
        body.appendChild(messageContainer)
      })

      // Typing indicator
      if (isTyping) {
        const typingContainer = document.createElement("div")
        typingContainer.className = "critter-message-container critter-bot-message-container"

        const typingIndicator = document.createElement("div")
        typingIndicator.className = "critter-typing-indicator"
        typingIndicator.innerHTML = `
          <div class="critter-typing-dot"></div>
          <div class="critter-typing-dot"></div>
          <div class="critter-typing-dot"></div>
        `

        typingContainer.appendChild(typingIndicator)
        body.appendChild(typingContainer)
      }

      chatWindow.appendChild(body)

      // Input area
      const inputArea = document.createElement("div")
      inputArea.id = "critter-chat-input-area"

      const input = document.createElement("input")
      input.id = "critter-chat-input"
      input.type = "text"
      input.placeholder = "Type your message..."
      input.value = inputValue
      input.addEventListener("input", (e) => {
        inputValue = (e.target as HTMLInputElement).value
      })
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          handleSendMessage()
        }
      })

      const sendButton = document.createElement("button")
      sendButton.id = "critter-chat-send-button"
      sendButton.disabled = !inputValue.trim()
      sendButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      `
      sendButton.addEventListener("click", handleSendMessage)

      inputArea.appendChild(input)
      inputArea.appendChild(sendButton)
      chatWindow.appendChild(inputArea)

      container.appendChild(chatWindow)

      // Add event listeners
      document.querySelector(".critter-close-button")?.addEventListener("click", toggleChat)
      document.querySelector(".critter-minimize-button")?.addEventListener("click", toggleMinimize)
      document.querySelector(".critter-maximize-button")?.addEventListener("click", toggleMinimize)

      // Focus input
      if (!minimized) {
        setTimeout(() => {
          const inputElement = document.getElementById("critter-chat-input")
          if (inputElement) {
            inputElement.focus()
          }
        }, 100)
      }

      // Scroll to bottom
      const bodyElement = document.getElementById("critter-chat-body")
      if (bodyElement) {
        bodyElement.scrollTop = bodyElement.scrollHeight
      }
    }
  }

  // Toggle chat open/closed
  function toggleChat() {
    isOpen = !isOpen
    minimized = false
    render()
  }

  // Toggle minimize/maximize
  function toggleMinimize(e?: Event) {
    if (e) {
      e.stopPropagation()
    }
    minimized = !minimized
    render()
  }

  // Format time
  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Send message
  async function handleSendMessage() {
    if (!inputValue.trim()) return

    // Add user message
    messages.push({
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    })

    const messageSent = inputValue
    inputValue = ""
    isTyping = true
    render()

    try {
      // Prepare payload - simplified format
      const payload = {
        message: messageSent.trim(),
        userId: userId,
        sessionId: sessionId,
        businessId: businessId,
        businessName: businessName,
        timestamp: new Date().toISOString(),
      }

      console.log("Sending payload:", payload)

      // Send message to webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
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

      isTyping = false

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

      responseText = parseResponseText(responseText)

      // Add bot response
      messages.push({
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        html: responseText.includes("<strong>") ? responseText : undefined,
      })
    } catch (error) {
      console.error("Error sending message:", error)
      isTyping = false

      // Add error message with more specific details
      let errorMessage = "Sorry, there was an error processing your request."

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Unable to connect to the chat service. Please check your internet connection."
      } else if (error instanceof Error && error.message.includes("HTTP error")) {
        errorMessage = `Server error. Please try again later.`
      }

      messages.push({
        text: errorMessage,
        isUser: false,
        timestamp: new Date(),
      })
    }

    render()
  }

  // Initial render
  render()
}

// Export a function to initialize the widget
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    initCritterChatWidget()
  })
}
