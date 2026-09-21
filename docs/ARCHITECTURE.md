# Architecture

This document explains how the BFF Platform is put together: the two applications,
how a request travels from the browser to PostgreSQL, the operations-shell design
system, and how the stack is deployed.

## 1. High-level view

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser                                                            │
│   Next.js pages (React 18, TypeScript)                             │
│     • ops shell pages      • public pages (Header + footer)        │
│   lib/api.ts → /api/backend/...  (same-origin)                     │
└───────────────────────────────┬────────────────────────────────────┘
                                │  HttpOnly cookies: accessToken, refreshToken
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│ Next.js server (:3000)                                             │
│   app/api/auth/*        → sets/clears cookies, calls Django        │
│   app/api/backend/[...path] → generic reverse proxy                │
│   app/api/donations|events|news|members|volunteers → legacy routes │
└───────────────────────────────┬────────────────────────────────────┘
                                │  Authorization: Bearer <accessToken>
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│ Django + DRF (:8000)                                               │
│   accounts/  JWT auth, users, roles/RBAC, audit log                │
│   core/      programs, members, volunteers, org, files, ref data   │
│   PostgreSQL (prod) / SQLite (dev)                                 │
└────────────────────────────────────────────────────────────────────┘
```

Two Django apps carry the domain:

- **`accounts`** — custom `User`, `Role`/`UserRole`, tokens, `AuditLog`, permissions and the auth endpoints.
- **`core`** — everything operational: programs, members, volunteers, organization/profile/settings, reference data, notifications, file uploads, donations, events and news.

## 2. Backend

### 2.1 Project configuration (`backend/bff/settings.py`)

- Custom user model: `AUTH_USER_MODEL = "accounts.User"`.
- Authentication: SimpleJWT `JWTAuthentication` + DRF `SessionAuthentication`.
- Default permission: `IsAuthenticatedOrReadOnly` (individual views narrow this).
- Pagination: global `PageNumberPagination`, `PAGE_SIZE = 20` — list responses are
  `{ "count": n, "next": ..., "previous": ..., "results": [...] }`.
- Filtering: `DjangoFilterBackend`, `SearchFilter`, `OrderingFilter` globally.
- Schema: `drf-spectacular`.
- Email: SMTP when `EMAIL_HOST_USER` + `EMAIL_HOST_PASSWORD` are set, otherwise the
  console backend (useful in development).
- CORS: `CORS_ALLOWED_ORIGINS`, credentials enabled.

### 2.2 URL map (`backend/bff/urls.py`)

| Prefix | Module | Purpose |
| --- | --- | --- |
| `/admin/` | Django admin | Staff back office |
| `/accounts/` | `accounts.urls` | placeholder (empty) |
| `/dashboard/` | `dashboard.urls` | placeholder (empty) |
| `/api/` | `accounts.api_urls` | Auth endpoints |
| `/api/core/` | `core.api_urls` | All domain endpoints |
| `/api/schema/` | drf-spectacular | OpenAPI schema |
| `/api/docs/` | drf-spectacular | Swagger UI |

> **Note:** the live API base is `/api/...`, **not** `/api/v2/...`. Any older reference
> to a `v2` prefix is stale.

### 2.3 Views and routers

`core/api_urls.py` registers DRF `DefaultRouter` viewsets:

- `organizations`, `settings`, `countries`, `states`
- `notifications`, `activity-logs`, `file-uploads`
- `members`, `volunteers`, `volunteer-hours`, `volunteer-skills`
- `programs`, `program-categories`, `program-beneficiaries`, `program-documents`,
  `program-gallery`, `program-reports`, `program-volunteer-assignments`
- `donations`, `events`, `news`

Plus function-style paths: `programs/dashboard/`, `dashboard-statistics/`,
`system-info/`, `organization/`.

Custom actions (search `@action` in `core/views.py`) provide the operations features:
`members/stats/`, `members/export/`, `members/{id}/set-status/`,
`volunteers/dashboard/`, `volunteers/stats/`, `volunteers/export/`,
`volunteers/batch-log-hours/`, `volunteers/{id}/reassign|suspend|reactivate/`,
`volunteers/{id}/id-card/`, `volunteers/locations/`,
`volunteer-hours/{id}/approve|reject|query/`, `settings/current/`,
`notifications/{id}/mark_read/`, `notifications/mark_all_read/`.

### 2.4 Permissions / RBAC

Role constants live in `accounts.models.Roles` and are checked by the reusable
permission classes in `accounts.permissions`:

| Class | Grants |
| --- | --- |
| `IsSuperAdmin` | superuser / `super_admin` |
| `IsAdmin` | `admin` (also always allows safe methods) |
| `IsCoordinator` | `coordinator` |
| `IsVolunteer` / `IsMember` | matching role |
| `IsAuthenticatedOrRole` | any authenticated user; safe methods for everyone |
| `CanManageVolunteer` | admins/coordinators, or a volunteer editing themselves |
| `CanManageMember` | admins/coordinators |

`core.permissions.IsOrganizationAdmin` guards organization administration.

See [backend/accounts/RBAC.md](../backend/accounts/RBAC.md) for how to protect new
viewsets.

### 2.5 Audit logging

All privileged actions are recorded in `accounts.AuditLog` via
`accounts.services.AuditService.log(user, action, request, details)`.

- `action` is a string such as `member_created`, `volunteer_status_changed`,
  `login`, `failed_login`, `password_change`.
- A category is derived from the action prefix (e.g. `member_` → *member*,
  `beneficiary_` → *program*).
- `/api/core/activity-logs/` and the `/admin` page read from this table.

> The legacy `core.ActivityLog` model exists but is not written to; the live audit
> trail is `accounts.AuditLog`.

## 3. Frontend

### 3.1 App Router and shells

`app/LayoutShell.tsx` picks a shell per route:

- **Operations shell** (`/dashboard`, `/programs`, `/members`, `/volunteers`,
  `/beneficiaries`, `/core`, `/admin`, `/settings`): renders the page as-is; each page
  mounts its own `db-shell` with the shared `Sidebar` + `TopHeader`.
- **Public shell** (everything else, e.g. `/donations`, `/events`, `/news`,
  `/references`, `/notifications`, `/file-uploads`): renders the public `Header`,
  content and footer.

The ops shell composition is: `db-shell` → `Sidebar` + `db-main` (`TopHeader` + page
content). See `app/core/CoreShell.tsx` and `app/settings/SettingsShell.tsx` for the
canonical pattern.

### 3.2 API access (`lib/api.ts`)

```ts
apiGet('/core/members/stats/')
// → fetch('/api/backend/core/members/stats/', { credentials: 'include' })
```

- `apiCall` prefixes `/api/backend` and JSON-encodes bodies (except `FormData`).
- `fetchWithAuth` retries once on `401` by calling `/api/auth/refresh`; on failure it
  redirects to `/auth/login`.
- Domain modules wrap these helpers: `lib/memberApi.ts`, `lib/volunteerApi.ts`.

Because requests are same-origin to Next.js, the HttpOnly cookies are sent
automatically and no token is exposed to JavaScript.

### 3.3 The reverse proxy (`app/api/backend/[...path]/route.ts`)

Exports `GET/POST/PUT/PATCH/DELETE/OPTIONS`. For each request it:

1. Joins the path segments and **appends a trailing slash** (Django expects it).
2. Forwards to `DJANGO_API_URL` (default `http://localhost:8000/api`).
3. Strips `host`, and if an `accessToken` cookie is present adds
   `Authorization: Bearer <token>`.
4. Streams the Django response (status + headers) straight back.

### 3.4 Auth flow

`app/api/auth/*` route handlers own the cookies:

1. **Login** (`/api/auth/login`) → exchanges credentials with Django
   `/api/auth/login/` and sets `accessToken` (15 min) and `refreshToken` (7 days) as
   `HttpOnly`, `SameSite=Lax` cookies.
2. **Refresh** (`/api/auth/refresh`) → rotates tokens when the access token expires.
3. **Me** (`/api/auth/me`) → returns the current user to populate the sidebar.
4. **Logout** (`/api/auth/logout`) → clears both cookies.

A shared helper `app/api/backendClient.ts` builds the Django URL from env.

### 3.5 Design system

Styling is hand-written CSS (no UI framework). Shared tokens and component classes
live in `app/globals.css` and `app/dashboard/dashboard.css`; feature pages add their
own stylesheet (`core.css`, `members.css`, `volunteers.css`, `settings.css`, …).

Common building blocks: `db-shell`, `db-main`, `db-sidebar`, `member-kpi`,
`core-panel`, `core-heading`, `core-live-notice`, and the `PageHeader` component.

### 3.6 Legacy data routes

`app/api/dashboard`, `/donations`, `/events`, `/news`, `/members`, `/volunteers` are
earlier Next.js route handlers kept for compatibility. New work should call Django
through `lib/api.ts` and the `/api/backend` proxy instead.

## 4. Request lifecycle example

Fetching the member roster:

```
MembersRoster.tsx
  apiGet('/core/members/?search=aisha&status=active&page=1')
    → GET /api/backend/core/members/?search=aisha&status=active&page=1
      → proxy appends slash, adds Bearer token
        → Django MemberViewSet (IsAuthenticatedOrRole, filterset + search + ordering)
          → JSON { count, next, previous, results: [...] }
    ← unwrap `.results` in the component
```

## 5. Deployment

`docker-compose.yml` defines:

- `db` — PostgreSQL 15 with a named volume.
- `web` — the Django image (`backend/Dockerfile`, gunicorn on `:8000`), waiting on `db`.

The Next.js app is deployed separately (`npm run build` / `npm start`) and pointed at
the API via `NEXT_PUBLIC_DJANGO_API_URL`.

Production checklist:

- Switch `DATABASE_ENGINE` to PostgreSQL and set secure credentials.
- Generate a strong `DJANGO_SECRET_KEY` (it also signs JWTs).
- `DJANGO_DEBUG=False` and an explicit `DJANGO_ALLOWED_HOSTS`.
- Serve over HTTPS; the auth cookies already set `secure` in production.
- Run `collectstatic` and `migrate`.
- Configure a real email backend and `FRONTEND_URL`.

## 6. Security model

- Passwords hashed by Django; account lockout after repeated failed logins.
- JWT access tokens are short-lived and rotated on refresh.
- Tokens live in HttpOnly cookies — never in `localStorage`.
- RBAC enforced server-side by DRF permission classes.
- CORS restricted to known origins with credentials enabled.
- Privileged mutations recorded in the audit log.
