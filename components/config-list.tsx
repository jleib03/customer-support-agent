"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Eye } from "lucide-react"
import type { Agent } from "@/types"

interface ConfigListProps {
  configs: Agent[]
  onEdit: (config: Agent) => void
  onDelete: (businessId: string) => void
  onPreview: (config: Agent) => void
}

export default function ConfigList({ configs, onEdit, onDelete, onPreview }: ConfigListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = (businessId: string) => {
    if (deleteConfirm === businessId) {
      onDelete(businessId)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(businessId)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No configurations found. Create your first one!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <Card key={config.businessId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{config.businessName}</CardTitle>
                <p className="text-sm text-gray-500">ID: {config.businessId}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" style={{ backgroundColor: config.primaryColor, color: "white" }}>
                  {config.primaryColor}
                </Badge>
                <Badge variant="outline">
                  {config.width}×{config.height}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Webhook:</strong> {config.webhookUrl}
              </p>
              <p className="text-sm">
                <strong>Welcome:</strong> {config.welcomeMessage}
              </p>
              <p className="text-sm">
                <strong>Position:</strong> {config.position}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" onClick={() => onPreview(config)}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(config)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant={deleteConfirm === config.businessId ? "destructive" : "outline"}
                onClick={() => handleDelete(config.businessId)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {deleteConfirm === config.businessId ? "Confirm Delete" : "Delete"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
