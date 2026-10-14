# TASK: Integrate IPstack Visitor Analytics into e-teaching.tech / e-learning-msc

## 1. Role and objective

Act as a senior full-stack engineer, analytics architect, database designer, UI/UX engineer, security engineer, and DevOps engineer.

You are working on my existing e-learning platform:

- Production domain: `https://e-teaching.tech`
- Project/repository: `e-learning-msc`
- Deployment: Oracle Cloud VPS using Docker Compose
- Existing services include the application, MongoDB 7, Nginx, Ollama, RustFS, and Mongo Express.
- The application container is currently exposed internally on port 3000.
- MongoDB is currently exposed internally/on port 27017.
- RustFS is currently mapped from host port 9200 to container port 9000.
- Nginx is mapped to host port 80.
- Mongo Express is mapped to host port 8585.
- The existing frontend and backend architecture must be discovered from the repository before making changes.

Your mission is to implement a production-ready **Visitor Analytics & Intelligence** module in the existing admin dashboard using IPstack for IP-based geolocation.

The implementation must integrate with the existing application. Do not create a separate application, replace the current dashboard, rebuild the project from scratch, or change unrelated functionality.

## 2. Mandatory first step: inspect the existing project

Before writing code, inspect the entire relevant codebase.

Identify:

- Framework and version.
- Whether the application uses Next.js App Router, Pages Router, React with Express, or another architecture.
- Existing frontend routing and layouts.
- Existing admin dashboard, navigation, and role-based access control.
- Authentication and session management.
- User roles and permission checks.
- MongoDB connection patterns, models, indexes, and migrations.
- Existing API routes/controllers and validation conventions.
- Current charting and table libraries.
- Existing design system, UI components, theme, typography, spacing, icons, and responsive breakpoints.
- Existing Dockerfiles, Docker Compose files, environment variables, Nginx configuration, and production startup commands.
- Existing tests, linting, type-checking, and build commands.
- Any existing analytics, logging, or visitor tracking code.

Read relevant files before modifying them.

Produce a concise implementation plan based on the actual architecture, then implement the feature. Do not stop after producing the plan.

Reuse existing dependencies and components wherever practical. Do not introduce a second routing system, a second database connection layer, or unnecessary UI libraries.

If the repository already contains analytics functionality, extend it instead of duplicating it.

## 3. API integration and secret management

Provider: IPstack by APILayer.

Documentation:

- https://apilayer.com/products/ipstack/
- https://ipstack.com/json-ip-api/
- https://marketplace.apilayer.com/ip_to_location-api/tabs/api_docs

Use the official IPstack endpoint and response schema appropriate to the account and subscription.

Common endpoint format:

GET https://api.ipstack.com/{ip_address}?access_key=ACCESS_KEY

Requester lookup, if supported by the selected account:

GET https://api.ipstack.com/check?access_key=ACCESS_KEY

The API key must never be hardcoded.

Use a server-only environment variable:

IPSTACK_ACCESS_KEY=replace_with_rotated_key

Optionally support:

IPSTACK_BASE_URL=https://api.ipstack.com
IPSTACK_TIMEOUT_MS=3000
IPSTACK_CACHE_TTL_HOURS=168
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_ENABLED=true

These values are examples and should be adapted to the existing configuration system.

Requirements:

- Add the required environment variable names to `.env.example`, without real secrets.
- Update the actual deployment instructions for Docker Compose.
- Read secrets only in server-side code.
- Never use `NEXT_PUBLIC_` or another public prefix for the IPstack secret.
- Never return the secret in API responses, logs, error messages, HTML, client-side bundles, or source maps.
- Never commit `.env` files containing secrets.
- Do not rebuild Docker images with secrets embedded in image layers.
- Validate configuration at application startup where appropriate.
- If the key is absent, disable geolocation enrichment gracefully and show an actionable configuration warning to authorized administrators.
- Use HTTPS.
- Add request timeouts, safe error handling, and bounded retries only where appropriate.
- Handle invalid keys, inactive accounts, quota exhaustion, restricted features, invalid IPs, and network errors.
- Never fabricate successful geolocation data when a lookup fails.

IMPORTANT: The previously shared key should be considered exposed. I will rotate it and provide the replacement through the production environment. Do not reuse or reproduce the exposed value.

## 4. Analytics architecture

Implement first-party analytics with IPstack enrichment.

Separate the following concepts:

1. Page views: each eligible page-view event.
2. Visits/sessions: grouped browsing activity within a defined session window.
3. Unique visitors: privacy-conscious pseudonymous identifiers over a selected reporting period.
4. Authenticated users: application users who have signed in, where their role and identity are available to authorized administrators.
5. Engagement events: meaningful interactions such as course-page visits, lesson openings, and navigation.
6. Geolocation: country, region, and city inferred from the visitor's public IP.
7. Operational events: ingestion failures, geolocation failures, duplicate events, and quota errors.

Do not treat these metrics as interchangeable.

Define a sessionization policy, such as a 30-minute inactivity timeout, and document it. Handle new sessions and returning sessions consistently.

Use UTC timestamps in storage and convert them to the selected display timezone in the dashboard.

### 4.1 Page-view tracking

Track eligible navigation and page-view events across the public website and authenticated application routes.

Support:

- Initial page loads.
- Client-side navigation in single-page applications.
- Next.js navigation, if applicable.
- Page title.
- Normalized pathname.
- Referrer hostname or approved referrer metadata.
- Timestamp.
- Session identifier.
- Pseudonymous visitor identifier.
- Device category.
- Browser family.
- Operating system family.
- Country, region, and city when available.

Do not collect full query strings by default because they can contain tokens, email addresses, search terms, or other sensitive information.

Strip fragments, remove sensitive query parameters, and normalize routes before storage.

Do not record:

- Passwords.
- Authentication tokens.
- Cookies.
- Authorization headers.
- Form contents.
- Private message contents.
- Full IP addresses in general-purpose analytics event documents.
- Student grades, assessment answers, or other educational records as analytics properties.

Respect existing consent mechanisms and applicable privacy requirements. If consent is required, do not initialize nonessential tracking until the required consent is obtained.

### 4.2 Exclude internal and artificial traffic

Provide configurable exclusions for:

- Authorized administrators, if enabled.
- Internal/staging environments.
- Localhost and private/test traffic.
- Known health-check endpoints.
- Automated monitoring requests.
- Duplicate event submissions.
- Identified bots and crawlers when detection is reliable.

Allow authorized administrators to include or exclude internal traffic from reports.

Do not classify all visitors as bots merely because they have unusual user agents.

Clearly label filtered reports and make the exclusion policy configurable.

### 4.3 Reliable event ingestion

Implement a secure analytics ingestion endpoint using the existing routing architecture.

For example, adapt the naming to the current application:

POST /api/analytics/collect

The client should send a minimal event payload such as:

- Event type.
- Normalized pathname.
- Page title, if safe.
- Client-generated event UUID.
- Session identifier.
- Pseudonymous visitor identifier.
- Necessary navigation metadata.

The server must generate the authoritative timestamp.

Validate all input using the project's existing validation library, or an appropriate existing framework validator.

Requirements:

- Enforce a small request-body limit.
- Allow only known event types.
- Validate UUIDs and identifier formats.
- Prevent arbitrary MongoDB query operators from entering stored data.
- Rate-limit ingestion.
- Add duplicate-event protection using an idempotency key or unique event ID.
- Reject malformed requests.
- Avoid returning internal errors to clients.
- Never trust client-submitted IP addresses or geolocation values.
- Never allow a client to choose an arbitrary IP address for geolocation lookup.
- Use the trusted server request context to determine the visitor IP.

If Nginx is behind another proxy, configure trusted proxy handling carefully. Trust forwarding headers only from explicitly trusted reverse proxies. Do not blindly accept arbitrary `X-Forwarded-For` values.

Do not expose analytics ingestion as an unrestricted administrative or database-writing endpoint.

## 5. IPstack geolocation service

Create a reusable server-side service following the existing project conventions.

Responsibilities:

- Determine whether an IP address is eligible for enrichment.
- Reject invalid, loopback, private, link-local, reserved, and other non-public addresses from external geolocation requests.
- Handle IPv4 and IPv6.
- Avoid looking up the server's own public IP as if it were the visitor.
- Check the geolocation cache before calling IPstack.
- Use a bounded timeout.
- Validate the API response.
- Normalize available fields into an internal schema.
- Record a safe error status if enrichment fails.
- Avoid repeated lookups for the same IP.
- Never block page rendering while waiting for IPstack.
- Respect subscription limitations and API usage limits.

Normalize supported fields when present:

- Country code and country name.
- Continent code and name.
- Region code and region name.
- City.
- Postal code only if justified and enabled.
- Latitude and longitude.
- Timezone.
- ISP and ASN.
- Connection type.
- Security indicators only when included in the actual plan.

Do not assume that every field is available on the free subscription. Inspect actual API responses and handle absent or null fields.

IP geolocation represents an estimate of network location. Do not label city-level IP results as the visitor's exact physical location or precise GPS coordinates.

Do not add browser geolocation or GPS tracking.

### 5.1 Cache and quota management

Implement caching using the existing infrastructure where suitable, with MongoDB as a fallback if there is no appropriate cache.

Cache keys should be derived using a server-side HMAC or similarly secure keyed hash of the normalized IP, not the raw IP itself.

Use an appropriate TTL, such as seven days, and make it configurable.

Cache successful lookups. Apply a shorter retry/backoff window to temporary failures to avoid repeatedly consuming the provider's quota.

Do not cache malformed or unauthorized responses indefinitely.

Never send an IPstack request for every page view. Enrich a visitor at most once per cache period, subject to privacy rules and consent.

Track internal provider usage:

- Lookup attempts.
- Successful lookups.
- Failed lookups.
- Cache hits.
- Rate-limit or quota errors.
- Last successful lookup.
- Remaining quota, only if the provider actually exposes a reliable measurement.

Do not invent quota values or claim access to provider billing data that the API does not expose.

If IPstack becomes unavailable, analytics collection and reporting must continue without geolocation enrichment.

## 6. MongoDB data model

Follow the existing model conventions. Add collections or equivalent schemas only where necessary.

Potential entities:

### AnalyticsEvent

- `_id`
- `eventId`
- `eventType`
- `occurredAt`
- `receivedAt`
- `sessionId`
- `visitorIdHash`
- `path`
- `pageTitle`
- `referrerHost`
- `countryCode`
- `countryName`
- `regionName`
- `city`
- `deviceType`
- `browserFamily`
- `osFamily`
- `isInternal`
- `isBot`
- Minimal approved event metadata.

### AnalyticsSession

- `sessionId`
- `visitorIdHash`
- `startedAt`
- `lastSeenAt`
- `endedAt`, if reliably determined
- `pageViewCount`
- `landingPath`
- `exitPath`
- `countryCode`
- `regionName`
- `city`
- `deviceType`
- `browserFamily`
- `osFamily`
- `isInternal`
- `isBot`

### GeoCache

- `ipHash`
- `normalizedGeoData`
- `status`
- `fetchedAt`
- `expiresAt`

### Analytics settings

Use the existing configuration mechanism if one exists. Otherwise store only the minimal operational settings necessary.

These are suggested schemas, not instructions to create redundant collections. Consolidate where practical and preserve the existing architecture.

### Database requirements

- Add appropriate indexes for date ranges, country, event type, path, session ID, and unique event ID.
- Use TTL indexes where appropriate and supported.
- Make event ingestion idempotent.
- Prevent unbounded growth of sessions and event metadata.
- Avoid full collection scans for common dashboard queries.
- Use aggregation pipelines for grouped reports.
- Paginate detailed tables.
- Use projections to limit returned data.
- Set maximum reporting ranges for expensive queries.
- Consider pre-aggregated daily metrics if traffic volume justifies them.
- Ensure concurrent updates do not double-count sessions or page views.

Never store raw IP addresses indefinitely by default. Prefer keyed pseudonymous hashes and short-lived transient IP processing for geolocation. If raw IP processing is strictly necessary, document the purpose, retention period, access controls, and privacy implications before implementing it.

## 7. Admin dashboard navigation

Add an **Analytics** navigation entry to the existing admin sidebar or navigation menu.

Reuse the current dashboard layout and navigation conventions.

Potential routes, adjusted to the actual project:

- `/admin/analytics`
- `/admin/analytics/visitors`
- `/admin/analytics/geography`
- `/admin/analytics/pages`
- `/admin/analytics/events`
- `/admin/analytics/settings`

Do not create all routes if a well-organized single analytics route with tabs or sections fits the existing project better.

Restrict all analytics pages, API endpoints, exports, and settings to authorized administrators using server-side authorization.

Do not rely on hiding the navigation link as an access-control mechanism.

If the platform has multiple roles, define and document which roles can access aggregate statistics, user-linked details, exports, and analytics configuration.

## 8. Analytics overview dashboard

Build a polished overview page using the platform's existing visual language.

Include:

### KPI cards

- Total page views.
- Total sessions.
- Unique visitors.
- New visitors.
- Returning visitors.
- Average pages per session.
- Engagement rate, only if its definition is documented.
- Average session duration, only when the data supports a valid calculation.
- Top country.
- Geolocation coverage rate.

Each KPI should show its comparison against the previous equivalent period when enough data exists.

Provide a meaningful empty state for a new installation.

Never display fabricated sample metrics in production.

### Main traffic chart

A time-series chart displaying:

- Page views.
- Sessions.
- Unique visitors.

Allow the administrator to toggle individual series.

Use the project's existing chart library. If none exists, choose a maintained library compatible with the installed framework.

Support daily aggregation for longer date ranges and finer granularity for short ranges where appropriate.

### Other overview sections

- Top countries.
- Top cities.
- Top pages.
- Top referrer sources.
- Device distribution.
- Browser distribution.
- Operating system distribution.
- Recent visitor activity.
- Latest analytics events.
- Geolocation enrichment status.

Use compact, readable visualizations and avoid overwhelming the page.

## 9. Detailed geography analytics

Create a dedicated geography view.

Provide summary cards and charts for:

- Visitors by country.
- Sessions by country.
- Page views by country.
- Visitors by region.
- Visitors by city.
- Country-level trend over time.
- City-level traffic rankings.
- Percentage of visits with known country, region, and city.

Provide a searchable, sortable, paginated country table with:

- Country.
- Country code or flag.
- Unique visitors.
- Sessions.
- Page views.
- Share of total traffic.
- Change versus previous period.

Provide a city table with:

- City.
- Region.
- Country.
- Unique visitors.
- Sessions.
- Page views.

Add a country filter that updates the related charts and tables.

Add a city search/filter where useful.

A map is optional. If a suitable mapping library already exists, use it. Otherwise prioritize charts and tables over adding a heavy mapping dependency.

Never imply that an IP address identifies an exact building or person.

## 10. Detailed visitor analytics

Build a visitor analytics page with:

- Total visitors.
- New versus returning visitors.
- Visitors by date.
- Session counts.
- Pages per session.
- Traffic by device.
- Traffic by browser.
- Traffic by operating system.
- Geography summaries.
- Recent activity.

If the platform has authenticated users, optionally show an authorized, privacy-conscious distinction between authenticated and anonymous traffic.

Do not expose students' personal details unnecessarily.

Avoid a permanent per-person surveillance interface. Use pseudonymous identifiers for ordinary visitor analysis. If account-level drill-down is genuinely required for legitimate platform administration, restrict it to authorized roles and document the purpose and access policy.

A visitor detail view, if implemented, should prioritize aggregated session behavior and avoid showing raw IP addresses or unnecessary identity information.

## 11. Page and referrer analytics

Create a detailed pages report.

Include:

- Page path.
- Page title.
- Page views.
- Unique visitors.
- Sessions.
- Entrances.
- Exits.
- Average time on page, only when supported by reliable event timing.
- Trend over time.

Add filters for date, country, device type, and page path.

Normalize dynamic routes so individual resource identifiers do not create uncontrolled cardinality.

Do not store sensitive route parameters.

Create a referrer report showing:

- Referrer hostname.
- Sessions.
- Page views.
- Share of traffic.

Distinguish direct traffic from missing referrer data where possible, but do not assume that every missing referrer means direct navigation.

## 12. Events and activity analytics

Support a controlled event vocabulary, for example:

- `page_view`
- `session_start`
- `session_end`, only when reliably determined
- `course_view`
- `lesson_view`
- `navigation_click`, only where justified
- `search_submitted`, without recording sensitive query content
- `download_started`, without storing private file names
- `login_success`, if approved and already compatible with authentication logging

Use existing business events where available instead of duplicating them.

Do not automatically instrument every button or every user action.

Do not collect keystrokes, form values, private messages, or student assessment answers.

Provide an events table with:

- Event type.
- Timestamp.
- Page path.
- Country.
- Device category.
- Session identifier, pseudonymous.
- Relevant safe metadata.

Add search, filtering, pagination, and CSV export where appropriate.

All event metadata must be allowlisted, size-limited, and sanitized.

## 13. Global filters and date handling

Provide a consistent filter bar across the analytics pages.

Support:

- Today.
- Yesterday.
- Last 7 days.
- Last 30 days.
- Last 90 days.
- Custom date range.
- Country.
- Region.
- City.
- Device.
- Browser.
- Operating system.
- Page path.
- Internal traffic inclusion/exclusion.

Use explicit date boundaries and a consistent reporting timezone.

Default to the previous 30 days if suitable.

Clearly display the active reporting period.

When filters change, update all relevant KPI cards, charts, and tables consistently.

Do not calculate percentages by averaging percentages from different groups. Use the appropriate underlying totals.

Prevent invalid date ranges and excessive database queries.

## 14. API endpoints for reporting

Follow the project's existing API architecture. The following are logical examples, not a requirement to create every endpoint separately:

- `POST /api/analytics/collect`
- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/timeseries`
- `GET /api/admin/analytics/geography`
- `GET /api/admin/analytics/visitors`
- `GET /api/admin/analytics/pages`
- `GET /api/admin/analytics/referrers`
- `GET /api/admin/analytics/events`
- `GET /api/admin/analytics/provider-status`
- `GET /api/admin/analytics/export`

Implement only the endpoints that fit the existing architecture.

Requirements:

- Enforce authorization server-side.
- Validate and clamp all query parameters.
- Use pagination and safe sorting.
- Use aggregation pipelines with appropriate indexes.
- Set response size limits.
- Return a consistent response format.
- Avoid exposing database documents directly.
- Handle unavailable or incomplete geolocation data.
- Return safe error messages.
- Avoid leaking infrastructure details.
- Add suitable cache headers for administrative responses.
- Never publicly expose provider usage or administrative statistics.

Do not add a public API for arbitrary IP lookups.

## 15. UI and design system

The new module must look native to the existing e-learning platform.

Before implementing any component, inspect the existing pages and identify the design patterns already in use.

Preserve:

- Current colors and theme.
- Typography.
- Sidebar.
- Header.
- Navigation behavior.
- Spacing and layout conventions.
- Border radius.
- Existing icon family.
- Existing chart and table styling.
- Loading skeletons.
- Toast notifications.
- Dark mode, if already supported.
- Responsive behavior.
- Existing reusable components.

Do not redesign the entire application.

Do not introduce an unrelated visual identity.

Use a professional analytics-dashboard presentation with:

- Clear hierarchy.
- Compact KPI cards.
- Consistent chart titles and legends.
- Useful empty states.
- Skeleton loading states.
- Error and retry states.
- Searchable tables.
- Sticky table headers when consistent with the existing UI.
- Responsive filters.
- Accessible labels, focus indicators, and keyboard navigation.

Avoid unnecessary animation and decorative elements that reduce readability.

All tables and charts must work on mobile and desktop.

## 16. Performance and scalability

The feature must not noticeably slow down course pages, authentication, or normal navigation.

Requirements:

- Use asynchronous event delivery.
- Do not block page rendering on analytics requests.
- Batch or deduplicate events when appropriate.
- Avoid a database write for every React render.
- Avoid duplicate tracking caused by React Strict Mode or repeated navigation callbacks.
- Use efficient indexes.
- Limit dashboard query ranges.
- Cache expensive aggregate results briefly where appropriate.
- Cancel stale frontend requests when filters change.
- Debounce search input.
- Paginate detailed tables.
- Avoid excessive polling.
- Avoid creating an analytics request loop.
- Ensure the analytics service fails independently of the main application.

Keep the implementation compatible with the VPS's actual available memory and CPU.

Do not introduce Redis, Kafka, Elasticsearch, or another major service unless the existing architecture and measured workload genuinely justify it.

## 17. Security and privacy requirements

This is a real educational platform with authenticated users and potentially sensitive learner activity.

Implement the following safeguards:

- Server-side authorization on every administrative endpoint.
- Secret management through environment variables.
- Trusted-proxy configuration.
- Input validation and output sanitization.
- Rate limiting.
- Event deduplication.
- Bounded payload sizes.
- Safe error logging.
- No raw IP addresses in general-purpose logs.
- No API keys or tokens in logs.
- No raw IP addresses in browser-visible event payloads.
- Configurable data retention and deletion.
- Privacy-conscious visitor identifiers.
- Documented session and visitor counting definitions.
- Appropriate consent behavior.
- Restricted CSV export access.
- Audit logging for sensitive administrative actions, using the existing audit mechanism if available.

Do not implement fingerprinting based on canvas, fonts, audio, or other invasive browser characteristics.

Do not attempt to bypass VPNs, proxies, browser privacy protections, or user consent.

Do not identify a person based solely on geolocation data.

Use only the provider fields available under the configured subscription.

Add a short privacy and operational document explaining what is collected, why, where it is stored, who can access it, and how long it is retained.

## 18. Deployment integration

Inspect the existing Docker Compose configuration and production deployment process.

Do not change the currently running service topology unnecessarily.

Update the relevant environment configuration so that the application receives the rotated IPstack key at runtime.

Ensure:

- The key is not baked into Docker images.
- The key is not copied into a publicly served directory.
- The application can start if IPstack is temporarily unavailable.
- MongoDB indexes are created safely.
- Database migrations or initialization tasks are idempotent.
- Existing volumes are preserved.
- Existing course data and users remain intact.
- Existing Nginx routing continues to work.
- Existing application ports remain unchanged unless necessary.
- Health checks continue to function.
- Existing Ollama and RustFS services are not modified without a clear technical reason.

Do not run destructive commands.

Do not remove Docker volumes.

Do not reset the database.

Do not perform a production deployment or restart services without my authorization.

Provide exact commands for applying the changes after the implementation has been reviewed.

## 19. Testing requirements

Add tests using the project's existing testing framework.

At minimum, test:

### Event collection

- Valid page-view events.
- Invalid payloads.
- Duplicate event IDs.
- Malformed identifiers.
- Oversized payloads.
- Rate-limited clients.
- Missing or malformed paths.
- Server-generated timestamps.
- Trusted-proxy IP handling.

### IPstack integration

- Successful lookup.
- Missing API key.
- Invalid API key.
- Quota exhaustion.
- Provider timeout.
- Network failure.
- Invalid response.
- Private IP rejection.
- IPv4 and IPv6.
- Cache hits.
- Cache expiration.
- Missing optional response fields.

### Reporting

- Date-range boundaries.
- Country aggregation.
- City aggregation.
- Unique visitor calculations.
- Sessionization.
- New versus returning visitors.
- Page rankings.
- Pagination.
- Filtering.
- Empty datasets.
- Missing geolocation data.

### Authorization and security

- Anonymous users cannot access admin reports.
- Non-admin users cannot access restricted reports.
- Public clients cannot access arbitrary IP lookup endpoints.
- No API key is exposed to the frontend.
- Invalid sort and filter parameters are rejected.
- Export endpoints enforce authorization.

### UI

- Loading state.
- Empty state.
- Error state.
- Date filter changes.
- Country filtering.
- Responsive tables.
- Charts with missing or zero-valued data.

Use mocked IPstack responses in automated tests. Automated tests must not consume real API quota.

Run the project's existing lint, type-check, tests, and production build commands.

Fix any regressions introduced by the implementation.

## 20. Documentation and deliverables

Create or update a concise implementation document, for example:

`docs/analytics-ipstack.md`

Document:

- Architecture and data flow.
- Required environment variables.
- How to configure the API key.
- How geolocation caching works.
- How the visitor and session metrics are calculated.
- Which fields are available only on certain provider plans.
- Database indexes and retention.
- Privacy and consent assumptions.
- How to run migrations or initialize indexes.
- How to run tests.
- How to build and deploy.
- How to troubleshoot provider errors and quota limits.
- How to disable analytics safely.

At the end, provide:

1. A summary of what was implemented.
2. The files created and modified.
3. The database changes and indexes.
4. The API endpoints created.
5. The analytics pages and charts added.
6. The environment variables that must be configured.
7. The tests and build checks executed, with actual results.
8. Any remaining limitations.
9. Exact deployment commands for review and later execution.
10. A checklist of anything that still requires manual configuration.

## 21. Execution strategy

Work incrementally:

Phase 1: Inspect the codebase and establish the real architecture.

Phase 2: Design the analytics data model and secure ingestion pipeline.

Phase 3: Implement server-side IPstack integration, caching, and error handling.

Phase 4: Implement aggregation queries and protected reporting APIs.

Phase 5: Integrate the Analytics navigation and dashboard pages.

Phase 6: Implement detailed geography, visitors, pages, and events reports.

Phase 7: Add privacy controls, retention, indexes, and security protections.

Phase 8: Add automated tests and documentation.

Phase 9: Run checks, inspect the diff, and prepare deployment instructions.

Do not stop at mockups or frontend-only components. Implement working data collection, persistent storage, real reporting queries, actual chart data, and protected APIs.

Do not invent historical analytics data. If the platform has never tracked visits, explain that historical reports will begin when tracking is activated. Existing Nginx logs may provide limited historical request data, but only import them if a safe, well-defined import is feasible and clearly distinguish imported request counts from true page views and sessions.

Preserve all existing functionality and keep the code maintainable.

**Begin by inspecting the repository, then implement the complete feature using the project's actual architecture and established coding conventions.**
