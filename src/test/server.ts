import { setupServer } from 'msw/node'
import { backofficeHandlers } from './backoffice-mock'
import { moderationHandlers } from './moderation-mock'

// MSW server for tests, answering the backoffice API from an in-memory store by default.
// Feature tests add or override handlers with `server.use(http.get(...))`.
export const server = setupServer(...backofficeHandlers, ...moderationHandlers)
