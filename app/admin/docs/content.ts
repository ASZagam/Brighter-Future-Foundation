import type { DocSection } from './types';

const shot = (name: string, alt: string, caption: string, focus?: string) => ({
  src: `/docs/${name}.webp`,
  alt,
  caption,
  focus,
});

export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'start',
    index: '01',
    title: 'Getting started',
    summary: 'Sign in, understand your role and find your way around the console.',
    icon: 'key',
    link: { href: '/auth/login', label: 'Open sign in' },
    steps: [
      {
        id: 'start-sign-in',
        title: 'Sign in to your workspace',
        description: 'The console is available to administrators and coordinators. Your account must be active and its email address verified.',
        actions: [
          'Open the sign-in page and enter your username or email address and password.',
          'Five incorrect passwords lock the account temporarily; wait for the lockout to expire or ask an administrator to unlock it.',
          'After a successful sign-in you land in the workspace for your highest role: the admin console for staff, or your personal workspace for members, volunteers and donors.',
        ],
        note: { tone: 'info', text: 'Sessions use HttpOnly cookies and rotate automatically. Select “Log out” in the sidebar to end the session on a shared computer.' },
        screenshot: shot('sign-in', 'Sign-in form asking for a username or email and password', 'The sign-in screen. Use the same email or username you registered with.'),
      },
      {
        id: 'start-layout',
        title: 'Read the console layout',
        description: 'Every management page shares the same shell so the controls are always in the same place.',
        actions: [
          'The left sidebar groups tools into Overview, Programs, People, Engagement and Administration.',
          'The top bar contains global search, notifications and the sidebar toggle for narrower screens.',
          'The main panel holds the page header, filters, tables and action buttons for the current module.',
        ],
        screenshot: shot('overview', 'Admin console overview showing sidebar, top bar and dashboard cards', 'The operations shell: sidebar navigation, top bar and the main content panel.', 'sidebar'),
      },
      {
        id: 'start-navigation',
        title: 'Navigate and search',
        description: 'Navigation is role-aware: links you are not permitted to use are hidden.',
        actions: [
          'Use the sidebar to jump between modules; the active item is highlighted.',
          'Use the search field in the top bar to find programs, records or people.',
          'Legacy links such as /dashboard and /members redirect to their /admin equivalents automatically.',
        ],
        note: { tone: 'tip', text: 'Bookmark /admin as the single entry point for all management tools.' },
      },
    ],
  },
  {
    id: 'dashboard',
    index: '02',
    title: 'Dashboard and analytics',
    summary: 'Read live foundation figures and move quickly into the work that needs attention.',
    icon: 'gauge',
    link: { href: '/admin', label: 'Open dashboard' },
    steps: [
      {
        id: 'dashboard-overview',
        title: 'Review the overview cards',
        description: 'The admin landing page shows counts loaded from the Django API; a dash means the figure is not available yet.',
        actions: [
          'Check organizations, countries, states covered and recorded audit events.',
          'Review member registrations split between self-registered members and records added by staff.',
          'Select a registration card to open the filtered member roster.',
        ],
        screenshot: shot('overview', 'Admin overview cards for organizations, countries, states and audit events', 'Live overview figures and shortcuts into the member registry.'),
      },
      {
        id: 'dashboard-analytics',
        title: 'Open operations analytics',
        description: 'The analytics view brings program progress, geographic reach and the audit stream together.',
        actions: [
          'Select “Operations analytics” from the overview header.',
          'Use the audit activity stream to see recent privileged actions and who performed them.',
          'Treat unavailable metrics as “Data pending” — figures are never invented when no backend data exists.',
        ],
        note: { tone: 'info', text: 'Budget, spending and beneficiary aggregates are restricted to administrators and coordinators.' },
      },
      {
        id: 'dashboard-notifications',
        title: 'Work through notifications',
        description: 'Notifications are personal and can be marked as read from the notification center.',
        actions: [
          'Open “Notifications” from the sidebar or the top bar badge.',
          'Select a notification to read its detail and follow any related link.',
          'Use “Mark all read” once you have reviewed the queue.',
        ],
      },
    ],
  },
  {
    id: 'programs',
    index: '03',
    title: 'Programs and field work',
    summary: 'Create programs, track delivery, attach evidence and assign the people doing the work.',
    icon: 'layers',
    link: { href: '/admin/programs', label: 'Open programs' },
    steps: [
      {
        id: 'programs-create',
        title: 'Create a program',
        description: 'A program is the central operational record: it carries the plan, budget, location, timeline and delivery status.',
        actions: [
          'Open Programs and start the new-program form.',
          'Enter a clear title, choose a category and set the status, priority, country, state and dates.',
          'Record the budget, funding target and expected beneficiary count, then save.',
          'The system assigns a program ID and a URL slug automatically.',
        ],
        note: { tone: 'tip', text: 'Start in draft or planning while details are still changing; move to active only when delivery begins.' },
        screenshot: shot('programs', 'Programs workspace listing field initiatives with search and filters', 'The program portfolio. Use the toolbar to search, filter and add a program.', 'toolbar'),
      },
      {
        id: 'programs-details',
        title: 'Maintain program records',
        description: 'Open a program to manage its supporting records.',
        actions: [
          'Add beneficiaries with their age, gender, location and any support notes.',
          'Upload documents such as proposals, budgets and reports, and add images to the gallery.',
          'Write program reports and mark them published only when they are approved for an audience.',
        ],
        note: { tone: 'warning', text: 'Internal report fields such as challenges and lessons are not published on the public site.' },
      },
      {
        id: 'programs-team',
        title: 'Assign the team',
        description: 'Staff and volunteers are linked to a program through assignment records.',
        actions: [
          'Assign a coordinator and a manager from the program record.',
          'Add volunteers through volunteer assignments and deactivate old assignments rather than deleting history.',
          'Use “My Programs” to see only the programs and assignments connected to your account.',
        ],
        screenshot: shot('my-programs', 'My Programs workspace showing role, schedule and team assignment details', 'My Programs is the self-service view of assignments and team members.'),
      },
      {
        id: 'programs-finance',
        title: 'Track budget and progress',
        description: 'Financial and reach figures are maintained on the program record.',
        actions: [
          'Update amount spent as funds are used; remaining budget and percentage used are calculated for you.',
          'Update beneficiary count from verified field records, not estimates.',
          'Change status to completed or cancelled only after the appropriate sign-off.',
        ],
      },
      {
        id: 'programs-dashboard',
        title: 'Use the program dashboard',
        description: 'The program dashboard aggregates portfolio-level figures.',
        actions: [
          'Open the program dashboard from the analytics area.',
          'View active programs, budgets, spending and reach across the portfolio.',
          'Coordinators and administrators can access aggregates; other roles receive a 403 response from the API.',
        ],
      },
    ],
  },
  {
    id: 'people',
    index: '04',
    title: 'Members and beneficiaries',
    summary: 'Maintain the community registry, review registrations and keep membership status accurate.',
    icon: 'users',
    link: { href: '/admin/members', label: 'Open members' },
    steps: [
      {
        id: 'people-roster',
        title: 'Find a member',
        description: 'The roster is server-side paginated with search, filters and sorting.',
        actions: [
          'Type a name, email or member ID into the search field.',
          'Filter by status, membership type or registration source.',
          'Sort columns and move between pages; the table reflects the live backend data.',
        ],
        screenshot: shot('members', 'Members and community roster showing search, filters and member rows', 'The member roster with search and registration-source filters.', 'filters'),
      },
      {
        id: 'people-register',
        title: 'Add a member',
        description: 'Staff can add a member directly; self-service registrations also land in this registry.',
        actions: [
          'Open the add-member form and provide name, email, phone, location and membership type.',
          'Set status to pending until identity and details are confirmed.',
          'Link an existing user account when the member needs platform access.',
        ],
        note: { tone: 'warning', text: 'Do not link a member to another person’s account; a user account can only be linked to one member record.' },
      },
      {
        id: 'people-status',
        title: 'Change membership status',
        description: 'Status controls whether a person appears as active in reports and self-service views.',
        actions: [
          'Open the member record and choose the new status: pending, active, inactive, suspended or archived.',
          'Record a short reason in the notes field for audits and future reviewers.',
          'Use bulk status changes only after checking every selected record.',
        ],
      },
      {
        id: 'people-export',
        title: 'Export the roster',
        description: 'Exports use the current search and filter selection.',
        actions: [
          'Apply the filters you want to include, then choose Export.',
          'Download the CSV and store it according to your data-protection policy.',
          'Beneficiary lists in program records are managed separately from the member registry.',
        ],
      },
    ],
  },
  {
    id: 'volunteers',
    index: '05',
    title: 'Volunteers and deployments',
    summary: 'Register volunteers, place them on programs and approve logged hours.',
    icon: 'heart',
    link: { href: '/admin/volunteers', label: 'Open volunteers' },
    steps: [
      {
        id: 'volunteers-roster',
        title: 'Review the volunteer roster',
        description: 'Volunteer profiles hold contact details, availability, skills and deployment state.',
        actions: [
          'Search or filter by status, skill, squad and location.',
          'Open a profile to see trainings, evaluations, certificates and deployment history.',
          'Check the deployment map for field locations where GPS coordinates are available.',
        ],
        screenshot: shot('volunteers', 'Volunteers and deployment roster with status and skills filters', 'The volunteer roster and deployment overview.'),
      },
      {
        id: 'volunteers-register',
        title: 'Register a volunteer',
        description: 'A volunteer can be created from an existing member or as a new record.',
        actions: [
          'Capture identity, contact, emergency contact, availability and skills.',
          'Set status to pending until screening is complete, then move to active.',
          'Link the volunteer’s user account so they can access the volunteer workspace.',
        ],
      },
      {
        id: 'volunteers-hours',
        title: 'Log and approve hours',
        description: 'Hours can be logged by staff or submitted by the volunteer and then reviewed.',
        actions: [
          'Record the activity, date, shift times and the program the hours belong to.',
          'Review submitted logs and approve or reject each one with a note when needed.',
          'Only approved hours count toward the volunteer’s approved-hours total.',
        ],
        note: { tone: 'tip', text: 'Attendance check-in and check-out can compute hours automatically when both times are recorded.' },
      },
      {
        id: 'volunteers-actions',
        title: 'Manage deployments and exports',
        description: 'Routine volunteer administration is available from the profile and roster actions.',
        actions: [
          'Reassign a volunteer to another program or squad when plans change.',
          'Suspend a volunteer without deleting their history, and reactivate them later.',
          'Generate an ID card as a PDF and export rosters as CSV for field teams.',
        ],
      },
    ],
  },
  {
    id: 'engagement',
    index: '06',
    title: 'Funding, events and news',
    summary: 'Record contributions, organise field activities and publish foundation stories.',
    icon: 'banknote',
    steps: [
      {
        id: 'engagement-donations',
        title: 'Record a donation',
        description: 'Donations are finance records; they are not linked to user accounts.',
        actions: [
          'Enter donor name and email, amount, campaign and payment reference.',
          'Choose the correct status: pending, completed or failed.',
          'Reconcile pending gifts against receipts before marking them completed.',
        ],
        note: { tone: 'warning', text: 'Public pledges from the website are always stored as pending; only staff can mark money as received.' },
        screenshot: shot('donations', 'Donations and grants workspace with totals and donation records', 'The donations ledger and campaign figures.'),
      },
      {
        id: 'engagement-events',
        title: 'Create an event',
        description: 'Events represent field trips, community meetings and fundraising activities.',
        actions: [
          'Add a title, description, location, start and end time and capacity.',
          'Mark the event as public only when it is suitable for the public website.',
          'Keep past events for the historical record; public listings hide events that have already ended.',
        ],
        screenshot: shot('events', 'Events and field trips workspace showing upcoming activities', 'Events and field trips management.'),
      },
      {
        id: 'engagement-news',
        title: 'Publish a news post',
        description: 'News posts can be drafted, reviewed and published for the public site.',
        actions: [
          'Write the headline, category and body, and add a cover image if available.',
          'Save as a draft while the story is being reviewed.',
          'Set published only when the post is approved; the published date is recorded automatically.',
        ],
        screenshot: shot('news', 'News and media workspace with draft and published posts', 'News and media: draft, review and publish stories.'),
      },
    ],
  },
  {
    id: 'communications',
    index: '07',
    title: 'Notifications and broadcasts',
    summary: 'Send in-app announcements and keep the foundation community informed.',
    icon: 'send',
    link: { href: '/admin/broadcasts', label: 'Open broadcasts' },
    steps: [
      {
        id: 'communications-notifications',
        title: 'Understand notifications',
        description: 'Notifications are user-scoped messages shown in the top bar and notification center.',
        actions: [
          'Read the notification title, body and type badge before acting.',
          'Follow related links to the relevant member, volunteer or program record.',
          'Mark individual notifications or the whole queue as read.',
        ],
      },
      {
        id: 'communications-broadcast',
        title: 'Send a broadcast',
        description: 'Administrators can send an in-app notification to all active users or to one selected audience.',
        actions: [
          'Open Broadcasts from the Engagement section of the sidebar.',
          'Choose the audience, then write a short, specific title and message.',
          'Review the audience and wording before sending; the broadcast is recorded for audit.',
        ],
        note: { tone: 'warning', text: 'Broadcasts are internal communications, not email campaigns. Do not include passwords or sensitive personal data.' },
        screenshot: shot('broadcasts', 'Broadcasts page with audience selection and message fields', 'Broadcast composer for internal announcements.'),
      },
      {
        id: 'communications-review',
        title: 'Confirm delivery',
        description: 'After sending, verify the result in the notification center and the audit trail.',
        actions: [
          'Open Notifications to see the message in your own queue.',
          'Check Audit Activity Logs for the broadcast event and the administrator who sent it.',
          'If the audience looks wrong, correct the underlying role or account status before trying again.',
        ],
      },
    ],
  },
  {
    id: 'foundation',
    index: '08',
    title: 'Foundation and administration',
    summary: 'Manage the public organization story, shared files, reference data and platform preferences.',
    icon: 'shield',
    steps: [
      {
        id: 'foundation-about',
        title: 'Edit the public About Us page',
        description: 'Organization Profile provides a draft/publish workflow for the public story.',
        actions: [
          'Open Organization Profile and edit the story, mission, vision, history and contact details.',
          'Add or reorder disciplines and toggle which ones appear publicly.',
          'Use “Preview draft” to review changes before publishing.',
        ],
        note: { tone: 'tip', text: 'Saving a draft never changes the public site. Only “Publish” makes the draft visible.' },
        screenshot: shot('about', 'Organization Profile editor with story fields and banner controls', 'The About Us editor: draft, preview and publish controls.', 'actions'),
      },
      {
        id: 'foundation-banner',
        title: 'Change the home page banner',
        description: 'The banner image is uploaded to the draft before it is published.',
        actions: [
          'Choose an image in the banner panel and upload it to the draft.',
          'Check the preview to confirm crop and readability.',
          'Publish the About Us content to make the new banner public; remove the draft image to keep the current public one.',
        ],
      },
      {
        id: 'foundation-files',
        title: 'Use the file vault',
        description: 'The file vault stores shared images and documents used across the platform.',
        actions: [
          'Upload an allowed file type and give it a clear title and description.',
          'Use the file URL in program records, news posts or organization content where needed.',
          'Deactivate files that are no longer in use instead of deleting shared links.',
        ],
      },
      {
        id: 'foundation-references',
        title: 'Maintain reference tables',
        description: 'Countries, states and other reference values keep forms consistent.',
        actions: [
          'Open Reference Tables from the Administration section.',
          'Add reference rows only when no existing value accurately describes the location or category.',
          'Deactivate obsolete values rather than removing them from historical records.',
        ],
      },
      {
        id: 'foundation-settings',
        title: 'Adjust platform settings',
        description: 'Settings control timezone, language, support details and feature switches.',
        actions: [
          'Open Settings and review support email, phone, timezone and language.',
          'Change maintenance mode, uploads or analytics switches only with the appropriate approval.',
          'Save and confirm the updated values on the page.',
        ],
        screenshot: shot('settings', 'Settings workspace with foundation preferences and feature switches', 'Foundation settings and feature controls.'),
      },
    ],
  },
  {
    id: 'audit',
    index: '09',
    title: 'Audit and security',
    summary: 'Review privileged activity and understand the controls that protect accounts.',
    icon: 'scroll',
    link: { href: '/admin/audit', label: 'Open audit logs' },
    steps: [
      {
        id: 'audit-log',
        title: 'Read the audit trail',
        description: 'Every privileged action is written to the audit log with the actor and request context.',
        actions: [
          'Filter the log by action, category, user or date range.',
          'Open an entry to inspect its details, IP address and user agent.',
          'Follow up on unexpected account, member, volunteer or broadcast actions.',
        ],
        screenshot: shot('audit', 'Audit activity logs with filters and recorded administrative actions', 'Audit activity logs for administrative and account events.'),
      },
      {
        id: 'audit-roles',
        title: 'Understand roles',
        description: 'Roles are flat: administrators, coordinators, volunteers, members and donors.',
        actions: [
          'Super administrators and administrators bypass role checks; coordinators can manage delivery.',
          'Members, volunteers and donors can only use their own self-service workspaces.',
          'Assign additional roles only when a user genuinely needs the extra tools.',
        ],
        note: { tone: 'warning', text: 'Granting an administrative role gives access to sensitive records. Record the approval before assigning it.' },
      },
      {
        id: 'audit-security',
        title: 'Handle account security events',
        description: 'Login throttling and lockout protect accounts without blocking other users.',
        actions: [
          'Five failed passwords temporarily lock only the account being attacked.',
          'Login rate limits are scoped per account and source IP, so one locked account cannot block a colleague.',
          'Direct a locked user to password reset rather than sharing credentials.',
        ],
      },
    ],
  },
  {
    id: 'workspaces',
    index: '10',
    title: 'Self-service workspaces',
    summary: 'What members, volunteers and donors can do without the admin console.',
    icon: 'sparkles',
    steps: [
      {
        id: 'workspaces-programs',
        title: 'My Programs',
        description: 'Program assignments are visible to the people involved in delivery.',
        actions: [
          'Open My Programs to see your role, schedule, location and team.',
          'Use the assignment detail to identify the coordinator and team lead.',
          'Report missing assignments to an administrator rather than editing the program yourself.',
        ],
        screenshot: shot('my-programs', 'My Programs page showing assignment details and team members', 'My Programs shows only the assignments connected to your account.'),
      },
      {
        id: 'workspaces-member',
        title: 'Member dashboard and profile',
        description: 'Members can review their own record and update allowed profile fields.',
        actions: [
          'Open My Membership to see the current membership status and details.',
          'Open My Profile to review personal information and correct what the form allows.',
          'Contact staff if a status or record is wrong; members cannot change their own status.',
        ],
      },
      {
        id: 'workspaces-volunteer-donor',
        title: 'Volunteer and donor spaces',
        description: 'Volunteers and donors have focused, role-specific views.',
        actions: [
          'Volunteers can review assignments and submitted hours from the Volunteer Hub.',
          'Donors see foundation updates rather than personal giving history because gifts are receipt-based.',
          'Switch workspace from the sidebar footer when an account holds more than one role.',
        ],
      },
    ],
  },
  {
    id: 'help',
    index: '11',
    title: 'Troubleshooting',
    summary: 'Quick answers for the issues staff most often raise.',
    icon: 'life',
    steps: [
      {
        id: 'help-access',
        title: '“I do not have access to this page”',
        description: 'Access is determined by roles and permissions stored on the server.',
        actions: [
          'Confirm you are signed in with the correct account using the sidebar profile.',
          'Check that your account status is active and your email is verified.',
          'Ask an administrator to review your roles if the link is still hidden.',
        ],
      },
      {
        id: 'help-locked',
        title: '“My account is locked”',
        description: 'Repeated failed passwords temporarily lock an account.',
        actions: [
          'Wait for the lockout period to finish, or use password reset if that option is available.',
          'Check that Caps Lock and keyboard layout are correct before retrying.',
          'Contact an administrator if the lock persists after the stated period.',
        ],
      },
      {
        id: 'help-data',
        title: '“The public page shows Data pending”',
        description: 'Public figures only appear when there is published data to support them.',
        actions: [
          'Confirm the underlying program, report or allocation is published and not deleted.',
          'For allocations, check that the row is marked published.',
          'Do not expect internal or draft figures to appear on the public site.',
        ],
      },
      {
        id: 'help-refresh',
        title: '“The page looks out of date”',
        description: 'Lists are loaded from the API when a page opens.',
        actions: [
          'Refresh the page after another user makes a change.',
          'Reapply search and filter values if a result has disappeared.',
          'Check the notification center and audit log for changes made by other staff.',
        ],
      },
    ],
  },
];
