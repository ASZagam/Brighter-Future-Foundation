# API Reference

Base URL (development): `http://localhost:8000/api`

The browser never calls Django directly — pages call `lib/api.ts`, which targets the
same-origin proxy at `/api/backend/...`. See
[ARCHITECTURE.md](ARCHITECTURE.md#33-the-reverse-proxy-appapibackendpathroutets).

## Conventions

### Authentication
Send the JWT access token as a bearer header:

```
Authorization: Bearer <access_token>
```

In the browser this is injected automatically from the `accessToken` HttpOnly cookie
by the Next.js proxy. Anonymous access is allowed for safe methods on some endpoints
(DRF default `IsAuthenticatedOrReadOnly`); writes generally require authentication.

### Pagination
List endpoints are paginated with `PageNumberPagination` (`PAGE_SIZE = 20`):

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/core/members/?page=3",
  "previous": null,
  "results": [ { "...": "..." } ]
}
```

Query params: `?page=N`. (There is no client-controlled `page_size`.)

### Filtering, search, ordering
Where the viewset declares them:

- `?field=value` — exact filter via `django-filter`
- `?search=term` — full-text-ish search across `search_fields`
- `?ordering=field` / `?ordering=-field` — sort across `ordering_fields`

### Errors
- `400` validation → `{ "field": ["message"] }`
- `401`/`403`/`404` → `{ "detail": "message" }`

> The front end's `apiCall` reads `detail` first, then `error`, and attaches the HTTP
> status to the thrown error, so UI handlers can branch on `err.status`.

### Trailing slash
Django expects a trailing slash. The proxy adds it automatically; from `curl` or
scripts, include it.

### Public API — `/api/v2/public/`

A separate, unauthenticated namespace for the public marketing site. It is versioned
independently of the management API so the public contract cannot drift. **No
credentials are required** for any endpoint in this section, and none expose personal
or internal data.

| Endpoint | Method | Returns |
| --- | --- | --- |
| `/organization/` | GET | Active `OrganizationProfile`, or `404` if none is published |
| `/impact-summary/` | GET | `metrics[]` (label/value/available/unit/source), `transparency`, `countries` |
| `/capabilities/` | GET | Active `ProgramCategory` list |
| `/programs/` | GET | Published programs (non-deleted, `planning`/`active`/`completed`) |
| `/programs/<slug>/` | GET | One published program, else `404` |
| `/field-reports/` | GET | `ProgramReport` where `status="published"` |
| `/newsroom/` | GET | `NewsPost` where `published=True` |
| `/events/` | GET | Upcoming `Event` where `is_public=True` |
| `/gallery/` | GET | `ProgramGallery` where `published` and an image exists |
| `/allocation/` | GET | `FinancialAllocation` where `is_published=True` (approved) |
| `/transparency/` | GET | `funds_raised`, `budget_committed`, `expenditure_recorded`, `allocations[]`, `allocation_total_percentage` |
| `/newsletter/subscribe/` | POST | `201` `subscribed` / `200` `already_subscribed` / `200` `resubscribed` |
| `/donations/` | POST | `201` recorded pledge, `status` always `pending` |

**Honest figures.** Metrics without a backing record are returned with
`"available": false` and a null value rather than an estimate:

```json
{ "label": "People reached", "value": 0, "available": false, "unit": null, "source": "Program.beneficiary_count" }
```

**Newsletter subscription** — `POST /newsletter/subscribe/`

```json
{ "email": "person@example.com", "name": "Person", "source": "landing_page" }
```

Emails are trimmed and lower-cased. Re-subscribing an inactive address reactivates it
(`resubscribed`); an already-active address returns `already_subscribed` without creating
a duplicate. Throttled to 10/hour. A filled `website` honeypot returns `201` and stores
nothing.

**Public donation pledge** — `POST /donations/`

```json
{ "donor_name": "Jane", "donor_email": "jane@example.com", "amount": "5000", "campaign": "" }
```

`status` is **not** an accepted field — a public submission is always stored as `pending`
and must be confirmed by an administrator once payment is received. Throttled to 5/hour.

### Roles and permissions
Django is the only security boundary; the Next.js app mirrors these rules for
navigation only. Roles are flat — there is no implicit hierarchy. `is_superuser`
and `User.is_super_admin` bypass every role check.

| Role | Can do |
| --- | --- |
| `super_admin`, `admin` | Everything, including organizations, settings, audit logs, system info, reference tables and program deletion |
| `coordinator` | Programs (CRUD incl. delete is admin-only), members, volunteers, beneficiaries, donations, program documents/reports/assignments, activity logs, reference tables |
| `volunteer` | Authenticated reads only (programs, program categories, published news, public events, countries/states, own file uploads, own notifications) |
| `member`, `donor` | Same as `volunteer` |
| no role | Authenticated reads only; every management endpoint is denied |

Ownership rules: a non-privileged user may only `PATCH/PUT` their **own** member or
volunteer record, and only for non-status fields. Notifications are always scoped to
the current user. File uploads are scoped to the current user for non-managers.
Non-managers only ever see `is_public=True` events and `published=True` news/gallery
items.

---

## Authentication — `/api/`

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/login/` | — | Obtain `access` + `refresh` + `user` |
| POST | `/auth/token/refresh/` | — | Exchange a refresh token for a new access token |
| POST | `/auth/register/` | — | Create a user (assigned the `member` role) |
| GET | `/auth/me/` | Bearer | Current user profile and roles |
| POST | `/auth/change-password/` | Bearer | Change the current user's password |
| POST | `/auth/request-password-reset/` | — | Email a reset token |
| POST | `/auth/reset-password/` | — | Reset a password with a token |
| POST | `/auth/verify-email/` | — | Verify an email with a token |
| POST | `/auth/logout/` | Bearer | Invalidate session / clear cookies |

### POST `/auth/login/`
```json
{ "username": "admin", "password": "admin@123" }
```
`username` may be the username **or** email. Response:
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": "uuid", "email": "...", "roles": [ ... ] }
}
```

### POST `/auth/register/`
```json
{
  "email": "jane@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "password": "SecurePass@123",
  "password2": "SecurePass@123"
}
```
`username` is generated automatically; `full_name` is derived if omitted. The `member`
role is attached on creation.

### POST `/auth/change-password/`
```json
{ "old_password": "...", "new_password": "...", "new_password_confirm": "..." }
```

### GET `/auth/me/`
The role payload the front end depends on for every navigation and route decision:

```json
{
  "id": "uuid",
  "username": "jane",
  "roles": [{ "id": "uuid", "name": "volunteer" }],
  "role_names": ["volunteer"],
  "is_super_admin": false
}
```

A user may hold several roles; the front end lands them in the highest one
(`super_admin` > `admin` > `coordinator` > `volunteer` > `member` > `donor`).

### POST `/auth/request-password-reset/`
```json
{ "email": "jane@example.com" }
```

### POST `/auth/reset-password/`
```json
{ "token": "...", "new_password": "...", "new_password_confirm": "..." }
```

### POST `/auth/verify-email/`
```json
{ "token": "..." }
```

---

## Core — `/api/core/`

### Organizations
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/organizations/` | List / create |
| GET/PATCH/PUT/DELETE | `/organizations/{id}/` | Detail / update / delete |
| GET | `/organization/` | Organization **profile** (auto-creates a default) |

### Settings
| Method | Path | Description |
| --- | --- | --- |
| GET | `/settings/current/` | Current organization settings (auto-provisions a default org) |
| GET/POST | `/settings/` | List / create |
| GET/PATCH/PUT/DELETE | `/settings/{id}/` | Detail / update / delete |

Writable settings fields: `default_timezone`, `default_language`, `support_email`,
`support_phone`, `notification_sender`, `max_upload_size_mb`,
`enable_file_uploads`, `maintenance_mode`, `analytics_enabled`.

### Reference data (read-only)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/countries/`, `/countries/{id}/` | Countries |
| GET | `/states/`, `/states/{id}/` | States; filter with `?country=<id>` |

### Notifications
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/notifications/` | List / create |
| GET/PATCH/PUT/DELETE | `/notifications/{id}/` | Detail / update / delete |
| POST | `/notifications/{id}/mark_read/` | Mark one as read |
| POST | `/notifications/mark_all_read/` | Mark all as read |

### Activity logs (read-only)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/activity-logs/` | Audit trail (from `accounts.AuditLog`); supports `?ordering=-created_at` |
| GET | `/activity-logs/{id}/` | Detail |

### File uploads
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/file-uploads/` | List / upload (multipart) |
| GET/PATCH/PUT/DELETE | `/file-uploads/{id}/` | Detail / update / delete |

Upload types: `image` (`.jpg .jpeg .png .gif .webp .svg`) and `document`
(`.pdf .doc .docx .xls .xlsx .ppt .pptx .txt`).

### Dashboard & system
| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard-statistics/` | Aggregate KPIs, uploads-by-type, recent activity |
| GET | `/system-info/` | Runtime/version information |

### Members
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/members/` | List / register a member |
| GET/PATCH/PUT/DELETE | `/members/{id}/` | Detail / update / delete |
| GET | `/members/stats/` | Roster KPIs (totals by status/type) |
| GET | `/members/export/` | CSV export (honours current filters) |
| POST | `/members/{id}/set-status/` | Change lifecycle status |

Query options: `?search=` (member_id, first/last name, email, phone),
`?membership_type=`, `?status=`, `?state=`, `?ordering=` (created_at, joined_at,
first_name).

`POST /members/{id}/set-status/`
```json
{ "status": "active" }
```
Valid statuses: `pending`, `active`, `inactive`, `suspended`, `archived`.

### Volunteers
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/volunteers/` | List / create |
| GET/PATCH/PUT/DELETE | `/volunteers/{id}/` | Detail / update / delete |
| GET | `/volunteers/dashboard/` | Deployment dashboard aggregate |
| GET | `/volunteers/stats/` | Roster KPIs |
| GET | `/volunteers/export/` | CSV export |
| GET | `/volunteers/locations/` | Lat/long points for the deployment map |
| POST | `/volunteers/batch-log-hours/` | Log hours for multiple volunteers/programs |
| POST | `/volunteers/{id}/reassign/` | Reassign to a program/zone |
| POST | `/volunteers/{id}/suspend/` | Suspend |
| POST | `/volunteers/{id}/reactivate/` | Reactivate |
| GET | `/volunteers/{id}/id-card/` | ID card (PDF) |

Related resources:

| Resource | Path | Notes |
| --- | --- | --- |
| Skills | `/volunteer-skills/` | List/create skills |
| Hour logs | `/volunteer-hours/` | Create/list hours |
| Hour log actions | `/volunteer-hours/{id}/approve/`, `/reject/`, `/query/` | Approve, reject or query a log |

> `batch-log-hours` expects a human `program_id` such as `PRG-2026-00006`, not a UUID.

### Programs
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/programs/` | List / create |
| GET/PATCH/PUT/DELETE | `/programs/{id}/` | Detail / update / delete |
| GET | `/programs/dashboard/` | Program dashboard aggregate |

Nested resources (each a standard ModelViewSet):

- `/program-categories/`
- `/program-beneficiaries/`
- `/program-documents/`
- `/program-gallery/`
- `/program-reports/`
- `/program-volunteer-assignments/`

### Donations, Events, News
| Method | Path | Description |
| --- | --- | --- |
| GET/POST, `/donations/{id}/` | `/donations/` | Donation records (`amount` is serialized as a string) |
| GET/POST, `/events/{id}/` | `/events/` | Events and field trips |
| GET/POST, `/news/{id}/` | `/news/` | News posts (`category` is free text) |

### Self-service endpoints
Authenticated, read-only, and scoped to the caller. They are the backing API for the
role workspaces (`/volunteer`, `/member`, `/donor`). When the caller has no matching
profile, the endpoint returns `404` rather than another user's record.

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/members/me/` | The caller's `Member` record |
| GET | `/volunteers/me/` | The caller's `Volunteer` record |
| GET | `/volunteer-hours/me/` | Paginated shift logs for the caller's volunteer profile |
| GET | `/program-volunteer-assignments/me/` | Paginated program assignments (each row includes `program_title` and `program_ref`) |
| GET | `/programs/mine/` | Paginated programs the caller's volunteer is assigned to |

---

## OpenAPI / Swagger

The full machine-readable schema is generated by `drf-spectacular`:

- Schema: `GET /api/schema/`
- Swagger UI: `GET /api/docs/`
