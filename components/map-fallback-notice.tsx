"use client"

import { AlertCircle, MapPin } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface MapFallbackNoticeProps {
  className?: string
}

export function MapFallbackNotice({ className }: MapFallbackNoticeProps) {
  return (
    <Alert className={`mb-4 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Google Maps API Key Required</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          The map is currently running in fallback mode. For full functionality, you would need to add a valid Google
          Maps API key.
        </p>
        <div className="text-sm bg-gray-100 p-3 rounded-md">
          <p className="font-medium">To use Google Maps:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Get an API key from the Google Cloud Console</li>
            <li>
              Replace <code>YOUR_GOOGLE_MAPS_API_KEY</code> in the code with your actual API key
            </li>
            <li>Enable the Maps JavaScript API and Places API in your Google Cloud project</li>
          </ol>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open("https://developers.google.com/maps/documentation/javascript/get-api-key", "_blank")
            }
          >
            <MapPin className="mr-2 h-4 w-4" />
            Get API Key
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
