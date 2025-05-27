"use client"

import { useEffect, useState } from "react"
import { type Config, fallbackConfig } from "@/lib/config"
import ConfigForm from "@/components/config-form"
import ConfigList from "@/components/config-list"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [selectedConfig, setSelectedConfig] = useState<Config>(fallbackConfig)
  const [isDatabaseAvailable, setIsDatabaseAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)

  const [filter, setFilter] = useState("")
  const debouncedFilter = useDebounce(filter, 500)

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
        setError(`${status.message} - ${status.recommendation || ""}`)
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
    setIsLoading(true)
    try {
      const response = await fetch("/api/configs")
      const data = await response.json()

      // Ensure we have valid configs array
      const validConfigs = Array.isArray(data) ? data : []
      setConfigs(validConfigs)
      setSelectedConfig(validConfigs[0] || fallbackConfig)
      setIsLoading(false)
    } catch (error) {
      console.error("Error loading configs:", error)
      setConfigs([fallbackConfig])
      setSelectedConfig(fallbackConfig)
      setError("Error loading configs - using demo mode")
      setIsLoading(false)
    }
  }

  const handleConfigSelect = (config: Config) => {
    setSelectedConfig(config)
  }

  const handleConfigUpdate = async (config: Config) => {
    try {
      const response = await fetch(`/api/configs/${config.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error(`Failed to update config: ${response.status}`)
      }

      loadConfigs()
      toast.success("Config updated successfully!")
    } catch (error: any) {
      console.error("Error updating config:", error)
      toast.error(`Failed to update config: ${error.message}`)
    }
  }

  const handleConfigCreate = async (config: Config) => {
    try {
      const response = await fetch(`/api/configs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error(`Failed to create config: ${response.status}`)
      }

      loadConfigs()
      toast.success("Config created successfully!")
    } catch (error: any) {
      console.error("Error creating config:", error)
      toast.error(`Failed to create config: ${error.message}`)
    }
  }

  const handleConfigDelete = async (configId: string) => {
    try {
      const response = await fetch(`/api/configs/${configId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete config: ${response.status}`)
      }

      loadConfigs()
      toast.success("Config deleted successfully!")
    } catch (error: any) {
      console.error("Error deleting config:", error)
      toast.error(`Failed to delete config: ${error.message}`)
    }
  }

  // Fixed filtering logic with proper null checks
  const filteredConfigs = configs.filter((config) => {
    if (!config || !debouncedFilter) return true

    const searchTerm = debouncedFilter.toLowerCase()
    const name = config.name?.toLowerCase() || ""
    const description = config.description?.toLowerCase() || ""
    const content = config.content?.toLowerCase() || ""

    return name.includes(searchTerm) || description.includes(searchTerm) || content.includes(searchTerm)
  })

  const getStatusMessage = () => {
    if (!dbStatus) return "Checking database..."

    switch (dbStatus.status) {
      case "connected":
        return "✅ Connected to PostgreSQL database"
      case "mock_mode":
        return "🔄 Using mock database (development mode)"
      case "not_configured":
        return "⚙️ DATABASE_URL not configured"
      case "invalid_format":
        return "⚠️ DATABASE_URL format invalid"
      case "connection_failed":
        return "❌ Database connection failed"
      default:
        return "🔄 Using mock database"
    }
  }

  const getStatusColor = () => {
    if (!dbStatus) return "text-gray-600"

    switch (dbStatus.status) {
      case "connected":
        return "text-green-600"
      case "mock_mode":
        return "text-blue-600"
      case "not_configured":
      case "invalid_format":
        return "text-yellow-600"
      case "connection_failed":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen antialiased text-foreground bg-background">
      <aside className="w-80 border-r flex-shrink-0">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Critter Chat Agents</h1>
          <p className="text-sm text-muted-foreground">Manage your chat agent configurations.</p>
        </div>

        <div className="p-4">
          <Input
            type="search"
            placeholder="Filter agents..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="p-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">Create New Agent</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Chat Agent</DialogTitle>
                <DialogDescription>Create a new chat agent by filling out the form below.</DialogDescription>
              </DialogHeader>
              <ConfigForm onSubmit={handleConfigCreate} />
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="p-4">
            <Badge variant="destructive" className="w-full justify-center">
              {error}
            </Badge>
          </div>
        )}

        <div className="p-4">
          <p className={`text-sm ${getStatusColor()}`}>{getStatusMessage()}</p>
        </div>

        <ConfigList
          configs={filteredConfigs}
          selectedConfig={selectedConfig}
          onSelect={handleConfigSelect}
          onDelete={handleConfigDelete}
          isLoading={isLoading}
        />
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <ConfigForm
          config={selectedConfig}
          onSubmit={handleConfigUpdate}
          isLoading={isLoading}
          isDatabaseAvailable={isDatabaseAvailable}
        />
      </main>
    </div>
  )
}
