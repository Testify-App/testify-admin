import { useState } from 'react'
import {
  EllipsisVertical,
  FilePenLine,
  MessageCircleMore,
  MessageSquareQuote,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Panel } from '@/components/testify/panel'
import { buttonClass } from '@/components/testify/button-class'
import { tabClass } from '@/components/testify/form-styles'
import { Pagination } from '@/components/testify/pagination'
import { StatusPill } from '@/components/testify/status-pill'
import { ConfirmDialog, ContentPreview } from '@/components/testify/testify-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { errorMessage } from '@/lib/api/base-api'
import { useDebouncedValue } from '@/lib/use-debounced-value'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usePermission } from '@/features/auth/use-permission'
import { ContentThumb } from '@/features/moderation/content-thumb'
import { shortId } from '@/features/moderation/report-format'
import {
  useGetHiddenContentQuery,
  useRestoreContentMutation,
  type HiddenItem,
  type HiddenType,
} from './hidden-api'

function HiddenRow({
  item,
  canRestore,
  onRestore,
}: {
  item: HiddenItem
  canRestore: boolean
  onRestore: () => void
}) {
  const isPost = item.type === 'post'
  const label = isPost ? 'Post' : 'Comment'
  const text = item.content?.trim() || 'Media only'
  return (
    <li className="flex flex-col gap-5 border-b border-tf-divider py-8 first:pt-[59px] last:border-b-0 sm:flex-row sm:items-center sm:gap-8">
      <ContentThumb
        media={item.media}
        type={item.type}
        className={cn('size-[143px]', !isPost && !item.media.length && 'rounded-full')}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[20px] leading-7 break-words">{isPost ? text : `“${text}”`}</p>
        <p className="mt-[13px] text-[16px] leading-5 text-tf-grey">
          By @{item.author.username ?? 'unknown'} · Removed {timeAgo(item.hiddenAt)}
          {item.hiddenBy ? ` by ${item.hiddenBy.name}` : ''}
        </p>
        {item.parentPostContent && (
          <p className="mt-[21px] flex items-center gap-2 text-[16px] leading-5 text-tf-grey">
            <MessageCircleMore className="size-4 shrink-0 text-tf-lime" aria-hidden />
            On testimony: <span className="truncate text-white">“{item.parentPostContent}”</span>
          </p>
        )}
        <StatusPill tone="hidden" className="mt-[21px] h-[38px] px-[21px] text-[13px] font-medium">
          Hidden{item.hiddenReason ? ` – ${item.hiddenReason}` : ''}
        </StatusPill>
      </div>
      <div className="flex items-center gap-6 sm:gap-[25px]">
        {canRestore && (
          <button
            type="button"
            className={cn(buttonClass.primary, 'w-full sm:w-[287px]')}
            onClick={onRestore}
          >
            Restore {label}
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`More options for ${label.toLowerCase()} ${shortId(item.id)}`}
            className="grid size-8 shrink-0 place-items-center rounded-full text-white hover:bg-white/10"
          >
            <EllipsisVertical className="size-6" strokeWidth={2.5} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-tf-line bg-tf-card font-dm-sans text-white"
          >
            <DropdownMenuItem
              className="text-[14px] focus:bg-tf-field focus:text-white"
              onSelect={() => {
                void navigator.clipboard?.writeText(item.id)
                toast.success(`${label} ID copied`)
              }}
            >
              Copy {label.toLowerCase()} ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function HiddenList({
  type,
  search,
  canRestore,
  onRestore,
}: {
  type: HiddenType
  search: string
  canRestore: boolean
  onRestore: (item: HiddenItem) => void
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useGetHiddenContentQuery({ type, page, search })
  if (isLoading) return <p className="py-24 text-center text-[16px] text-tf-muted">Loading…</p>
  if (isError)
    return (
      <p className="py-24 text-center text-[16px] text-tf-muted">
        We couldn’t load hidden content.
      </p>
    )
  if (!data?.items.length)
    return (
      <p className="py-24 text-center text-[16px] text-tf-muted">
        {search
          ? 'Nothing matches your search.'
          : `No hidden ${type === 'post' ? 'posts' : 'comments'}. Everything has been reviewed.`}
      </p>
    )
  return (
    <>
      <ul>
        {data.items.map((item) => (
          <HiddenRow
            key={item.id}
            item={item}
            canRestore={canRestore}
            onRestore={() => onRestore(item)}
          />
        ))}
      </ul>
      {data.totalPages > 1 && (
        <div className="pb-6">
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  )
}

export function HiddenContentPage() {
  const canRestore = usePermission('hidden:update')
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query)
  const [pending, setPending] = useState<HiddenItem | null>(null)
  const [restoreContent, { isLoading }] = useRestoreContentMutation()
  // Tab counts come with every list response; this cheap query keeps them visible on both tabs.
  const { data: counts } = useGetHiddenContentQuery({ type: 'post', page: 1, search })

  const restore = async () => {
    if (!pending) return
    try {
      await restoreContent({ type: pending.type, id: pending.id }).unwrap()
      toast.success(`${pending.type === 'post' ? 'Post' : 'Comment'} restored`)
      setPending(null)
    } catch (cause) {
      toast.error(errorMessage(cause))
    }
  }

  return (
    <AdminLayout title="Restore Hidden Content">
      <TabsPrimitive.Root defaultValue="posts">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#2b2e33]">
          <TabsPrimitive.List
            aria-label="Hidden content type"
            className="-mt-[2px] flex gap-[56px] overflow-x-auto"
          >
            <TabsPrimitive.Trigger value="posts" className={cn(tabClass, 'pr-[21px]')}>
              Hidden Posts <span>({counts?.counts.posts ?? 0})</span>
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger value="comments" className={cn(tabClass, 'px-[25px]')}>
              Hidden Comments <span>({counts?.counts.comments ?? 0})</span>
            </TabsPrimitive.Trigger>
          </TabsPrimitive.List>
          <label className="mb-3 flex h-[46px] w-full items-center gap-[10px] rounded-full bg-tf-panel px-6 sm:w-[320px]">
            <Search className="size-[18px] shrink-0 text-white" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search hidden content"
              placeholder="Search by text, author or ID..."
              className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-tf-slate"
            />
          </label>
        </div>
        <Panel className="mt-[34px] px-5 pb-[17px] sm:px-[60px]">
          <TabsPrimitive.Content value="posts">
            <HiddenList
              type="post"
              search={search}
              canRestore={canRestore}
              onRestore={setPending}
            />
          </TabsPrimitive.Content>
          <TabsPrimitive.Content value="comments">
            <HiddenList
              type="comment"
              search={search}
              canRestore={canRestore}
              onRestore={setPending}
            />
          </TabsPrimitive.Content>
        </Panel>
      </TabsPrimitive.Root>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => !open && setPending(null)}
        icon={pending?.type === 'comment' ? <MessageSquareQuote /> : <FilePenLine />}
        title={pending?.type === 'comment' ? 'Restore Comment?' : 'Restore Post?'}
        description={`This ${pending?.type ?? 'post'} will become visible again on the app`}
        confirmLabel={
          isLoading
            ? 'Restoring…'
            : pending?.type === 'comment'
              ? 'Restore Comment'
              : 'Restore Post'
        }
        onConfirm={() => void restore()}
      >
        {pending && (
          <ContentPreview
            image={pending.media[0]?.thumbnailUrl ?? pending.media[0]?.url}
            imageShape={pending.type === 'comment' ? 'circle' : 'square'}
            text={pending.parentPostContent ?? pending.content ?? 'Media only'}
            meta={`By @${pending.author.username ?? 'unknown'} · Removed ${timeAgo(pending.hiddenAt)}`}
          />
        )}
      </ConfirmDialog>
    </AdminLayout>
  )
}
