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

> The front end's `apiCall` currently shortens error messages by reading an `error`
> key. Django uses `detail`, so error text may fall back to the HTTP status. Keep this
> in mind when adding UI error handling.

### Trailing slash
Django expects a trailing slash. The proxy adds it automatically; from `curl` or
scripts, include it.

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

---

## OpenAPI / Swagger

The full machine-readable schema is generated by `drf-spectacular`:

- Schema: `GET /api/schema/`
- Swagger UI: `GET /api/docs/`
