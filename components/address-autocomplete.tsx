'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { fetchAddressSuggestions, resolveSuggestionCoords, type AddressSuggestion } from '@/lib/geocoding'
import { cn } from '@/lib/utils'

interface AddressAutocompleteProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: AddressSuggestion) => void
  onSearchingChange?: (searching: boolean) => void
  maxLength?: number
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  onSearchingChange,
  maxLength = 200,
}: AddressAutocompleteProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listId = `${inputId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    onSearchingChange?.(loading)
  }, [loading, onSearchingChange])

  useEffect(() => {
    const query = value.trim()
    if (query.length < 3) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const result = await fetchAddressSuggestions(query)
        if (!controller.signal.aborted) {
          setSuggestions(result.suggestions)
          setOpen(result.suggestions.length > 0)
          setActiveIndex(-1)
        }
      } catch {
        if (!controller.signal.aborted) setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  async function choose(suggestion: AddressSuggestion) {
    setLoading(true)
    try {
      const resolved = await resolveSuggestionCoords(suggestion)
      onChange(resolved.value)
      onSelect(resolved)
    } finally {
      setLoading(false)
      setOpen(false)
      setSuggestions([])
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            autoComplete="street-address"
            enterKeyHint="search"
            maxLength={maxLength}
            value={value}
            onChange={(event) => {
              onChange(event.target.value)
              setOpen(true)
            }}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true)
            }}
            onKeyDown={(event) => {
              if (!open || suggestions.length === 0) return
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActiveIndex((index) => (index + 1) % suggestions.length)
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1))
              }
              if (event.key === 'Enter' && activeIndex >= 0) {
                event.preventDefault()
                choose(suggestions[activeIndex])
              }
              if (event.key === 'Escape') setOpen(false)
            }}
            placeholder="Начните вводить улицу и дом"
            className="field-input pl-10 pr-10"
          />
        {loading && (
          <Loader2
            className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-label="Ищем адрес"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-border bg-card py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
                className={cn(
                  'flex min-h-12 w-full px-3 py-3 text-left text-sm text-card-foreground hover:bg-secondary',
                  index === activeIndex && 'bg-secondary',
                )}
              >
                {suggestion.value}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
