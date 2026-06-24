import { useEffect, useRef, useState } from 'react'
import './LocationAutocomplete.css'

export interface LocationSuggestion {
  label: string
  lat: number
  lon: number
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  state?: string
  postcode?: string
  country?: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

interface ParsedLocation {
  cityState: string
  postcode?: string
  lat: number
  lon: number
}

function parseResult(result: NominatimResult): ParsedLocation {
  const address = result.address
  const town = address?.city ?? address?.town ?? address?.village ?? address?.hamlet
  const state = address?.state

  return {
    cityState: town && state ? `${town}, ${state}` : town ?? state ?? result.display_name,
    postcode: address?.postcode,
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
  }
}

function buildLabel(parsed: ParsedLocation): string {
  return parsed.postcode ? `${parsed.cityState} ${parsed.postcode}` : parsed.cityState
}

// City/town-level search results usually don't carry a postcode (a city spans many of them).
// Reverse-geocoding the result's coordinates finds an address-level point nearby that does.
async function lookupPostcode(lat: number, lon: number): Promise<string | undefined> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
    )
    const result: NominatimResult = await response.json()
    return result.address?.postcode
  } catch {
    return undefined
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: LocationSuggestion) => void
}

export function LocationAutocomplete({ value, onChange, onSelect }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(debounceRef.current)

    if (!focused || value.trim().length < 3) {
      setSuggestions([])
      return
    }

    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(value)}`,
        )
        const results: NominatimResult[] = await response.json()

        const seen = new Set<string>()
        const deduped: ParsedLocation[] = []
        for (const result of results) {
          const parsed = parseResult(result)
          if (seen.has(parsed.cityState)) continue
          seen.add(parsed.cityState)
          deduped.push(parsed)
        }

        const enriched = await Promise.all(
          deduped.map(async (parsed) =>
            parsed.postcode ? parsed : { ...parsed, postcode: await lookupPostcode(parsed.lat, parsed.lon) },
          ),
        )

        setSuggestions(enriched.map((parsed) => ({ label: buildLabel(parsed), lat: parsed.lat, lon: parsed.lon })))
        setOpen(true)
      } catch {
        setSuggestions([])
      }
    }, 350)

    return () => window.clearTimeout(debounceRef.current)
  }, [value, focused])

  return (
    <div className="location-autocomplete">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          setFocused(true)
          if (suggestions.length > 0) setOpen(true)
        }}
        onBlur={() => {
          setFocused(false)
          window.setTimeout(() => setOpen(false), 150)
        }}
        placeholder="Start typing your city or neighborhood…"
      />
      {open && suggestions.length > 0 && (
        <ul className="location-suggestions">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.label}
              onMouseDown={() => {
                onSelect(suggestion)
                setOpen(false)
              }}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
