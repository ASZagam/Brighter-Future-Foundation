# Development Guide

How to work on the BFF Platform: the development loop, conventions, verification
steps and the gotchas that have bitten us before.

## Guiding principle

> **Inspect and reuse before you build.**

This is an existing application. Before adding anything, read the current routes,
models, serializers, viewsets and components, then reuse them. Only implement what is
actually missing, and never introduce parallel/duplicate models, APIs, components or
auth systems. See [`master_prompt .md`](../master_prompt%20.md).

## Development loop

Run both services in separate terminals.

```bash
# Terminal 1 — Django
cd backend
source .venv/bin/activate          # or: source ../venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# Terminal 2 — Next.js
cd /home/trainee1/BFS
npm run dev
```

- Front end: http://localhost:3000
- API: http://localhost:8000/api/
- Swagger: http://localhost:8000/api/docs/

## Adding a feature end-to-end

1. **Backend model** (only if genuinely missing) in the correct app. Follow the
   conventions in [DATA_MODEL.md](DATA_MODEL.md): UUID PK, auto code ID, timestamps,
   `clean()`, audit `AuditService.log` where it matters.
2. **Migration**: `python manage.py makemigrations && python manage.py migrate`.
3. **Serializer** in `core/serializers.py` (or `accounts/serializers.py`). Add
   read-only convenience fields (e.g. `state_name`) with `source=`/`SerializerMethodField`.
4. **ViewSet / APIView** in `core/views.py` (or `program_views.py`). Declare
   `serializer_class`, `permission_classes`, `filterset_fields`, `search_fields`,
   `ordering_fields`, and `@action` methods for non-CRUD operations.
5. **Route**: register with the router in `core/api_urls.py`.
6. **Front-end API helper**: extend `lib/memberApi.ts` / `lib/volunteerApi.ts` or call
   `apiGet/apiPost/apiPatch/apiDelete` directly.
7. **Page**: build it inside the ops shell (see below) or the public shell.
8. **Seed** demo data in `core/management/commands/seed_demo.py` when useful.
9. **Verify** (next section).

## Front-end conventions

### Ops shell pages
Pages under `/dashboard`, `/programs`, `/members`, `/volunteers`, `/beneficiaries`,
`/core`, `/admin`, `/settings` use the operations shell. The canonical pattern (see
`app/core/CoreShell.tsx` and `app/settings/SettingsShell.tsx`):

```tsx
export default function SomethingShell() {
  return (
    <div className="db-shell">
      <Sidebar user={user} />
      <div className="db-main">
        <TopHeader notificationCount={3} />
        <SomethingContent />
      </div>
    </div>
  );
}
```

When you add a new ops route, also:
- add it to the `isOperationsShell` list in `app/LayoutShell.tsx`;
- add a breadcrumb case in `app/dashboard/components/TopHeader.tsx`;
- ensure the `Sidebar` entry's `isActive()` matches (exact path or `path/...`).

### Data fetching
- Use `lib/api.ts` (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`) — never fetch Django
  directly from a component.
- List endpoints return `{ count, next, previous, results }`. **Unwrap `.results`.**
- Handle loading, empty and error states explicitly.
- Prefer server-side filtering/search/ordering/pagination over client-side slicing.

### Styling
Hand-written CSS only. Reuse existing tokens/classes from `app/globals.css` and
`app/dashboard/dashboard.css`; add a feature stylesheet next to the page when needed.
Match the existing visual language (`member-kpi`, `core-panel`, `core-heading`, …).

## Backend conventions

- Permissions come from `accounts.permissions` (see
  [RBAC.md](../backend/accounts/RBAC.md)). Safe methods are generally allowed; writes
  are restricted.
- Global pagination is `PAGE_SIZE = 20`. Don't add per-view `page_size` unless required.
- Register filter/search/ordering on the viewset; don't reimplement it in the serializer.
- Record meaningful mutations with `AuditService.log(...)`.
- Keep the model's business rules in `clean()` (and call `full_clean()` in `save()` if
  the model already does).

## Verification

There is no browser-based test harness here; verify with static checks and API smoke
tests.

```bash
# Front end type-check
npx tsc --noEmit

# Django system checks
cd backend && python manage.py check

# API smoke through the Next.js proxy (preferred — exercises the real path)
curl -sL -H "Cookie: accessToken=<jwt>" \
  http://localhost:3000/api/backend/core/members/stats/
```

Route status check:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/members
```

For backend-only checks you can drive DRF with the test client. Django's
`ALLOWED_HOSTS` only includes `localhost,127.0.0.1`, so pass `HTTP_HOST`:

```python
from rest_framework.test import APIClient
from accounts.models import User

client = APIClient()
client.force_authenticate(user=User.objects.filter(is_superuser=True).first())
client.get('/api/core/settings/current/', HTTP_HOST='localhost')
```

### Test suite
`python manage.py test` requires the database user to be able to create databases.
In some environments that permission is missing and you'll see
`Got an error creating the test database: permission denied to create database`. Fix
by granting `CREATEDB` to the role, or rely on the smoke checks above.

## Known gotchas

- **API base is `/api/`, not `/api/v2/`.** Older docs may mention `v2` — ignore them.
- **Trailing slashes.** Django expects them; the proxy appends them automatically.
- **Proxy path.** `/api/backend/<path>` → `${DJANGO_API_URL}/<path>/`. If the backend
  URL env is unset it defaults to `http://localhost:8000/api`.
- **Error shape.** Django returns `{ "detail": "..." }`; the front end's `apiCall`
  currently looks for an `error` key, so some messages fall back to
  `API call failed: <status>`. Handle both when adding UI error handling.
- **Pagination unwrapping.** Always read `response.results` from list endpoints.
- **DRF boolean form fields.** With `multipart/form-data`, omitted booleans default to
  `False`. Mark booleans read-only on file-upload serializers when they shouldn't be
  client-controlled.
- **`utils` / methods.** `User.get_full_name` is a method (call it); in serializers use
  `source="user.get_full_name"` to let DRF call it.
- **Audit source.** Read the audit trail from `accounts.AuditLog`, not the legacy
  `core.ActivityLog`.
- **Decimal fields.** Django 5.2 `DecimalField` expects strings for lat/long in some
  code paths (`Volunteer.latitude/longitude`).
- **`batch-log-hours`** takes a human `program_id` (e.g. `PRG-2026-00006`), not a UUID.
- **`/settings` auto-provisions** a default `Organization` if none exists, so the page
  is never empty on a fresh database.
- **Duplicate `ProgramViewSet`.** `core/program_views.py` is the one wired into the
  router; the `ProgramViewSet` in `core/views.py` is legacy and unused — don't extend it.
- **Seeded reference data.** `seed_demo` does not create countries, states, news or
  notifications, so those pages legitimately show empty states.

## Demo data

```bash
python manage.py seed_demo          # create (skips if volunteers + members exist)
python manage.py seed_demo --reset  # clear then recreate
python manage.py seed_demo --clear  # remove demo records only
```

Records are tagged `DEMO-SEED` in `notes` and are safe to delete. The command seeds
volunteers (with skills, trainings, hour logs), programs and members.

## Environment notes

- Backend reads `backend/.env` (loaded by `python-dotenv`). Copy from
  `backend/.env.example`.
- Front end reads `.env.local` (copy from `.env.local.example`). `NEXT_PUBLIC_DJANGO_API_URL`
  is the one that must point at Django.
- `.env` and `.env.local` are git-ignored — never commit secrets.
- Development defaults to SQLite; set `DATABASE_ENGINE=django.db.backends.postgresql`
  for PostgreSQL (or use `docker-compose up db`).

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Front end can't reach the API | Django not running, or `NEXT_PUBLIC_DJANGO_API_URL` wrong |
| `400` HTML with `DisallowedHost` | Add the host to `DJANGO_ALLOWED_HOSTS`, or call with `localhost` |
| `401` on every request | Access token expired and refresh failed — sign in again |
| Empty list despite data | You read the array directly instead of `.results` |
| `308` redirects from `curl` | Django's trailing-slash redirect — use `-L` or include the slash |
| Settings page empty | Fixed: `/settings/current/` auto-creates a default organization |
| `permission denied to create database` on tests | Grant `CREATEDB` to the DB role or use smoke tests |

## Commit hygiene

- Only commit when asked to. Inspect `git status` / `git diff` first.
- Keep changes scoped and match the existing code style (no stray comments, no
  speculative abstractions).
- Never commit `.env`, tokens or uploaded media.
