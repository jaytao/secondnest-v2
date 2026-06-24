import type { DisplayTag } from './TagChips'

export interface DummyListing {
  id: string
  emoji: string
  color: string
  title: string
  description: string
  location_label: string
  tags: DisplayTag[]
}

export const DUMMY_LISTINGS: DummyListing[] = [
  {
    id: 'dummy-1',
    emoji: '🍼',
    color: '#ffd9e8',
    title: 'Baby bottle set (6 pack)',
    description: 'Barely used Philips Avent bottles, all nipples and caps included.',
    location_label: 'Seattle, Washington 98101',
    tags: [
      { category: 'item_type', value: 'feeding' },
      { category: 'age_range', value: '0-3m' },
      { category: 'condition', value: 'like new' },
    ],
  },
  {
    id: 'dummy-2',
    emoji: '👗',
    color: '#e0d4ff',
    title: 'Maternity dress bundle',
    description: '4 dresses, size M, worn for one pregnancy. Smoke-free home.',
    location_label: 'Bellevue, Washington 98004',
    tags: [
      { category: 'item_type', value: 'maternity' },
      { category: 'condition', value: 'good' },
    ],
  },
  {
    id: 'dummy-3',
    emoji: '🧸',
    color: '#d4f0ff',
    title: 'Wooden toy bundle',
    description: 'Stacking rings, shape sorter, and teething toys. All sanitized.',
    location_label: 'Tacoma, Washington 98402',
    tags: [
      { category: 'item_type', value: 'toys' },
      { category: 'age_range', value: '6-12m' },
      { category: 'condition', value: 'good' },
    ],
  },
  {
    id: 'dummy-4',
    emoji: '🛏️',
    color: '#fff3cd',
    title: 'Convertible crib',
    description: 'Converts to toddler bed. Minor scuff on one leg, otherwise great shape.',
    location_label: 'Redmond, Washington 98052',
    tags: [
      { category: 'item_type', value: 'nursery' },
      { category: 'age_range', value: '1-2y' },
      { category: 'condition', value: 'good' },
    ],
  },
  {
    id: 'dummy-5',
    emoji: '🚼',
    color: '#d9f7e3',
    title: 'Lightweight stroller',
    description: 'Folds down small enough for the trunk. Includes rain cover.',
    location_label: 'Everett, Washington 98201',
    tags: [
      { category: 'item_type', value: 'gear' },
      { category: 'age_range', value: '0-3m' },
      { category: 'condition', value: 'like new' },
    ],
  },
  {
    id: 'dummy-6',
    emoji: '👕',
    color: '#ffe3d4',
    title: 'Baby clothes bundle (0-3m)',
    description: '20+ onesies and sleepers, gender neutral, all washed.',
    location_label: 'Renton, Washington 98055',
    tags: [
      { category: 'item_type', value: 'clothing' },
      { category: 'age_range', value: '0-3m' },
      { category: 'condition', value: 'worn' },
    ],
  },
]
