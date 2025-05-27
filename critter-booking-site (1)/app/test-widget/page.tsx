"use client"

import { useState } from "react"
import TestChatWidget from "@/components/test-chat-widget"

export default function TestWidgetPage() {
  const [businessId, setBusinessId] = useState("22")
  const [businessName, setBusinessName] = useState("Critter Dog Walking, Grooming STAGE")
  const [webhookUrl, setWebhookUrl] = useState(
    "https://jleib03.app.n8n.cloud/webhook/a4ea3fb7-e89f-4dd8-b0d6-bb2ad7f9a890/chat",
  )
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right")
  const [primaryColor, setPrimaryColor] = useState("#e75837")
  const [secondaryColor, setSecondaryColor] = useState("#745e25")
  const [showWidget, setShowWidget] = useState(true)

  const handleReset = () => {
    setBusinessId("22")
    setBusinessName("Critter Dog Walking, Grooming STAGE")
    setWebhookUrl("https://jleib03.app.n8n.cloud/webhook/a4ea3fb7-e89f-4dd8-b0d6-bb2ad7f9a890/chat")
    setPosition("bottom-right")
    setPrimaryColor("#e75837")
    setSecondaryColor("#745e25")
  }

  const handleApply = () => {
    // Force widget to re-render with new settings
    setShowWidget(false)
    setTimeout(() => setShowWidget(true), 10)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 title-font">Chat Widget Test Environment</h1>
      <p className="mb-8 body-font">
        Use this page to test the chat widget with different business contexts and configurations.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 header-font">Widget Configuration</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 header-font">Business ID</label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md body-font"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 header-font">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md body-font"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 header-font">Webhook URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md body-font"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 header-font">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
              className="w-full p-2 border border-gray-300 rounded-md body-font"
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 header-font">Primary Color</label>
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
                className="flex-1 p-2 border border-gray-300 rounded-md body-font"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 header-font">Secondary Color</label>
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
                className="flex-1 p-2 border border-gray-300 rounded-md body-font"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 body-font"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-white rounded-md hover:bg-opacity-90 body-font"
            style={{ backgroundColor: primaryColor }}
          >
            Apply Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 header-font">Embedding Code</h2>
        <p className="mb-4 body-font">Copy this code to embed the chat widget on your website:</p>
        <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <pre className="text-sm">
            {`<script>
  window.CritterConfig = {
    businessId: "${businessId}",
    businessName: "${businessName}",
    webhookUrl: "${webhookUrl}",
    position: "${position}",
    primaryColor: "${primaryColor}",
    secondaryColor: "${secondaryColor}"
  };
</script>
<script src="https://your-cdn.com/critter-chat-widget.js"></script>`}
          </pre>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 header-font">Test Area</h2>
        <p className="mb-4 body-font">
          This area simulates a business website where the chat widget is embedded. Click the chat icon in the corner to
          test the widget.
        </p>
        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
          <p className="text-gray-500 body-font">Website Content Area</p>
        </div>
      </div>

      {/* The actual chat widget */}
      {showWidget && (
        <TestChatWidget
          businessId={businessId}
          businessName={businessName}
          webhookUrl={webhookUrl}
          position={position}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}
    </div>
  )
}
