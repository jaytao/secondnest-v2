export type DeepLinkKey = 'legal' | 'listing' | 'profile'

export interface DeepLink {
  key: DeepLinkKey
  value: string
}

const DEEP_LINK_KEYS: DeepLinkKey[] = ['legal', 'listing', 'profile']

// If a URL has more than one of these params (e.g. a hand-crafted or stale
// link), whichever appears first in the query string wins; the rest are
// ignored for the initial load.
export function getInitialDeepLink(): DeepLink | null {
  const params = new URLSearchParams(window.location.search)
  for (const [key, value] of params.entries()) {
    if ((DEEP_LINK_KEYS as string[]).includes(key)) {
      return { key: key as DeepLinkKey, value }
    }
  }
  return null
}

// Sets exactly one deep-link param, clearing the other two so the URL never
// ends up implying more than one "current view" once the app is driving it.
export function setDeepLinkParam(key: DeepLinkKey | null, value?: string) {
  const url = new URL(window.location.href)
  for (const k of DEEP_LINK_KEYS) url.searchParams.delete(k)
  if (key && value) url.searchParams.set(key, value)
  window.history.pushState(null, '', url)
}
