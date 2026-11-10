import { http, HttpResponse, type JsonBodyType } from 'msw'
import { API_BASE_URL } from '@/lib/api/base-api'
import { ME } from './backoffice-mock'

/**
 * In-memory stand-in for the moderation side of the testify-backend `/backoffice` API:
 * Moderation, Users, Hidden Content and Audit Log. Responses use the server's shapes, and the
 * main rules are applied (resolving closes related reports, remove-content hides the post, bans
 * can't be lifted, notes can only be changed by their author). State resets before every test.
 */
const B = `${API_BASE_URL}/backoffice`

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

const now = () => new Date().toISOString()
const day = (offset: number) => new Date(Date.now() - offset * 864e5).toISOString()

const seedUsers = (): Row[] => [
  {
    id: 'u-john',
    username: 'johnc',
    display_name: 'John C',
    first_name: 'John',
    last_name: 'Creative',
    email: 'john@example.com',
    moderation_status: 'active',
    suspended_until: null,
    created_at: day(90),
    last_login: day(0),
  },
  {
    id: 'u-grace',
    username: 'gracem',
    display_name: 'Grace M',
    first_name: 'Grace',
    last_name: 'Mensah',
    email: 'grace@example.com',
    moderation_status: 'active',
    suspended_until: null,
    created_at: day(200),
    last_login: day(1),
  },
  {
    id: 'u-ada',
    username: 'adaobi',
    display_name: 'Ada',
    first_name: 'Ada',
    last_name: 'Obi',
    email: 'ada@example.com',
    moderation_status: 'banned',
    suspended_until: null,
    created_at: day(10),
    last_login: null,
  },
]
const seedContent = (): Row[] => [
  {
    type: 'post',
    id: 'post-spam',
    owner: 'u-john',
    content: 'Buy cheap followers now!!!',
    created_at: day(3),
    hidden_at: null,
  },
  {
    type: 'comment',
    id: 'comment-mean',
    owner: 'u-john',
    content: 'This is fake, you are lying',
    created_at: day(2),
    hidden_at: null,
    post_id: 'post-healing',
    parent: 'God healed my back.',
  },
  {
    type: 'post',
    id: 'post-old',
    owner: 'u-grace',
    content: 'An older testimony that was removed',
    created_at: day(20),
    hidden_at: day(5),
    hidden_reason: 'Spam',
    hidden_by: 'Test Admin',
  },
]
const seedReports = (): Row[] => [
  {
    id: 'rep-spam-1',
    entity_type: 'post',
    entity_id: 'post-spam',
    reason: 'Spam',
    reason_code: 'spam',
    severity: 1,
    reporter: 'u-grace',
    owner: 'u-john',
    status: 'pending',
    created_at: day(1),
    details: 'Selling followers',
  },
  {
    id: 'rep-spam-2',
    entity_type: 'post',
    entity_id: 'post-spam',
    reason: 'Fraud or scams',
    reason_code: 'fraud',
    severity: 2,
    reporter: 'u-ada',
    owner: 'u-john',
    status: 'pending',
    created_at: day(1),
  },
  {
    id: 'rep-comment',
    entity_type: 'comment',
    entity_id: 'comment-mean',
    reason: 'Harassment or bullying',
    reason_code: 'harassment',
    severity: 3,
    reporter: 'u-grace',
    owner: 'u-john',
    status: 'under_review',
    created_at: day(2),
    moderator: { id: ME.id, name: ME.name },
  },
  {
    id: 'rep-user',
    entity_type: 'user',
    entity_id: 'u-john',
    reason: 'Impersonation or fake account',
    reason_code: 'impersonation',
    severity: 2,
    reporter: 'u-grace',
    owner: 'u-john',
    status: 'resolved',
    decision: 'no_action',
    created_at: day(6),
    resolved_at: day(5),
  },
]

let users: Row[], content: Row[], reports: Row[], notes: Row[], history: Row[], audit: Row[]
let sequence = 0
export function resetModeration() {
  users = seedUsers()
  content = seedContent()
  reports = seedReports()
  notes = [
    {
      id: 'note-other',
      user_id: 'u-john',
      body: 'Second spam report this month',
      tag: 'warning',
      created_at: day(4),
      updated_at: null,
      author: { id: 'admin-other', name: 'Other Admin' },
    },
  ]
  history = [
    {
      id: 'h-1',
      user_id: 'u-ada',
      kind: 'ban',
      reason: 'Fraud or scams',
      created_at: day(3),
      performed_by: { id: ME.id, name: ME.name },
    },
  ]
  audit = [
    {
      id: 'a-1',
      action: 'auth:login',
      action_label: 'Signed in',
      module: 'authentication',
      actor: { id: ME.id, name: ME.name },
      target: { type: 'admin', reference: ME.id, name: ME.name },
      reason: null,
      ip: '127.0.0.1',
      created_at: day(0),
    },
    {
      id: 'a-2',
      action: 'user:ban',
      action_label: 'User banned',
      module: 'users',
      actor: { id: ME.id, name: ME.name },
      target: { type: 'user', reference: 'u-ada', name: 'adaobi' },
      reason: 'Fraud or scams',
      ip: '127.0.0.1',
      created_at: day(3),
    },
  ]
  sequence = 0
}
resetModeration()
export const moderationState = () => ({ users, content, reports, notes, history, audit })

const ok = (data?: JsonBodyType, status = 200) =>
  HttpResponse.json({ status: 'success', code: status, data }, { status })
const fail = (status: number, message: string) =>
  HttpResponse.json({ status: 'error', code: status, message }, { status })
const page = (items: Row[], url: URL, key: string, extra: Row = {}) => {
  const p = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 10)
  return {
    [key]: items.slice((p - 1) * limit, p * limit),
    total: items.length,
    currentPage: p,
    totalPages: Math.ceil(items.length / limit),
    ...extra,
  }
}
const userById = (id: string) => users.find((u) => u.id === id)
const person = (id: string) => {
  const u = userById(id)!
  return { id: u.id, username: u.username, display_name: u.display_name, avatar: null }
}
const log = (action: string, label: string, target: Row, reason: string | null = null) =>
  audit.unshift({
    id: `a-${++sequence}`,
    action,
    action_label: label,
    module: 'moderation',
    actor: { id: ME.id, name: ME.name },
    target,
    reason,
    ip: '127.0.0.1',
    created_at: now(),
  })

function reportRow(r: Row) {
  const item = content.find((c) => c.id === r.entity_id)
  const owner = userById(r.owner)!
  return {
    id: r.id,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    reason: r.reason,
    reason_code: r.reason_code,
    reason_label: r.reason,
    severity: r.severity,
    details: r.details ?? null,
    status: r.status,
    decision: r.decision ?? null,
    account_action: r.account_action ?? null,
    resolution_notes: r.notes ?? null,
    created_at: r.created_at,
    review_started_at: null,
    resolved_at: r.resolved_at ?? null,
    reporter: person(r.reporter),
    owner: {
      ...person(r.owner),
      moderation_status: owner.moderation_status,
      suspended_until: owner.suspended_until,
    },
    moderator: r.moderator ?? null,
    content: {
      text: item?.content ?? null,
      media: [],
      created_at: item?.created_at ?? owner.created_at,
      hidden: !!item?.hidden_at,
      deleted: false,
      ...(r.entity_type === 'comment' ? { post_id: item?.post_id } : {}),
    },
  }
}
const counts = (id: string) => ({
  reports_against: reports.filter((r) => r.owner === id).length,
  reports_submitted: reports.filter((r) => r.reporter === id).length,
  enforcement_actions: history.filter(
    (h) => h.user_id === id && ['suspend', 'ban'].includes(h.kind),
  ).length,
  warnings: history.filter((h) => h.user_id === id && h.kind === 'warning').length,
})
const detailRow = (r: Row) => ({
  ...reportRow(r),
  owner_profile: {
    created_at: userById(r.owner)!.created_at,
    status: 'active',
    bio: null,
    deleted: false,
    ...counts(r.owner),
  },
  reporter_profile: { created_at: userById(r.reporter)!.created_at, ...counts(r.reporter) },
  engagement: {
    likes: r.entity_type === 'post' ? 4 : null,
    comments: r.entity_type === 'post' ? 1 : null,
    reports: 2,
  },
  related_reports: reports
    .filter((o) => o.entity_id === r.entity_id && o.id !== r.id)
    .map((o) => ({
      id: o.id,
      reason: o.reason,
      reason_label: o.reason,
      status: o.status,
      created_at: o.created_at,
      reporter_username: userById(o.reporter)!.username,
    })),
})

function standing(u: Row) {
  if (
    u.moderation_status === 'suspended' &&
    u.suspended_until &&
    new Date(u.suspended_until) <= new Date()
  )
    return 'active'
  return u.moderation_status
}
function applyStanding(userId: string, kind: string, body: Row) {
  const u = userById(userId)
  if (!u) return fail(404, 'User not found.')
  const current = standing(u)
  const until = body.duration_days
    ? new Date(Date.now() + body.duration_days * 864e5).toISOString()
    : null
  if (kind === 'suspend' && current !== 'active')
    return fail(400, 'This user is already suspended.')
  if (kind === 'ban' && current === 'banned') return fail(400, 'This user is already banned.')
  if (kind === 'reinstate' && current === 'banned')
    return fail(400, 'Bans are permanent and cannot be lifted.')
  if (kind === 'reinstate' && current === 'active') return fail(400, 'This user is not suspended.')
  if (kind === 'extend' && current !== 'suspended')
    return fail(400, 'Only a current suspension can be extended.')
  u.moderation_status = kind === 'ban' ? 'banned' : kind === 'reinstate' ? 'active' : 'suspended'
  u.suspended_until = kind === 'suspend' || kind === 'extend' ? until : null
  history.unshift({
    id: `h-${++sequence}`,
    user_id: userId,
    kind,
    reason: body.reason ?? null,
    note: body.note ?? null,
    duration_days: body.duration_days ?? null,
    ends_at: u.suspended_until,
    created_at: now(),
    performed_by: { id: ME.id, name: ME.name },
  })
  log(
    `user:${kind}`,
    {
      suspend: 'User suspended',
      ban: 'User banned',
      reinstate: 'User reinstated',
      extend: 'Suspension changed',
    }[kind]!,
    { type: 'user', reference: userId, name: u.username },
    body.reason ?? null,
  )
  return ok({
    user_id: userId,
    moderation_status: u.moderation_status,
    suspended_until: u.suspended_until,
  })
}

const userRow = (u: Row): Row => {
  const last = history.find(
    (h) => h.user_id === u.id && ['suspend', 'ban', 'extend'].includes(h.kind),
  )
  const s = standing(u)
  return {
    ...u,
    moderation_status: s,
    status: 'active',
    avatar: null,
    reports_against: counts(u.id).reports_against,
    restriction:
      s !== 'active' && last
        ? {
            type: s,
            reason: last.reason,
            reason_code: null,
            started_at: last.created_at,
            duration_days: last.duration_days ?? null,
            last_action_at: last.created_at,
          }
        : null,
  }
}

type P = Record<string, string>
export const moderationHandlers = [
  // ---- moderation
  http.get(`${B}/moderation/summary`, () =>
    ok({
      pending: reports.filter((r) => r.status === 'pending').length,
      under_review: reports.filter((r) => r.status === 'under_review').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      actions_taken: reports.filter((r) => r.status === 'resolved' && r.decision !== 'no_action')
        .length,
    }),
  ),
  http.get(`${B}/moderation/reasons`, () =>
    ok({
      reasons: [
        { code: 'spam', label: 'Spam', severity: 1 },
        { code: 'fraud', label: 'Fraud or scams', severity: 2 },
        { code: 'harassment', label: 'Harassment or bullying', severity: 3 },
        { code: 'impersonation', label: 'Impersonation or fake account', severity: 2 },
      ],
    }),
  ),
  http.get(`${B}/moderation/moderators`, () => ok({ moderators: [{ id: ME.id, name: ME.name }] })),
  http.get(`${B}/moderation/reports`, ({ request }) => {
    const url = new URL(request.url)
    const q = (k: string) => url.searchParams.get(k)
    const search = q('search')?.toLowerCase()
    const rows = reports.filter(
      (r) =>
        (!q('status') || r.status === q('status')) &&
        (!q('entity_type') || r.entity_type === q('entity_type')) &&
        (!q('reason') || r.reason_code === q('reason')) &&
        (!search ||
          r.id.startsWith(search) ||
          r.entity_id.startsWith(search) ||
          [userById(r.owner)!.username, userById(r.reporter)!.username].some((n) =>
            n.includes(search),
          )),
    )
    return ok(page(rows.map(reportRow), url, 'reports'))
  }),
  http.get<P>(`${B}/moderation/reports/:id`, ({ params }) => {
    const r = reports.find((item) => item.id === params.id)
    return r ? ok(detailRow(r)) : fail(404, 'Report not found.')
  }),
  http.post<P>(`${B}/moderation/reports/:id/review`, ({ params }) => {
    const r = reports.find((item) => item.id === params.id)!
    if (r.status === 'resolved') return fail(400, 'This report has already been resolved.')
    r.status = 'under_review'
    r.moderator = { id: ME.id, name: ME.name }
    log('report:start_review', 'Report review started', {
      type: 'report',
      reference: r.id,
      name: null,
    })
    return ok(detailRow(r))
  }),
  http.post<P>(`${B}/moderation/reports/:id/resolve`, async ({ params, request }) => {
    const r = reports.find((item) => item.id === params.id)!
    const body = (await request.json()) as Row
    if (r.status === 'resolved') return fail(400, 'This report has already been resolved.')
    if (body.decision === 'remove_content') {
      const item = content.find((c) => c.id === r.entity_id)!
      Object.assign(item, { hidden_at: now(), hidden_reason: r.reason, hidden_by: ME.name })
      log(
        `${r.entity_type}:hide`,
        r.entity_type === 'post' ? 'Post removed' : 'Comment removed',
        { type: r.entity_type, reference: r.entity_id, name: null },
        r.reason,
      )
    }
    if (body.decision === 'account_action') {
      if (body.account_action === 'warning')
        history.unshift({
          id: `h-${++sequence}`,
          user_id: r.owner,
          kind: 'warning',
          reason: body.notes ?? 'Warning',
          created_at: now(),
          performed_by: { id: ME.id, name: ME.name },
        })
      else
        applyStanding(r.owner, body.account_action === 'ban' ? 'ban' : 'suspend', {
          duration_days: body.duration_days,
          reason: r.reason,
        })
    }
    for (const other of reports.filter(
      (o) => o.id === r.id || (o.entity_id === r.entity_id && o.status !== 'resolved'),
    ))
      Object.assign(other, {
        status: 'resolved',
        decision: body.decision,
        account_action: body.account_action ?? null,
        notes: body.notes ?? null,
        resolved_at: now(),
        moderator: { id: ME.id, name: ME.name },
      })
    log(
      'report:resolve',
      'Report resolved',
      { type: 'report', reference: r.id, name: null },
      r.reason,
    )
    return ok(detailRow(r))
  }),
  http.get<P>(`${B}/moderation/users/:id/reports`, ({ params, request }) => {
    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    return ok(
      page(
        reports
          .filter((r) => (role === 'reporter' ? r.reporter : r.owner) === params.id)
          .map(reportRow),
        url,
        'reports',
      ),
    )
  }),

  // ---- users
  http.get(`${B}/users/warning-templates`, () =>
    ok({
      templates: [
        { key: 'spam', label: 'Spam', message: 'Please stop posting promotional content.' },
        {
          key: 'harassment',
          label: 'Harassment',
          message: 'Please treat other members with respect.',
        },
      ],
    }),
  ),
  http.get(`${B}/users`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')?.toLowerCase()
    const status = url.searchParams.get('status')
    const flagged = url.searchParams.get('flagged') === 'true'
    const rows = users
      .map(userRow)
      .filter(
        (u) =>
          (!search ||
            [u.username, u.email, u.display_name, u.id].some((v) =>
              v.toLowerCase().includes(search),
            )) &&
          (!status ||
            (status === 'restricted'
              ? u.moderation_status !== 'active'
              : u.moderation_status === status)) &&
          (!flagged || u.reports_against > 0),
      )
    return ok(page(rows, url, 'users'))
  }),
  http.get<P>(`${B}/users/:id`, ({ params }) => {
    const u = userById(params.id!)
    if (!u) return fail(404, 'User not found.')
    const c = counts(u.id)
    return ok({
      ...userRow(u),
      phone_number: null,
      bio: null,
      activated_at: u.created_at,
      stats: {
        posts: 2,
        hidden_posts: content.filter((x) => x.owner === u.id && x.type === 'post' && x.hidden_at)
          .length,
        comments: 1,
        hidden_comments: content.filter(
          (x) => x.owner === u.id && x.type === 'comment' && x.hidden_at,
        ).length,
        likes_given: 3,
        likes_received: 7,
        tribe_following: 1,
        tribe_followers: 2,
        circle: 1,
        communities: 0,
        reports_against: c.reports_against,
        reports_submitted: c.reports_submitted,
        warnings: c.warnings,
        enforcement_actions: c.enforcement_actions,
        notes: notes.filter((n) => n.user_id === u.id).length,
      },
    })
  }),
  http.get<P>(`${B}/users/:id/flagged-content`, ({ params, request }) => {
    const items = content
      .filter((c) => c.owner === params.id && reports.some((r) => r.entity_id === c.id))
      .map((c) => {
        const rs = reports.filter((r) => r.entity_id === c.id)
        return {
          entity_type: c.type,
          entity_id: c.id,
          post_id: c.post_id ?? c.id,
          content: c.content,
          media: [],
          posted_at: c.created_at,
          report_count: rs.length,
          reasons: [...new Set(rs.map((r) => r.reason))],
          severity: Math.max(...rs.map((r) => r.severity)),
          first_reported_at: rs.at(-1)!.created_at,
          last_reported_at: rs[0]!.created_at,
          has_open_reports: rs.some((r) => r.status !== 'resolved'),
          hidden: !!c.hidden_at,
          deleted_by_author: false,
        }
      })
    const sort = new URL(request.url).searchParams.get('sort')
    if (sort === 'severity') items.sort((a, b) => b.severity - a.severity)
    if (sort === 'reports') items.sort((a, b) => b.report_count - a.report_count)
    return ok(page(items, new URL(request.url), 'items'))
  }),
  http.get<P>(`${B}/users/:id/moderation-history`, ({ params }) =>
    ok({ history: history.filter((h) => h.user_id === params.id) }),
  ),
  http.post<P>(`${B}/users/:id/suspend`, async ({ params, request }) =>
    applyStanding(params.id!, 'suspend', (await request.json()) as Row),
  ),
  http.patch<P>(`${B}/users/:id/suspension`, async ({ params, request }) =>
    applyStanding(params.id!, 'extend', (await request.json()) as Row),
  ),
  http.post<P>(`${B}/users/:id/ban`, async ({ params, request }) =>
    applyStanding(params.id!, 'ban', (await request.json()) as Row),
  ),
  http.post<P>(`${B}/users/:id/reinstate`, async ({ params, request }) =>
    applyStanding(params.id!, 'reinstate', (await request.json()) as Row),
  ),
  http.get<P>(`${B}/users/:id/notes`, ({ params }) =>
    ok({ notes: notes.filter((n) => n.user_id === params.id) }),
  ),
  http.post<P>(`${B}/users/:id/notes`, async ({ params, request }) => {
    const body = (await request.json()) as Row
    notes.unshift({
      id: `note-${++sequence}`,
      user_id: params.id,
      body: body.body,
      tag: body.tag ?? null,
      created_at: now(),
      updated_at: null,
      author: { id: ME.id, name: ME.name },
    })
    log('user:note_add', 'Note added', {
      type: 'user',
      reference: params.id,
      name: userById(params.id!)?.username,
    })
    return ok({ notes: notes.filter((n) => n.user_id === params.id) }, 201)
  }),
  http.patch<P>(`${B}/users/:id/notes/:noteId`, async ({ params, request }) => {
    const note = notes.find((n) => n.id === params.noteId)
    if (!note) return fail(404, 'Note not found.')
    if (note.author.id !== ME.id) return fail(403, 'Only the author can change this note.')
    const body = (await request.json()) as Row
    Object.assign(note, { body: body.body, tag: body.tag ?? null, updated_at: now() })
    return ok({ notes: notes.filter((n) => n.user_id === params.id) })
  }),
  http.delete<P>(`${B}/users/:id/notes/:noteId`, ({ params }) => {
    const note = notes.find((n) => n.id === params.noteId)
    if (!note) return fail(404, 'Note not found.')
    if (note.author.id !== ME.id) return fail(403, 'Only the author can change this note.')
    notes = notes.filter((n) => n !== note)
    return ok({ notes: notes.filter((n) => n.user_id === params.id) })
  }),
  http.post<P>(`${B}/users/:id/warnings`, async ({ params, request }) => {
    const body = (await request.json()) as Row
    const message =
      body.message ??
      (body.template_key === 'spam'
        ? 'Please stop posting promotional content.'
        : 'Please treat other members with respect.')
    history.unshift({
      id: `h-${++sequence}`,
      user_id: params.id,
      kind: 'warning',
      reason: message,
      acknowledged_at: null,
      created_at: now(),
      performed_by: { id: ME.id, name: ME.name },
    })
    log(
      'user:warn',
      'Warning sent',
      { type: 'user', reference: params.id, name: userById(params.id!)?.username },
      message,
    )
    return ok({ id: `w-${sequence}` }, 201)
  }),

  // ---- hidden content
  http.get(`${B}/hidden-content`, ({ request }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') ?? 'post'
    const search = url.searchParams.get('search')?.toLowerCase()
    const hidden = content.filter((c) => c.hidden_at)
    const items = hidden
      .filter((c) => c.type === type && (!search || c.content.toLowerCase().includes(search)))
      .map((c) => ({
        type: c.type,
        id: c.id,
        post_id: c.post_id ?? c.id,
        content: c.content,
        media: [],
        posted_at: c.created_at,
        hidden_at: c.hidden_at,
        hidden_reason: c.hidden_reason,
        report_id: null,
        author: person(c.owner),
        hidden_by: { id: ME.id, name: c.hidden_by },
        parent_post_content: c.parent ?? null,
      }))
    return ok(
      page(items, url, 'items', {
        counts: {
          posts: hidden.filter((c) => c.type === 'post').length,
          comments: hidden.filter((c) => c.type === 'comment').length,
        },
      }),
    )
  }),
  http.post<P>(`${B}/hidden-content/:type/:id/restore`, ({ params }) => {
    const item = content.find((c) => c.id === params.id && c.hidden_at)
    if (!item) return fail(404, 'Hidden content not found.')
    Object.assign(item, { hidden_at: null, hidden_reason: null })
    log(
      `${item.type}:restore`,
      item.type === 'post' ? 'Post restored' : 'Comment restored',
      { type: item.type, reference: item.id, name: null },
      'Restored after review',
    )
    return ok({ id: item.id, type: item.type })
  }),

  // ---- audit log
  http.get(`${B}/audit-logs/filters`, () =>
    ok({
      actions: [...new Set(audit.map((a) => a.action))].map((value) => ({
        value,
        label: audit.find((a) => a.action === value)!.action_label,
      })),
      actors: [{ id: ME.id, name: ME.name }],
      categories: [],
    }),
  ),
  http.get(`${B}/audit-logs`, ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const action = url.searchParams.get('action')
    const rows = audit.filter(
      (a) =>
        (!category ||
          (category === 'moderation'
            ? a.module !== 'authentication'
            : a.module === 'authentication')) &&
        (!action || a.action === action),
    )
    return ok(page(rows, url, 'entries'))
  }),
]
