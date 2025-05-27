"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import ChatWidget from "@/components/chat-widget"
import AdminDashboard from "@/components/admin-dashboard"
import type { CritterConfig, FeedbackData } from "@/types"

const defaultConfigs: CritterConfig[] = [
  {
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
  },
]

const STORAGE_KEYS = {
  CONFIGS: "critter-chat-configs",
  SELECTED_CONFIG_ID: "critter-selected-config-id",
}

export default function Home() {
  const [configs, setConfigs] = useState<CritterConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<CritterConfig | null>(null)
  const [previewConfig, setPreviewConfig] = useState<CritterConfig | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load configurations from localStorage on mount
  useEffect(() => {
    try {
      const savedConfigs = localStorage.getItem(STORAGE_KEYS.CONFIGS)
      const savedSelectedId = localStorage.getItem(STORAGE_KEYS.SELECTED_CONFIG_ID)

      if (savedConfigs) {
        const parsedConfigs = JSON.parse(savedConfigs) as CritterConfig[]
        setConfigs(parsedConfigs)

        // Restore selected config
        if (savedSelectedId) {
          const foundConfig = parsedConfigs.find((config) => config.businessId === savedSelectedId)
          if (foundConfig) {
            setSelectedConfig(foundConfig)
          } else {
            // If saved ID not found, use first config
            setSelectedConfig(parsedConfigs[0] || null)
          }
        } else {
          setSelectedConfig(parsedConfigs[0] || null)
        }
      } else {
        // First time - use default configs
        setConfigs(defaultConfigs)
        setSelectedConfig(defaultConfigs[0])
        // Save defaults to localStorage
        localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(defaultConfigs))
        localStorage.setItem(STORAGE_KEYS.SELECTED_CONFIG_ID, defaultConfigs[0].businessId)
      }
    } catch (error) {
      console.error("Error loading configurations:", error)
      // Fallback to defaults
      setConfigs(defaultConfigs)
      setSelectedConfig(defaultConfigs[0])
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save configurations to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && configs.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs))
      } catch (error) {
        console.error("Error saving configurations:", error)
      }
    }
  }, [configs, isLoaded])

  // Save selected config ID whenever it changes
  useEffect(() => {
    if (isLoaded && selectedConfig) {
      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_CONFIG_ID, selectedConfig.businessId)
      } catch (error) {
        console.error("Error saving selected config:", error)
      }
    }
  }, [selectedConfig, isLoaded])

  const handleConfigUpdate = useCallback((updatedConfig: CritterConfig) => {
    setConfigs((prev) =>
      prev.map((config) => (config.businessId === updatedConfig.businessId ? updatedConfig : config)),
    )
    setSelectedConfig(updatedConfig)
    // Clear preview when saving
    setPreviewConfig(null)
  }, [])

  const handleConfigCreate = useCallback((newConfig: CritterConfig) => {
    setConfigs((prev) => [...prev, newConfig])
    setSelectedConfig(newConfig)
    // Clear preview when saving
    setPreviewConfig(null)
  }, [])

  const handleConfigDelete = useCallback(
    (configToDelete: CritterConfig) => {
      setConfigs((prev) => {
        const newConfigs = prev.filter((config) => config.businessId !== configToDelete.businessId)

        // If we're deleting the selected config, select another one
        if (selectedConfig?.businessId === configToDelete.businessId) {
          const newSelected = newConfigs[0] || null
          setSelectedConfig(newSelected)
          if (newSelected) {
            localStorage.setItem(STORAGE_KEYS.SELECTED_CONFIG_ID, newSelected.businessId)
          } else {
            localStorage.removeItem(STORAGE_KEYS.SELECTED_CONFIG_ID)
          }
        }

        return newConfigs
      })
      setPreviewConfig(null)
    },
    [selectedConfig],
  )

  const handleConfigPreview = useCallback((previewData: Partial<CritterConfig>) => {
    setSelectedConfig((currentSelected) => {
      if (currentSelected) {
        // Merge the preview data with the selected config for live preview
        const merged = { ...currentSelected, ...previewData } as CritterConfig
        setPreviewConfig(merged)
        return currentSelected // Don't change selectedConfig, only previewConfig
      }
      return currentSelected
    })
  }, [])

  const handleConfigSelect = useCallback((config: CritterConfig) => {
    setSelectedConfig(config)
    setPreviewConfig(null) // Clear preview when switching configs
  }, [])

  const handleFeedback = useCallback((feedback: FeedbackData) => {
    console.log("Feedback received:", feedback)
    // Here you would typically send to your analytics service
  }, [])

  const handleAnalytics = useCallback((analytics: any) => {
    console.log("Analytics data:", analytics)
    // Here you would typically send to your analytics service
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
    }
  }, [configs])

  const handleImportConfigs = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedConfigs = JSON.parse(e.target?.result as string) as CritterConfig[]
        setConfigs(importedConfigs)
        if (importedConfigs.length > 0) {
          setSelectedConfig(importedConfigs[0])
        }
        setPreviewConfig(null)
      } catch (error) {
        console.error("Error importing configurations:", error)
        alert("Error importing configurations. Please check the file format.")
      }
    }
    reader.readAsText(file)
    // Reset the input
    event.target.value = ""
  }, [])

  // Use preview config if available, otherwise use selected config
  const activeConfig = previewConfig || selectedConfig

  // Don't render until configurations are loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configurations...</p>
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
      />

      {/* Chat Widget - always visible with live preview */}
      {activeConfig && <ChatWidget config={activeConfig} onFeedback={handleFeedback} onAnalytics={handleAnalytics} />}
    </div>
  )
}
