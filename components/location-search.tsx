"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, X, Loader2, MapPin } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { useToast } from "@/hooks/use-toast"

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lon: number; display_name: string }) => void
}

interface SearchResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  importance: number
  address: {
    city?: string
    town?: string
    state?: string
    country?: string
    postcode?: string
  }
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const resultsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Search for locations when the debounced search term changes
  useEffect(() => {
    const searchLocations = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        // Use Nominatim API to search for locations
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            debouncedSearchTerm,
          )}&limit=5&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "id", // Get results in Indonesian
              "User-Agent": "AttendanceApp/1.0", // Identify your application
            },
          },
        )

        if (!response.ok) {
          throw new Error("Gagal mencari lokasi")
        }

        const data: SearchResult[] = await response.json()
        setResults(data)
        setShowResults(data.length > 0)
      } catch (error) {
        console.error("Error searching for locations:", error)
        toast({
          title: "Error Pencarian",
          description: "Gagal mencari lokasi. Silakan coba lagi.",
          variant: "destructive",
        })
      } finally {
        setIsSearching(false)
      }
    }

    searchLocations()
  }, [debouncedSearchTerm, toast])

  // Handle clicks outside the results dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle location selection
  const handleSelectLocation = (location: SearchResult) => {
    onLocationSelect({
      lat: Number.parseFloat(location.lat),
      lon: Number.parseFloat(location.lon),
      display_name: location.display_name,
    })
    setSearchTerm(location.display_name)
    setShowResults(false)
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("")
    setResults([])
    setShowResults(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Format the display name to be more concise
  const formatDisplayName = (result: SearchResult) => {
    const address = result.address
    const parts = []

    if (address.city || address.town) {
      parts.push(address.city || address.town)
    }
    if (address.state) {
      parts.push(address.state)
    }
    if (address.country) {
      parts.push(address.country)
    }

    if (parts.length > 0) {
      return parts.join(", ")
    }

    // If we can't format it nicely, just return a shortened version of the display name
    return result.display_name.length > 50 ? result.display_name.substring(0, 50) + "..." : result.display_name
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Cari lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search results dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
        >
          {isSearching ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">Mencari...</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((result) => (
                <li key={result.place_id}>
                  <button
                    className="flex w-full items-start px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <MapPin className="mr-2 h-5 w-5 flex-shrink-0 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{formatDisplayName(result)}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[calc(100%-2rem)]">
                        {result.display_name}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">Tidak ada hasil ditemukan</div>
          )}
          <div className="border-t border-gray-100 p-2 text-xs text-gray-500 text-center">
            Didukung oleh{" "}
            <a
              href="https://nominatim.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Nominatim
            </a>{" "}
            &{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              OpenStreetMap
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
