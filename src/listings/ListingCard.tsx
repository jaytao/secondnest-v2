import { TagChips, type DisplayTag } from './TagChips'

interface ListingCardProps {
  title: string
  description?: string | null
  locationLabel?: string | null
  tags?: DisplayTag[]
  imageUrl?: string | null
  emoji?: string
  color?: string
  onClick?: () => void
}

export function ListingCard({
  title,
  description,
  locationLabel,
  tags,
  imageUrl,
  emoji,
  color,
  onClick,
}: ListingCardProps) {
  return (
    <article className="listing-card" onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="listing-card-image" style={!imageUrl && color ? { background: color } : undefined}>
        {imageUrl ? <img src={imageUrl} alt={title} /> : <span className="listing-card-emoji">{emoji ?? '📦'}</span>}
      </div>
      <div className="listing-card-body">
        <h2>{title}</h2>
        {description && <p className="listing-card-description">{description}</p>}
        {tags && <TagChips tags={tags} />}
        {locationLabel && <p className="listing-card-location">📍 {locationLabel}</p>}
      </div>
    </article>
  )
}
