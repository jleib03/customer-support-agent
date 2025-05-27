"use client"

import { useEffect } from "react"

export default function StandalonePage() {
  useEffect(() => {
    // Define the global configuration
    window.CritterConfig = {
      businessId: "22",
      businessName: "Critter Pet Services",
      webhookUrl: "https://jleib03.app.n8n.cloud/webhook/93c29983-1098-4ff9-a3c5-eae58e04fbab",
      position: "bottom-right",
      primaryColor: "#e75837",
      secondaryColor: "#745e25",
      welcomeMessage: "Welcome to Critter Pet Services! How can I help you today?",
      width: 350,
      height: 500,
      showTimestamp: true,
    }

    // Dynamically import the standalone widget
    import("@/lib/standalone-widget").then((module) => {
      const initCritterChatWidget = module.default
      initCritterChatWidget()
    })
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Standalone Widget Test Page</h1>
      <p className="mb-8">
        This page demonstrates the standalone widget script that can be embedded on any website. The widget is loaded
        dynamically and configured via the global CritterConfig object.
      </p>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <p className="mb-4">The standalone widget is designed to be embedded on any website with minimal setup:</p>
        <ol className="list-decimal ml-6 mb-4 space-y-2">
          <li>Add the configuration object to your website</li>
          <li>Include the widget script</li>
          <li>The widget will automatically initialize when the page loads</li>
        </ol>
        <p>
          The widget is fully customizable through the configuration object and handles all communication with your
          webhook endpoint.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Embedding Code</h2>
        <p className="mb-4">Copy this code to embed the chat widget on your website:</p>
        <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <pre className="text-sm">
            {`<script>
  window.CritterConfig = {
    businessId: "22",
    businessName: "Critter Pet Services",
    webhookUrl: "https://jleib03.app.n8n.cloud/webhook/93c29983-1098-4ff9-a3c5-eae58e04fbab",
    position: "bottom-right",
    primaryColor: "#e75837",
    secondaryColor: "#745e25",
    welcomeMessage: "Welcome to Critter Pet Services! How can I help you today?",
    width: 350,
    height: 500,
    showTimestamp: true
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
    </div>
  )
}
