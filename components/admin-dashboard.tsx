"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Trash2, Download, Upload, Save, RefreshCw, AlertCircle } from "lucide-react"
import type { CritterConfig } from "@/types"
import { testWebhookConnection } from "@/lib/webhook-test"

interface AdminDashboardProps {
  configs: CritterConfig[]
  onConfigUpdate: (config: CritterConfig) => Promise<void>
  onConfigCreate: (config: CritterConfig) => Promise<void>
  onConfigDelete: (config: CritterConfig) => Promise<void>
  onConfigPreview: (previewData: Partial<CritterConfig>) => void
  onConfigSelect: (config: CritterConfig) => void
  onExportConfigs: () => void
  onImportConfigs: (event: React.ChangeEvent<HTMLInputElement>) => void
  selectedConfig: CritterConfig | null
  error?: string | null
  onRetry?: () => void
  isDatabaseAvailable?: boolean
  analytics?: Record<string, any>
}

export default function AdminDashboard({
  configs,
  onConfigUpdate,
  onConfigCreate,
  onConfigDelete,
  onConfigPreview,
  onConfigSelect,
  onExportConfigs,
  onImportConfigs,
  selectedConfig,
  error,
  onRetry,
  isDatabaseAvailable = true,
  analytics,
}: AdminDashboardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<CritterConfig>>({})
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form data when selected config changes
  useEffect(() => {
    if (selectedConfig) {
      setFormData(selectedConfig)
    }
  }, [selectedConfig])

  // Debounced preview update to prevent excessive calls
  const debouncedPreview = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (data: Partial<CritterConfig>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          onConfigPreview(data)
        }, 100) // 100ms debounce
      }
    })(),
    [onConfigPreview],
  )

  // Send preview updates when form data changes during editing
  useEffect(() => {
    if (isEditing && selectedConfig && formData) {
      // Only send preview if there are actual changes
      const hasChanges = Object.keys(formData).some(
        (key) => formData[key as keyof CritterConfig] !== selectedConfig[key as keyof CritterConfig],
      )

      if (hasChanges) {
        debouncedPreview(formData)
      }
    }
  }, [formData, isEditing, selectedConfig, debouncedPreview])

  const handleCreateNew = useCallback(() => {
    const newConfig: CritterConfig = {
      businessId: `business_${Date.now()}`,
      businessName: "",
      webhookUrl: "https://jleib03.app.n8n.cloud/webhook-test/803d260b-1b17-4abf-8079-2d40225c29b0",
      position: "bottom-right",
      primaryColor: "#e75837",
      secondaryColor: "#745e25",
      welcomeMessage: "Welcome! How can I help you today?",
      width: 350,
      height: 500,
      showTimestamp: true,
      enableTypingIndicator: true,
    }
    onConfigSelect(newConfig)
    setFormData(newConfig)
    setIsEditing(true)
  }, [onConfigSelect])

  const handleSave = useCallback(async () => {
    if (!formData.businessName || !formData.businessId) return

    setIsSaving(true)
    try {
      const config = { ...selectedConfig, ...formData } as CritterConfig

      if (selectedConfig && configs.find((c) => c.businessId === selectedConfig.businessId)) {
        await onConfigUpdate(config)
      } else {
        await onConfigCreate(config)
      }

      setIsEditing(false)
    } catch (error) {
      console.error("Error saving config:", error)
    } finally {
      setIsSaving(false)
    }
  }, [formData, selectedConfig, configs, onConfigUpdate, onConfigCreate])

  const handleCancel = useCallback(() => {
    if (selectedConfig) {
      setFormData(selectedConfig)
    }
    setIsEditing(false)
  }, [selectedConfig])

  const handleDelete = useCallback(
    async (config: CritterConfig) => {
      setIsDeleting(config.businessId)
      try {
        await onConfigDelete(config)
        setShowDeleteConfirm(null)
      } catch (error) {
        console.error("Error deleting config:", error)
      } finally {
        setIsDeleting(null)
      }
    },
    [onConfigDelete],
  )

  const handleTestWebhook = useCallback(async () => {
    if (!selectedConfig?.webhookUrl || !selectedConfig?.businessId) return

    setIsTestingWebhook(true)
    setWebhookTestResult(null)

    try {
      const success = await testWebhookConnection(
        selectedConfig.webhookUrl,
        selectedConfig.businessId,
        selectedConfig.businessName,
      )

      setWebhookTestResult({
        success,
        message: success ? "Webhook connection successful!" : "Webhook connection failed. Please check your URL.",
      })
    } catch (error) {
      setWebhookTestResult({
        success: false,
        message: "Error testing webhook connection.",
      })
    } finally {
      setIsTestingWebhook(false)
    }
  }, [selectedConfig])

  const generateEmbedCode = useMemo(() => {
    if (!selectedConfig) return ""
    return `<script>
  window.CritterConfig = ${JSON.stringify(selectedConfig, null, 2)};
</script>
<script src="https://cdn.critter.pet/chat-widget.js"></script>`
  }, [selectedConfig])

  const updateFormField = useCallback((field: keyof CritterConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl text-gray-600">Build and test your AI chat agents</h2>
          {!isDatabaseAvailable && (
            <p className="text-sm text-yellow-600 mt-1">⚠️ Running in demo mode - perfect for testing!</p>
          )}
        </div>
        <div className="flex space-x-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
          <Button variant="outline" onClick={onExportConfigs} disabled={configs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleCreateNew}>Create New Agent</Button>
        </div>
      </div>

      {/* Info Banner for Demo Mode */}
      {!isDatabaseAvailable && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800">
              Demo Mode: All features work perfectly! Changes are saved in memory for this session.
            </span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && error.includes("Failed") && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={onImportConfigs} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Chat Agents ({configs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.businessId}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors relative group ${
                    selectedConfig?.businessId === config.businessId
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    onConfigSelect(config)
                    setFormData(config)
                    setIsEditing(false)
                    setWebhookTestResult(null)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{config.businessName || "Unnamed Business"}</h3>
                      <p className="text-sm text-gray-500 font-mono">ID: {config.businessId}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                        <Badge variant="secondary" className="text-xs">
                          {config.position}
                        </Badge>
                      </div>
                    </div>
                    {configs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(config.businessId)
                        }}
                        disabled={isDeleting === config.businessId}
                      >
                        {isDeleting === config.businessId ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {configs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No agents created yet.</p>
                  <p className="text-sm">Click "Create New Agent" to get started!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {selectedConfig ? (
            <Tabs defaultValue="config" className="space-y-4">
              <TabsList>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="test">Live Test</TabsTrigger>
                <TabsTrigger value="embed">Embed Code</TabsTrigger>
              </TabsList>

              <TabsContent value="config">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Agent Configuration</CardTitle>
                      {isEditing && <p className="text-sm text-blue-600 mt-1">🔄 Changes are previewed live</p>}
                    </div>
                    <div className="flex space-x-2">
                      {!isEditing && (
                        <Button variant="outline" onClick={handleTestWebhook} disabled={isTestingWebhook}>
                          {isTestingWebhook ? "Testing..." : "Test Webhook"}
                        </Button>
                      )}
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSave}
                            disabled={!formData.businessName || !formData.businessId || isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>Edit</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {webhookTestResult && (
                      <div
                        className={`p-3 rounded-md ${
                          webhookTestResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {webhookTestResult.message}
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="businessId">Business ID *</Label>
                          <Input
                            id="businessId"
                            value={formData.businessId || ""}
                            onChange={(e) => updateFormField("businessId", e.target.value)}
                            disabled={!isEditing}
                            placeholder="unique-business-id"
                            className="font-mono"
                          />
                          <p className="text-xs text-gray-500 mt-1">Unique identifier for this agent</p>
                        </div>
                        <div>
                          <Label htmlFor="businessName">Business Name *</Label>
                          <Input
                            id="businessName"
                            value={formData.businessName || ""}
                            onChange={(e) => updateFormField("businessName", e.target.value)}
                            disabled={!isEditing}
                            placeholder="Your Business Name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="welcomeMessage">Welcome Message</Label>
                        <Textarea
                          id="welcomeMessage"
                          value={formData.welcomeMessage || ""}
                          onChange={(e) => updateFormField("welcomeMessage", e.target.value)}
                          disabled={!isEditing}
                          rows={3}
                          placeholder="Welcome! How can I help you today?"
                        />
                      </div>

                      <div>
                        <Label htmlFor="webhookUrl">Webhook URL *</Label>
                        <Input
                          id="webhookUrl"
                          value={formData.webhookUrl || ""}
                          onChange={(e) => updateFormField("webhookUrl", e.target.value)}
                          disabled={!isEditing}
                          placeholder="https://your-webhook-url.com"
                          className="font-mono"
                        />
                        <p className="text-xs text-gray-500 mt-1">Your n8n webhook or AI service endpoint</p>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Appearance</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={formData.primaryColor || "#e75837"}
                              onChange={(e) => updateFormField("primaryColor", e.target.value)}
                              disabled={!isEditing}
                              className="w-12 h-10"
                            />
                            <Input
                              value={formData.primaryColor || "#e75837"}
                              onChange={(e) => updateFormField("primaryColor", e.target.value)}
                              disabled={!isEditing}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="secondaryColor">Secondary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={formData.secondaryColor || "#745e25"}
                              onChange={(e) => updateFormField("secondaryColor", e.target.value)}
                              disabled={!isEditing}
                              className="w-12 h-10"
                            />
                            <Input
                              value={formData.secondaryColor || "#745e25"}
                              onChange={(e) => updateFormField("secondaryColor", e.target.value)}
                              disabled={!isEditing}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Widget Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Widget Settings</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="position">Position</Label>
                          <Select
                            value={formData.position || "bottom-right"}
                            onValueChange={(value) => updateFormField("position", value)}
                            disabled={!isEditing}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                              <SelectItem value="top-left">Top Left</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="width">Width (px)</Label>
                          <Input
                            type="number"
                            value={formData.width || 350}
                            onChange={(e) => updateFormField("width", Number.parseInt(e.target.value))}
                            disabled={!isEditing}
                            min="300"
                            max="500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height">Height (px)</Label>
                          <Input
                            type="number"
                            value={formData.height || 500}
                            onChange={(e) => updateFormField("height", Number.parseInt(e.target.value))}
                            disabled={!isEditing}
                            min="400"
                            max="700"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showTimestamp"
                            checked={formData.showTimestamp ?? true}
                            onCheckedChange={(checked) => updateFormField("showTimestamp", checked)}
                            disabled={!isEditing}
                          />
                          <Label htmlFor="showTimestamp">Show Timestamps</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="enableTypingIndicator"
                            checked={formData.enableTypingIndicator ?? true}
                            onCheckedChange={(checked) => updateFormField("enableTypingIndicator", checked)}
                            disabled={!isEditing}
                          />
                          <Label htmlFor="enableTypingIndicator">Typing Indicator</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Agent Test</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8 min-h-[500px] relative">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">{selectedConfig.businessName}</h2>
                        <p className="text-gray-600">Test your chat agent in real-time</p>
                        <Badge variant="outline" className="mt-2">
                          ID: {selectedConfig.businessId}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="bg-white p-4 rounded-lg shadow">
                          <h3 className="font-semibold mb-2">🐕 Dog Walking</h3>
                          <p className="text-sm text-gray-600">Professional dog walking services</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                          <h3 className="font-semibold mb-2">✂️ Pet Grooming</h3>
                          <p className="text-sm text-gray-600">Full-service grooming for all pets</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                          <h3 className="font-semibold mb-2">🏠 Pet Boarding</h3>
                          <p className="text-sm text-gray-600">Safe and comfortable boarding</p>
                        </div>
                      </div>
                      <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                          Click the chat widget in the {selectedConfig.position.replace("-", " ")} corner to test your
                          agent!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="embed">
                <Card>
                  <CardHeader>
                    <CardTitle>Embed Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-gray-600">Copy this code to embed the chat widget on your website:</p>
                    <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                      <pre className="text-sm">{generateEmbedCode}</pre>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button onClick={() => navigator.clipboard.writeText(generateEmbedCode)}>
                        Copy to Clipboard
                      </Button>
                      <Button variant="outline">Download as File</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">Select an agent to configure or create a new one</p>
                  <Button onClick={handleCreateNew}>Create Your First Agent</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Delete Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Are you sure you want to delete this agent? This action cannot be undone.</p>
              <div className="flex space-x-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} disabled={!!isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const configToDelete = configs.find((c) => c.businessId === showDeleteConfirm)
                    if (configToDelete) {
                      handleDelete(configToDelete)
                    }
                  }}
                  disabled={!!isDeleting}
                >
                  {isDeleting === showDeleteConfirm ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
