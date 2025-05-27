"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Agent } from "@/types"

interface ConfigFormProps {
  config?: Agent
  onSave: (config: Agent) => void
  onCancel?: () => void
}

export default function ConfigForm({ config, onSave, onCancel }: ConfigFormProps) {
  const [formData, setFormData] = useState<Agent>(
    config || {
      businessId: "",
      businessName: "",
      webhookUrl: "",
      position: "bottom-right",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      welcomeMessage: "Hello! How can I help you today?",
      width: 350,
      height: 500,
      showTimestamp: true,
      enableTypingIndicator: true,
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (field: keyof Agent, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{config ? "Edit Configuration" : "Create New Configuration"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessId">Business ID</Label>
              <Input
                id="businessId"
                value={formData.businessId}
                onChange={(e) => handleChange("businessId", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => handleChange("webhookUrl", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              value={formData.welcomeMessage}
              onChange={(e) => handleChange("welcomeMessage", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => handleChange("primaryColor", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => handleChange("secondaryColor", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={formData.width}
                onChange={(e) => handleChange("width", Number.parseInt(e.target.value))}
                min="300"
                max="600"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => handleChange("height", Number.parseInt(e.target.value))}
                min="400"
                max="800"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit">Save Configuration</Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
