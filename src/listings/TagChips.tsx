import type { Tag } from './useTags'

export interface DisplayTag {
  category: Tag['category']
  value: string
}

export function TagChips({ tags }: { tags: DisplayTag[] }) {
  if (tags.length === 0) return null

  return (
    <ul className="listing-card-tags">
      {tags.map((tag) => (
        <li key={`${tag.category}-${tag.value}`} className={`tag-chip-${tag.category}`}>
          {tag.value}
        </li>
      ))}
    </ul>
  )
}
