"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import ChatWidget from "@/components/chat-widget"
import AdminDashboard from "@/components/admin-dashboard"
import type { CritterConfig, FeedbackData } from "@/types"
import { ApiClient } from "@/lib/api-client"

// Fallback configuration
const fallbackConfig: CritterConfig = {
  businessId: "demo-pet-services",
  businessName: "Critter Pet Services",
  webhookUrl: "https://jleib03.app.n8n.cloud/webhook-test/803d260b-1b17-4abf-8079-2d40225c29b0",
  position: "bottom-right",
  primaryColor: "#e75837",
  secondaryColor: "#745e25",
  welcomeMessage: "Welcome to Critter Pet Services! How can I help you today?",
  width: 350,
  height: 500,
  showTimestamp: true,
  enableTypingIndicator: true,
}

export default function Home() {
  const [configs, setConfigs] = useState<CritterConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<CritterConfig | null>(null)
  const [previewConfig, setPreviewConfig] = useState<CritterConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDatabaseAvailable, setIsDatabaseAvailable] = useState(true)
  const [dbStatus, setDbStatus] = useState<{
    status: string
    message: string
    canConnect: boolean
    isReal: boolean
  } | null>(null)

  // Check database status first
  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/db-status")
      const status = await response.json()
      setDbStatus(status)

      if (status.canConnect) {
        setIsDatabaseAvailable(true)
        loadConfigs()
      } else {
        setIsDatabaseAvailable(false)
        setConfigs([fallbackConfig])
        setSelectedConfig(fallbackConfig)
        setError(`Database: ${status.message}`)
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error checking database status:", error)
      setIsDatabaseAvailable(false)
      setConfigs([fallbackConfig])
      setSelectedConfig(fallbackConfig)
      setError("Cannot connect to database - using demo mode")
      setIsLoading(false)
    }
  }

  const loadConfigs = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const agents = await ApiClient.getAgents()
      setConfigs(agents)

      if (agents.length > 0) {
        setSelectedConfig(agents[0])
      } else {
        setSelectedConfig(fallbackConfig)
      }
    } catch (error) {
      console.error("Error loading configurations:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load configurations"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigUpdate = useCallback(async (updatedConfig: CritterConfig) => {
    try {
      setError(null)
      const updated = await ApiClient.updateAgent(updatedConfig.businessId, updatedConfig)
      setConfigs((prev) => prev.map((config) => (config.businessId === updated.businessId ? updated : config)))
      setSelectedConfig(updated)
      setPreviewConfig(null)
    } catch (error) {
      console.error("Error updating configuration:", error)
      setError(error instanceof Error ? error.message : "Failed to update configuration")
    }
  }, [])

  const handleConfigCreate = useCallback(async (newConfig: CritterConfig) => {
    try {
      setError(null)
      const created = await ApiClient.createAgent(newConfig)
      setConfigs((prev) => [...prev, created])
      setSelectedConfig(created)
      setPreviewConfig(null)
    } catch (error) {
      console.error("Error creating configuration:", error)
      setError(error instanceof Error ? error.message : "Failed to create configuration")
    }
  }, [])

  const handleConfigDelete = useCallback(
    async (configToDelete: CritterConfig) => {
      try {
        setError(null)
        await ApiClient.deleteAgent(configToDelete.businessId)

        setConfigs((prev) => {
          const newConfigs = prev.filter((config) => config.businessId !== configToDelete.businessId)
          if (selectedConfig?.businessId === configToDelete.businessId) {
            const newSelected = newConfigs[0] || null
            setSelectedConfig(newSelected)
          }
          return newConfigs
        })
        setPreviewConfig(null)
      } catch (error) {
        console.error("Error deleting configuration:", error)
        setError(error instanceof Error ? error.message : "Failed to delete configuration")
      }
    },
    [selectedConfig],
  )

  const handleConfigPreview = useCallback((previewData: Partial<CritterConfig>) => {
    setSelectedConfig((currentSelected) => {
      if (currentSelected) {
        const merged = { ...currentSelected, ...previewData } as CritterConfig
        setPreviewConfig(merged)
        return currentSelected
      }
      return currentSelected
    })
  }, [])

  const handleConfigSelect = useCallback((config: CritterConfig) => {
    setSelectedConfig(config)
    setPreviewConfig(null)
  }, [])

  const handleFeedback = useCallback((feedback: FeedbackData) => {
    console.log("Feedback received:", feedback)
  }, [])

  const handleAnalytics = useCallback((analytics: any) => {
    console.log("Analytics data:", analytics)
  }, [])

  const handleExportConfigs = useCallback(() => {
    try {
      const dataStr = JSON.stringify(configs, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `critter-chat-configs-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting configurations:", error)
      setError("Failed to export configurations")
    }
  }, [configs])

  const handleImportConfigs = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setError(null)
        const importedConfigs = JSON.parse(e.target?.result as string) as CritterConfig[]

        for (const config of importedConfigs) {
          try {
            await ApiClient.createAgent(config)
          } catch (error) {
            console.warn(`Failed to import agent ${config.businessId}:`, error)
          }
        }
        await loadConfigs()
      } catch (error) {
        console.error("Error importing configurations:", error)
        setError("Error importing configurations. Please check the file format.")
      }
    }
    reader.readAsText(file)
    event.target.value = ""
  }, [])

  const activeConfig = previewConfig || selectedConfig

  const getStatusMessage = () => {
    if (!dbStatus) return "Checking database..."

    if (dbStatus.isReal) {
      return "✅ Connected to PostgreSQL database"
    } else if (dbStatus.canConnect) {
      return "🔄 Using mock database (v0 environment)"
    } else {
      return "⚠️ Database not available"
    }
  }

  const getStatusColor = () => {
    if (!dbStatus) return "text-gray-600"

    if (dbStatus.isReal) {
      return "text-green-600"
    } else if (dbStatus.canConnect) {
      return "text-blue-600"
    } else {
      return "text-yellow-600"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configurations...</p>
          <p className="text-sm text-gray-500 mt-2">{getStatusMessage()}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Critter Chat Agent Builder</h1>
          <div className="flex items-center space-x-4">
            {previewConfig && <span className="text-sm text-blue-600 font-medium">🔄 Live Preview Active</span>}
            <span className={`text-sm font-medium ${getStatusColor()}`}>{getStatusMessage()}</span>
            {error && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-red-600">⚠️ {error}</span>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800 text-sm underline">
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminDashboard
        configs={configs}
        onConfigUpdate={handleConfigUpdate}
        onConfigCreate={handleConfigCreate}
        onConfigDelete={handleConfigDelete}
        onConfigPreview={handleConfigPreview}
        onConfigSelect={handleConfigSelect}
        onExportConfigs={handleExportConfigs}
        onImportConfigs={handleImportConfigs}
        selectedConfig={selectedConfig}
        error={error}
        onRetry={loadConfigs}
        isDatabaseAvailable={isDatabaseAvailable}
      />

      {activeConfig && <ChatWidget config={activeConfig} onFeedback={handleFeedback} onAnalytics={handleAnalytics} />}
    </div>
  )
}
