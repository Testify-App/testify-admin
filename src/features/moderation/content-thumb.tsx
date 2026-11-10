import { FileText, MessageCircle, MessagesSquare, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Media, ReportEntityType } from './moderation-api'

const icons = { post: FileText, comment: MessageCircle, user: UserRound, message: MessagesSquare }

/** First image of the reported content, or an icon for its type when there is none. */
export function ContentThumb({
  media,
  type,
  className,
}: {
  media: Media[]
  type: ReportEntityType
  className?: string
}) {
  const image = media.find((item) => item.type !== 'video')?.url ?? media[0]?.thumbnailUrl
  if (image)
    return (
      <img src={image} alt="" className={cn('shrink-0 rounded-[12px] object-cover', className)} />
    )
  const Icon = icons[type]
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-[12px] bg-tf-field text-tf-dim',
        className,
      )}
    >
      <Icon className="size-1/3" />
    </span>
  )
}
