// Seed data for the in-memory backoffice API used by the tests (see ../backoffice-mock.ts).
import { allPermissionIds } from '@/features/roles/model'

export interface FixtureRole {
  id: string
  name: string
  description: string
  permissionIds: string[]
  status: 'Active' | 'Inactive'
  createdAt: string
  createdBy: string | null
  builtIn: boolean
}

export type FixtureStatus = 'active' | 'suspended' | 'pending_invitation'
export interface FixtureActivity {
  id: string
  action: string
  actor: string | null
  detail?: string
  role?: string
  createdAt: string
}
export interface FixtureStaff {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  roleId: string | null
  status: FixtureStatus
  createdAt: string
  lastLogin: string | null
  isRoot: boolean
  activity: FixtureActivity[]
}

const toFixtureStatus = {
  Active: 'active',
  Inactive: 'suspended',
  Pending: 'pending_invitation',
} as const

export const seedRoles: FixtureRole[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Full access to every module of the Testify admin portal.',
    permissionIds: allPermissionIds,
    status: 'Active',
    createdAt: '2026-01-12T09:00:00.000Z',
    createdBy: null,
    builtIn: true,
  },
  {
    id: 'moderator',
    name: 'Moderator',
    description: 'Reviews reported testimonies and decides on the moderation action to take.',
    permissionIds: [
      'overview:view',
      'moderation:view',
      'moderation:update',
      'moderation:export',
      'reports:view',
      'reports:export',
      'users:view',
      'users:update',
      'audit:view',
      'hidden:view',
      'hidden:update',
    ],
    status: 'Active',
    createdAt: '2026-03-04T10:30:00.000Z',
    createdBy: 'Adaeze Okafor',
    builtIn: false,
  },
  {
    id: 'content-reviewer',
    name: 'Content Reviewer',
    description: 'Reviews hidden posts and comments, and restores content cleared on appeal.',
    permissionIds: ['overview:view', 'moderation:view', 'hidden:view', 'hidden:update'],
    status: 'Active',
    createdAt: '2026-05-19T14:10:00.000Z',
    createdBy: 'Adaeze Okafor',
    builtIn: false,
  },
  {
    id: 'trust-analyst',
    name: 'Trust & Safety Analyst',
    description: 'Tracks moderation trends and exports reports for the weekly safety review.',
    permissionIds: [
      'overview:view',
      'overview:export',
      'reports:view',
      'reports:export',
      'audit:view',
      'audit:export',
    ],
    status: 'Active',
    createdAt: '2026-09-02T08:45:00.000Z',
    createdBy: 'Tunde Bakare',
    builtIn: false,
  },
  {
    id: 'support-agent',
    name: 'Support Agent',
    description: 'Answers member questions and looks up accounts and their report history.',
    permissionIds: ['overview:view', 'users:view', 'reports:view'],
    status: 'Inactive',
    createdAt: '2026-07-22T16:20:00.000Z',
    createdBy: 'Tunde Bakare',
    builtIn: false,
  },
]

type Seed = [
  id: string,
  first: string,
  last: string,
  phone: string,
  roleId: string | null,
  status: keyof typeof toFixtureStatus,
  createdAt: string,
  lastLogin: string | null,
]

const people: Seed[] = [
  [
    'adaeze',
    'Adaeze',
    'Okafor',
    '+234 803 555 0142',
    'super-admin',
    'Active',
    '2026-01-12T09:00:00.000Z',
    '2026-11-08T08:12:00.000Z',
  ],
  [
    'tunde',
    'Tunde',
    'Bakare',
    '+234 806 555 0187',
    'super-admin',
    'Active',
    '2026-02-03T11:00:00.000Z',
    '2026-11-07T17:40:00.000Z',
  ],
  [
    'grace',
    'Grace',
    'Mensah',
    '+233 24 555 0110',
    'moderator',
    'Active',
    '2026-03-06T09:15:00.000Z',
    '2026-11-08T07:55:00.000Z',
  ],
  [
    'daniel',
    'Daniel',
    'Eze',
    '+234 809 555 0163',
    'moderator',
    'Active',
    '2026-03-11T13:25:00.000Z',
    '2026-11-06T19:02:00.000Z',
  ],
  [
    'amara',
    'Amara',
    'Nwosu',
    '+234 802 555 0129',
    'moderator',
    'Inactive',
    '2026-04-02T10:05:00.000Z',
    '2026-09-30T12:00:00.000Z',
  ],
  [
    'samuel',
    'Samuel',
    'Adeyemi',
    '+234 805 555 0174',
    'content-reviewer',
    'Active',
    '2026-05-21T15:40:00.000Z',
    '2026-11-08T06:30:00.000Z',
  ],
  ['ruth', 'Ruth', 'Okonkwo', '', 'content-reviewer', 'Pending', '2026-11-02T09:50:00.000Z', null],
  [
    'kwame',
    'Kwame',
    'Asante',
    '+233 20 555 0138',
    'trust-analyst',
    'Active',
    '2026-09-04T08:00:00.000Z',
    '2026-11-05T10:20:00.000Z',
  ],
  [
    'blessing',
    'Blessing',
    'Udo',
    '+234 701 555 0191',
    'support-agent',
    'Active',
    '2026-07-24T12:35:00.000Z',
    '2026-10-28T14:45:00.000Z',
  ],
  [
    'michael',
    'Michael',
    'Johnson',
    '+1 415 555 0123',
    'moderator',
    'Pending',
    '2026-11-06T16:15:00.000Z',
    null,
  ],
  [
    'esther',
    'Esther',
    'Ibrahim',
    '+234 813 555 0105',
    null,
    'Pending',
    '2026-11-07T11:30:00.000Z',
    null,
  ],
  [
    'joseph',
    'Joseph',
    'Okoro',
    '+234 816 555 0156',
    'trust-analyst',
    'Inactive',
    '2026-09-10T09:20:00.000Z',
    '2026-10-01T09:00:00.000Z',
  ],
]

export const seedStaff: FixtureStaff[] = people.map(
  ([id, firstName, lastName, phone, roleId, status, createdAt, lastLogin]) => ({
    id,
    firstName,
    lastName,
    email: `${firstName}.${lastName}@testify.app`.toLowerCase(),
    phone,
    roleId,
    status: toFixtureStatus[status],
    createdAt,
    lastLogin,
    isRoot: id === 'adaeze',
    activity: [
      {
        id: `${id}-invited`,
        action: 'staff:invite',
        actor: id === 'adaeze' ? null : 'Adaeze Okafor',
        createdAt,
      },
      ...(lastLogin
        ? [
            {
              id: `${id}-login`,
              action: 'auth:login',
              actor: `${firstName} ${lastName}`,
              createdAt: lastLogin,
            },
          ]
        : []),
      ...(status === 'Inactive'
        ? [
            {
              id: `${id}-suspended`,
              action: 'admin:suspend',
              actor: 'Adaeze Okafor',
              detail: 'Admin layoff/Resignation.',
              createdAt: lastLogin ?? createdAt,
            },
          ]
        : []),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }),
)
