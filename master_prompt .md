STOP AND INSPECT THE EXISTING APPLICATION FIRST.

Do not immediately create mock frontend components.

This is an existing BFF Django + Next.js application.

Your first job is to understand what already exists.

Inspect:

FRONTEND:
- routes
- layouts
- sidebar
- API client
- authentication
- existing components
- existing design tokens
- existing tables
- existing modals
- existing loading/error components

BACKEND:
- models
- serializers
- ViewSets/APIViews
- URL routes
- permissions
- filters
- pagination
- audit logs
- authentication
- volunteer-related endpoints
- member-related endpoints
- program-related endpoints

Then determine what can be reused.

Only implement missing functionality.

Do not create parallel/duplicate models, APIs, components, or authentication
systems if the project already has them.