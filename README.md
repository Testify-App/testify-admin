# Testify Admin

Administration portal for Testify. Same stack and conventions as the ERS admin portal, with no
feature modules yet.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 + shadcn/ui (new-york) components in `src/components/ui`
- Redux Toolkit + RTK Query (`src/lib/api/base-api.ts`), redux-persist (session only)
- React Router 7, react-hook-form + zod, sonner toasts, lucide icons
- Vitest + Testing Library + MSW, oxlint, prettier

## Getting started

```bash
cp .env.example .env   # set VITE_API_BASE_URL
npm install
npm run dev
```

Scripts: `npm run build`, `npm test`, `npm run lint`, `npm run format`.

## Structure

```
src/
  app/          store, session slice, router (lazy routes per screen)
  assets/       logo and mock imagery cropped from the design mockups (assets/mock)
  components/   ui (shadcn), layout (AdminLayout) and testify (dark design-system pieces:
                DataTable/TableCard, Pagination, SelectField, StatusPill, Panel/InfoCard, dialogs,
                SheetDialog, FilterPopover, Toggle)
  features/     overview, moderation (queue, report detail, reporter/owner profiles),
                reports, users, audit-log, hidden-content, roles (roles & permissions),
                staff (staff management), settings, auth
  lib/          api (baseApi, errors, pagination), utils, hooks
  pages/        not-found
  test/         setup, MSW server, renderApp helper
```

Every screen talks to the testify-backend admin API (`/backoffice/...`); nothing is mocked in the
running app.

Sign-in, roles and staff talk to the testify-backend admin API (`/backoffice/...`):

- **Auth** (`features/auth/`): password, then a 6-digit emailed code (`/sign-in/verify`);
  forgot password (`/forgot-password`); invitation acceptance (`/accept-invite?token=…`).
  `RequireAuth` reloads `/auth/me` so role and permission changes apply without signing out.
- **Permissions**: `usePermission('staff:update')` hides what the admin can't do and the sidebar
  only lists modules they can view. The API enforces every check regardless.
- **Roles & staff** (`features/roles/access-api.ts`): RTK Query endpoints mapped onto the
  `Role` / `StaffMember` types in `features/roles/model.ts`.
- **Moderation, Overview, Reports** (`features/moderation/moderation-api.ts`): report queue,
  report detail and decisions (no action, remove content, warn / suspend / ban), statistics and
  CSV export.
- **Users** (`features/users/users-api.ts`): search and filters, the Suspended / Banned list, member
  profile (metadata, flagged content, moderation history, notes) and account actions.
- **Hidden Content** (`features/hidden-content/hidden-api.ts`) and **Audit Log**
  (`features/audit-log/audit-api.ts`).

Tests answer these endpoints from in-memory backends (`src/test/backoffice-mock.ts` for auth,
roles and staff, seeded from `src/test/fixtures/backoffice-seed.ts`, and
`src/test/moderation-mock.ts` for the moderation modules) that applies the same rules as the server; it
resets before each test. In the dev server every screen above talks to the backend set in
`VITE_API_BASE_URL`, so run testify-backend alongside it.

## Adding a module

1. Create `src/features/<module>/` with its pages, `<module>-api.ts` (`baseApi.injectEndpoints`)
   and, if needed, a slice.
2. Register the reducer in `src/app/store.ts` and its tag types in `baseApi`.
3. Add routes in `src/app/router.tsx` and a nav entry in `src/components/layout/admin-layout.tsx`.
4. Add tests next to the feature (`*.test.tsx`), mocking the API with MSW (`server.use(...)`).
