# Core Foundation Module API Documentation

## Overview
The Core Foundation module provides organizational settings, reference data, file upload management, notification center, audit logs, and dashboard statistics.

## API Endpoints

### Organizations
- `GET /api/core/organizations/`
- `POST /api/core/organizations/`
- `GET /api/core/organizations/{id}/`
- `PATCH /api/core/organizations/{id}/`
- `DELETE /api/core/organizations/{id}/`

### Settings
- `GET /api/core/settings/`
- `POST /api/core/settings/`
- `GET /api/core/settings/{id}/`
- `PATCH /api/core/settings/{id}/`
- `GET /api/core/settings/current/`

### Countries
- `GET /api/core/countries/`
- `GET /api/core/countries/{id}/`

### States
- `GET /api/core/states/`
- `GET /api/core/states/{id}/`
- Query by country: `GET /api/core/states/?country=<country_id>`

### File Uploads
- `GET /api/core/file-uploads/`
- `POST /api/core/file-uploads/`
- `GET /api/core/file-uploads/{id}/`
- `PATCH /api/core/file-uploads/{id}/`
- `DELETE /api/core/file-uploads/{id}/`

Supported upload types:
- `image`: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- `document`: `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`

### Notifications
- `GET /api/core/notifications/`
- `POST /api/core/notifications/`
- `GET /api/core/notifications/{id}/`
- `PATCH /api/core/notifications/{id}/`
- `POST /api/core/notifications/{id}/mark_read/`
- `POST /api/core/notifications/mark_all_read/`

### Activity Logs
- `GET /api/core/activity-logs/`
- `GET /api/core/activity-logs/{id}/`

### Dashboard Statistics
- `GET /api/core/dashboard-statistics/`

## Security and Permissions
- Most endpoints require authentication.
- Countries and states are read-only for anonymous users.
- File uploads and notifications are scoped to the authenticated user.

## Schema Generation
The project includes `drf-spectacular`, so a full OpenAPI schema is available via the project's schema endpoint when configured.
