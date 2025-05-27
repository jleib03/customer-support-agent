"use client"

import { useState } from "react"
import ChatWidget from "./chat-widget"

export default function ChatWidgetDemo() {
  const [businessId, setBusinessId] = useState("22")
  const [businessName, setBusinessName] = useState("Critter Pet Services")
  const [webhookUrl, setWebhookUrl] = useState(
    "https://jleib03.app.n8n.cloud/webhook/93c29983-1098-4ff9-a3c5-eae58e04fbab",
  )
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right")
  const [primaryColor, setPrimaryColor] = useState("#e75837")
  const [secondaryColor, setSecondaryColor] = useState("#745e25")
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome! How can I help you with your pet care needs today?")
  const [width, setWidth] = useState(350)
  const [height, setHeight] = useState(500)
  const [showTimestamp, setShowTimestamp] = useState(true)
  const [showWidget, setShowWidget] = useState(true)

  const handleReset = () => {
    setBusinessId("22")
    setBusinessName("Critter Pet Services")
    setWebhookUrl("https://jleib03.app.n8n.cloud/webhook/93c29983-1098-4ff9-a3c5-eae58e04fbab")
    setPosition("bottom-right")
    setPrimaryColor("#e75837")
    setSecondaryColor("#745e25")
    setWelcomeMessage("Welcome! How can I help you with your pet care needs today?")
    setWidth(350)
    setHeight(500)
    setShowTimestamp(true)
  }

  const handleApply = () => {
    // Force widget to re-render with new settings
    setShowWidget(false)
    setTimeout(() => setShowWidget(true), 10)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Critter Chat Widget</h1>
      <p className="mb-8">
        This is a standalone chat widget that can be embedded on any website. Configure the widget below and see it in
        action.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Widget Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business ID</label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
            <input
              type="text"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 mr-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
            <div className="flex items-center">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 mr-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min="250"
              max="500"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min="300"
              max="700"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Show Timestamps</label>
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Display message timestamps</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button onClick={handleReset} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-white rounded-md hover:bg-opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Apply Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Embedding Code</h2>
        <p className="mb-4">Copy this code to embed the chat widget on your website:</p>
        <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <pre className="text-sm">
            {`<script>
  window.CritterConfig = {
    businessId: "${businessId}",
    businessName: "${businessName}",
    webhookUrl: "${webhookUrl}",
    position: "${position}",
    primaryColor: "${primaryColor}",
    secondaryColor: "${secondaryColor}",
    welcomeMessage: "${welcomeMessage}",
    width: ${width},
    height: ${height},
    showTimestamp: ${showTimestamp}
  };
</script>
<script src="https://cdn.critter.pet/chat-widget.js"></script>`}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Area</h2>
        <p className="mb-4">
          This area simulates a business website where the chat widget is embedded. Click the chat icon in the corner to
          test the widget.
        </p>
        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
          <p className="text-gray-500">Website Content Area</p>
        </div>
      </div>

      {/* The actual chat widget */}
      {showWidget && (
        <ChatWidget
          businessId={businessId}
          businessName={businessName}
          webhookUrl={webhookUrl}
          position={position}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          welcomeMessage={welcomeMessage}
          width={width}
          height={height}
          showTimestamp={showTimestamp}
        />
      )}
    </div>
  )
}
