# AGENT.md

This file provides guidance to agents when working with code in this repository.

## Commands

```bash
# Development (loads .env.local, runs on port 3000)
npm run dev

# Build for production
npm run build

# Run built output
npm run start

# Tests
npm run test          # run all tests once (vitest)

# Lint & format
npm run lint          # eslint
npm run format        # prettier --check
npm run check         # prettier --write + eslint --fix (auto-fix both)
```

Add shadcn components:

```bash
npx shadcn@latest add <component>
```

## Architecture

This is a **TanStack Start** app — a full-stack React SSR framework built on TanStack Router. It is not a plain SPA; routes render on the server and hydrate on the client.

**Request lifecycle:**

1. `instrument.server.mjs` is loaded first via `--import` — it initialises Sentry before anything else runs.
2. TanStack Start handles SSR, then hydrates on the client.
3. The router is created in `src/router.tsx` via `getRouter()`, which wires TanStack Query into the router context so server-fetched query data is dehydrated/rehydrated automatically (`setupRouterSsrQueryIntegration`).

**Routing — file-based:**

- All routes live in `src/routes/`.
- `src/routes/__root.tsx` — root layout (`shellComponent`). This is where the HTML shell, global styles, and devtools panels live. All routes render inside it.
- `src/routes/index.tsx` — the `/` route.
- New routes = new files in `src/routes/`. TanStack Router auto-generates `src/routeTree.gen.ts` — never edit this file manually.
- Use `<Link to="..." />` from `@tanstack/react-router` for client-side navigation.

**Data fetching:**

- Prefer **route loaders** (`loader` in `createFileRoute`) for route-level data — dehydrates on server, no waterfall.
- Use **TanStack Query** (`useQuery`) for component-level or shared data. The `QueryClient` is injected via router context (`src/integrations/tanstack-query/root-provider.tsx`).
- Server functions: `createServerFn` from `@tanstack/react-start` for server-only logic callable from the client.

**Styling:**

- Tailwind CSS v4 (configured via the Vite plugin, not a config file).
- Design tokens are CSS custom properties defined in `src/styles.css`. Brand palette: `--sea-ink`, `--lagoon`, `--palm`, `--sand`, `--foam`, etc. Use these instead of raw colour values.
- Dark mode uses the `.dark` class variant (`@custom-variant dark`).
- Utility helper: `cn()` in `src/lib/utils.ts` — combines `clsx` + `tailwind-merge`.
- UI components follow the **shadcn/ui "new-york"** style. Add components with `npx shadcn@latest add <name>`; they land in `src/components/ui/`.
- Global utility classes defined in `src/styles.css`: `.page-wrap` (max-width container), `.island-shell` (frosted card), `.display-title` (Fraunces serif), `.island-kicker` (uppercase label), `.nav-link`, `.rise-in` (entrance animation).
- Fonts: **Manrope** (body/UI, `--font-sans`) and **Fraunces** (display headings).

**Path aliases:**

- `#/*` → `src/*` (package.json imports field + tsconfig `paths`)
- `@/*` → `src/*` (tsconfig only)

**Observability:** Sentry is initialised server-side via `instrument.server.mjs`. Requires `VITE_SENTRY_DSN` in `.env.local`.

## Auth token management

- Access token (JWT, 15 min) and refresh token are returned by the API on login/register.
- Store the access token in memory (Zustand auth store — **not** localStorage to avoid XSS exposure).
- Store the refresh token in an httpOnly cookie (set by the API, not accessible from JS).
- On 401 response: call `POST /api/v1/auth/refresh` with the refresh token cookie, then retry the original request.
- On logout: call `POST /api/v1/auth/logout` and clear the auth store.
- TanStack Query retry logic should detect 401s and trigger the refresh flow before retrying.

## Zustand stores

Keep Zustand for global client-only state that TanStack Query doesn't own:

| Store                  | Contents                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `useAuthStore`         | current user (`id`, `username`, `role`, `avatarUrl`), access token, login/logout actions |
| `useWsStore`           | WebSocket connection instance, connection status (`connecting \| open \| closed`)        |
| `useNotificationStore` | unread count, in-app notification list (populated from WS events)                        |

Do **not** put server-fetched data (posts, categories, users) in Zustand — that belongs in TanStack Query cache.

## WebSocket client

Connect to `ws://api/ws?token=<access_token>` after login. Reconnect on close with exponential backoff.

Incoming message types from the server:

- `{type: "notification", payload: Notification}` — push into `useNotificationStore`
- `{type: "dm", payload: Message}` — update the active conversation in TanStack Query cache

Manage the WS connection lifecycle in a top-level component (e.g., `__root.tsx`) so it persists across route navigations. Store the socket instance in `useWsStore`.

## Web Push / Service Worker

Off-site notifications use the browser Push API + a Service Worker.

Setup flow:

1. On login, register `service-worker.js` at the root scope.
2. Fetch the VAPID public key from `GET /api/v1/push/vapid-public-key`.
3. Subscribe the browser via `PushManager.subscribe({ applicationServerKey: vapidKey, userVisibleOnly: true })`.
4. POST the resulting subscription object to `POST /api/v1/push/subscribe`.
5. The service worker handles `push` events and calls `self.registration.showNotification(...)`.

The service worker lives at `public/service-worker.js` (served from the root path).

User notification preferences are managed via `PUT /api/v1/notifications/preferences` — show a toggle UI in the profile settings page.

## AI features (frontend)

### Writing assistant (Tiptap integration)

- Add an "Améliorer avec l'IA" button to the Tiptap toolbar (custom extension or bubble menu).
- On click: POST the current editor content to `POST /api/v1/ai/improve`.
- Display the improved text as an inline suggestion (accept/reject pattern). Do not auto-replace.
- Show a loading spinner during the API call; disable the button while in flight.

### Semantic search

- The main search bar sends the user's natural-language query to `GET /api/v1/search?q=`.
- Render results the same as the standard post list (reuse the post card component).
- Debounce the query (≥300 ms) before firing.

## Captcha (reCAPTCHA v3 or v2)

Use `@google-cloud/recaptcha-enterprise` or a lightweight wrapper. On the register form:

- Execute reCAPTCHA to obtain a token.
- Include the token in the `POST /api/v1/auth/register` request body.
- The backend verifies the token against Google's API using `RECAPTCHA_SECRET`.

## Route conventions

All routes live in `src/routes/`. Key pages to implement:

| Route                  | Notes                                      |
| ---------------------- | ------------------------------------------ |
| `/`                    | post feed (SSR, public)                    |
| `/posts/$id`           | single post + comments (SSR, public)       |
| `/posts/new`           | create post with Tiptap editor (member)    |
| `/posts/$id/edit`      | edit post (owner or mod)                   |
| `/search`              | semantic search results                    |
| `/profile/$userId`     | user profile + activity                    |
| `/settings`            | account settings, notification preferences |
| `/messages`            | DM conversation list                       |
| `/messages/$userId`    | conversation with a specific user          |
| `/admin`               | admin dashboard (admin/mod only)           |
| `/admin/moderation`    | AI moderation review panel                 |
| `/auth/login`          | login form                                 |
| `/auth/register`       | register form + captcha                    |
| `/auth/password-reset` | request + confirm flows                    |

## Environment variables (`.env.local`)

```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_SENTRY_DSN=
VITE_RECAPTCHA_SITE_KEY=
```
