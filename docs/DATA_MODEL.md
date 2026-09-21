# Data Model

All models live in two Django apps: `accounts` (identity and access) and `core`
(operations). This document summarises the models, their key fields, enums and
relationships. For exact definitions, read the source:
[`backend/accounts/models.py`](../backend/accounts/models.py) and
[`backend/core/models.py`](../backend/core/models.py).

## Conventions

- **UUID primary keys** on most domain models (`UUIDField(default=uuid.uuid4)`).
- **Human-friendly codes** are generated on first save:
  - `Member.member_id` → `BFF-2026-00001`
  - `Volunteer.volunteer_id` → `VOL-2026-00001`
  - `Program.program_id` → `PRG-2026-00001`
- **Timestamps**: `created_at` / `updated_at` (`auto_now_add` / `auto_now`).
- **Soft deletes** on `Program` and `Volunteer` via `is_deleted`, `deleted_at`,
  `deleted_by` plus `soft_delete()` / `restore()` helpers.
- **Model-level events** write to the audit log through
  `accounts.services.AuditService.log` (e.g. `program_created`,
  `volunteer_registered`, `hours_logged`).
- **Validation** happens in `clean()` / `full_clean()`; several models call
  `full_clean()` inside `save()`.

## Entity overview

```
User ──1:1── Member ──1:1── Volunteer ──*── VolunteerSkill (M2M)
 │                              │
 │                              ├──* VolunteerTraining
 │                              ├──* VolunteerAttendance ──* Program
 │                              ├──* VolunteerHourLog ────* Program
 │                              ├──* VolunteerCertificate
 │                              └──* VolunteerEvaluation ──* Program
 │
 ├──* AuditLog
 └──* Notification / FileUpload / Donation / Event / NewsPost

Organization ──1:1── Settings
     └──* Program / Notification / FileUpload

Program ──* ProgramBeneficiary / ProgramDocument / ProgramGallery /
           ProgramReport / ProgramVolunteerAssignment

Country ──* State
```

---

## `accounts` app

### `User` (custom, `AUTH_USER_MODEL`)
Extends `AbstractUser`.

| Field | Notes |
| --- | --- |
| `id` | UUID PK |
| `username`, `email` | unique (email-based auth backend) |
| `first_name`, `last_name`, `full_name`, `phone` | profile |
| `status` | `active` / `inactive` / `suspended` / `archived` |
| `email_verified`, `email_verified_at` | email confirmation |
| `last_password_change` | password rotation tracking |
| `failed_login_attempts`, `locked_until` | account lockout |
| `roles` | M2M → `Role` through `UserRole` |

Helper properties: `is_super_admin`, `is_admin`, `is_coordinator`, `is_volunteer`,
`is_member`, `is_locked`, plus `has_role()` / `has_any_role()`.

### `Role`
UUID PK. `name` is one of `super_admin`, `admin`, `coordinator`, `volunteer`,
`donor`, `member`; plus `description`, `is_active`, optional `permissions` M2M.

### `UserRole`
Join table between `User` and `Role`.

### Tokens
- `EmailVerificationToken` — one-to-one with user; `token`, `is_used`, `created_at`.
- `PasswordResetToken` — same shape; `is_used`.

### `AuditLog`  ← the live audit trail
| Field | Notes |
| --- | --- |
| `id` | UUID PK |
| `user` | FK → User (nullable) |
| `action` | e.g. `login`, `member_created`, `volunteer_status_changed` |
| `ip_address`, `user_agent` | request context |
| `details` | JSON payload |
| `created_at` | timestamp |

The UI derives a **category** from the action prefix in `AuditLogSerializer`
(`member_` → member, `beneficiary_` → program, etc.).

> `core.ActivityLog` is a separate, legacy model that is no longer written to.

---

## `core` app

### Programs

**`Program`** — the central operational record.

| Group | Fields |
| --- | --- |
| Identity | `program_id` (auto `PRG-...`), `title`, `slug` (auto) |
| Classification | `category` FK, `status`, `priority` |
| Location | `country` FK, `state` FK, `lga`, `address` |
| Timeline | `start_date`, `end_date` |
| Finance | `budget`, `amount_spent`, `funding_target` (Decimal) |
| Reach | `beneficiary_count` |
| People | `manager`, `coordinator`, `created_by`, `updated_by` |
| Soft delete | `is_deleted`, `deleted_at`, `deleted_by` |

- `status`: `draft`, `planning`, `active`, `completed`, `cancelled`, `archived`
- `priority`: `low`, `medium`, `high`, `critical`
- Computed: `remaining_budget`, `percentage_budget_used`

**Related models**

| Model | Purpose |
| --- | --- |
| `ProgramCategory` | name, color, icon, `is_active` |
| `ProgramBeneficiary` | name, gender, age, contact, location, disability, notes |
| `ProgramDocument` | `document_type` (report/proposal/budget/photo/other), file, uploader |
| `ProgramGallery` | image + caption |
| `ProgramReport` | title, summary, challenges, lessons, recommendations |
| `ProgramVolunteerAssignment` | links `Program` ↔ `Volunteer`; `is_active`, notes, `unique_together(program, volunteer)` |

### Members

**`Member`** — the community roster (also powers the Beneficiaries pages).

| Field | Notes |
| --- | --- |
| `id` | UUID PK |
| `member_id` | auto `BFF-2026-00001` |
| `user` | OneToOne → User (nullable) |
| `first_name`, `last_name` | `full_name` property |
| `email` | unique |
| `phone`, `gender`, `date_of_birth` | |
| `address`, `state`, `lga` | free-text location |
| `occupation`, `skills` | |
| `membership_type` | enum (below) |
| `status` | enum (below) |
| `profile_photo`, `notes` | |
| `joined_at`, `created_at`, `updated_at` | |

- `membership_type`: `regular`, `volunteer`, `donor`, `beneficiary`, `staff`,
  `board`, `partner`
- `status`: `pending`, `active`, `inactive`, `suspended`, `archived`

### Volunteers

**`Volunteer`** — large profile model.

| Group | Fields |
| --- | --- |
| Identity | `volunteer_id` (auto), `user` (1:1), `member` (1:1), names, `email` |
| Profile | `gender`, `date_of_birth`, `nationality`, `occupation`, `organization`, `bio`, `profile_photo` |
| Location | `state`, `lga`, `address`, `latitude`, `longitude`, `last_gps_at` |
| Emergency | `emergency_contact_name` / `_phone` / `_relationship` |
| Ops | `status`, `availability`, `squad`, `joined_date`, `on_leave_until`, `years_of_experience` |
| Skills | `skills` M2M → `VolunteerSkill` |
| Accounting | `volunteer_hours` |
| Soft delete | `is_deleted`, `deleted_at`, `deleted_by` |
| Audit | `created_by`, `updated_by` |

- `status`: `pending`, `active`, `inactive`, `on_leave`, `suspended`, `archived`
- `availability`: `full_time`, `part_time`, `weekends`, `remote`, `on_call`
- Computed: `total_hours`, `approved_hours`, `compliance_score`,
  `assigned_programs`, `active_deployment`, `deployment_status`, `last_shift`,
  `cluster`, `specializations`, `on_site_this_week`

**Supporting models**

| Model | Purpose |
| --- | --- |
| `VolunteerSkill` | unique skill name |
| `VolunteerTraining` | training name, provider, dates, certificate |
| `VolunteerAttendance` | per program/date; check-in/out auto-computes hours; unique per volunteer+program+date |
| `VolunteerHourLog` | activity, date, shift times, `hours`, `approval_status` (pending/approved/rejected), query note |
| `VolunteerCertificate` | title, file (PDF/image), issue date |
| `VolunteerEvaluation` | five 0–5 scores → auto `overall_score` |

### Organization & settings

**`Organization`** — name, legal name, abbreviation, mission/description, contact
details, address, `country`/`state` FKs, logo.

**`Settings`** — OneToOne with `Organization`. Fields: `default_timezone`,
`default_language`, `support_email`, `support_phone`, `maintenance_mode`,
`enable_file_uploads`, `max_upload_size_mb`, `notification_sender`,
`analytics_enabled`. `GET /api/core/settings/current/` auto-creates a default
organization and settings row if none exists.

**`OrganizationProfile`** — a marketing-style profile (name, slogan, mission,
vision, …) served by `GET /api/core/organization/`, also auto-created on demand.

### Reference data

| Model | Fields |
| --- | --- |
| `Country` | `name`, `iso_code`, `iso3_code`, `numeric_code`, `calling_code`, `active` |
| `State` | `country` FK, `name`, `code`, `active`; unique per country |

### Operations & communications

| Model | Purpose |
| --- | --- |
| `Notification` | user-scoped message: title, body, type (info/success/warning/error), `read`, metadata |
| `FileUpload` | title, description, file, `upload_type` (image/document), size, content type, `is_active`; extension-validated |
| `Donation` | donor name/email, `amount` (Decimal), `campaign`, `reference`, `status` (pending/completed/failed) |
| `Event` | title, description, location, start/end, capacity, `is_public` |
| `NewsPost` | title, `body`, free-text `category`, `published`, `published_at`, `author` |

---

## Enum reference

| Enum | Values |
| --- | --- |
| `Roles` | super_admin, admin, coordinator, volunteer, donor, member |
| `User.status` | active, inactive, suspended, archived |
| `ProgramStatus` | draft, planning, active, completed, cancelled, archived |
| `ProgramPriority` | low, medium, high, critical |
| `MembershipType` | regular, volunteer, donor, beneficiary, staff, board, partner |
| `MembershipStatus` | pending, active, inactive, suspended, archived |
| `VolunteerStatus` | pending, active, inactive, on_leave, suspended, archived |
| `VolunteerAvailability` | full_time, part_time, weekends, remote, on_call |
| `VolunteerHourLog.ApprovalStatus` | pending, approved, rejected |
| `ProgramDocument.DocumentType` | report, proposal, budget, photo, other |
| `Notification.NotificationType` | info, success, warning, error |
| `FileUpload.UploadType` | image, document |
| `Donation.Status` | pending, completed, failed |
