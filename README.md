# Money Tracker v2

Responsive personal finance and daily challenge tracker, rebuilt from the supplied Next.js project. English interface, desktop sidebar, mobile bottom tabs, installable PWA, consistent light/dark/system themes. Routes: dashboard, tracker, budget/points, challenges, pending bills, AI companion, export, settings.

## Run

Node.js 22+; `npm ci`, `npm run dev`. Production: `npm run build` creates the static `out/` application and a versioned service worker. Serve `out/` over HTTPS (localhost also allowed). `npm test` verifies the domain model. Site build helper is used when publishing through ChatGPT Sites.

## Rules

- Default complete +2, missed −2, all scheduled challenges complete +5. The all-done bonus applies once per day regardless of count. 10 complete means 25 points. Negative balances are allowed (1 − 2 = −1), points never reset, no daily limits.
- Each planned challenge snapshots its reward/penalty. Each day snapshots its bonus. Changes in Settings apply to newly created items/days. Check/uncheck recalculates stable ledger entries, including the all-done bonus.
- Pending challenges on elapsed days become missed on app startup/resume or while open. Days without a schedule do not incur penalties. Completed days lock when elapsed. No automatic recurring challenges: copy any existing day or a template into an empty current/future date. Edit pending challenge names, start times, durations.
- Category budgets reset monthly. Food and groceries share Food & beverages. Outgoing transactions cannot exceed the selected category's remaining budget. Change base allocations explicitly in Budget; add spending room by redeeming points 1:1.
- At month rollover, remaining balances in opened months convert once to points. Example: 6000 − 4680 = 1320 points. Unused top-ups are included, recovering their value, not creating duplicate points. Skipped inactive months never mint allocations or points. Closed financial periods cannot be edited. New categories do not retroactively receive budgets.
- Points are spending authorization inside this tracker, not real cash or income. Income is separately recorded; wallet = income − expense. No bank connection or real payment blocking.
- Pending bills affect neither cash nor budget until explicitly paid. Paying posts one expense, respects category budget, and is idempotent. Removing that expense reopens its bill.
- Demo data are clearly labelled. “Start with my own data” starts a clean account. TWD/Asia-Taipei defaults, currency and timezone editable before records/schedules exist. No real records included.

## Persistence and backup

Browser localStorage (`money-tracker-v2`) is the primary store. Same-origin tabs use Web Locks where supported and storage events. Data does not automatically sync between devices. Export JSON regularly; clearing browser data removes local records. Backup import validates and previews before replacement. CSV exports escape formula injection and include a UTF-8 BOM. Data load errors preserve the original stored content for recovery.

Original Firebase client integration is retained. Optional email/Google login and **manual** backup/restore use `users/{uid}/trackerV2/backup`. Requires original Firebase public build variables from `.env.example`, enabled auth providers, published rules, and the deployed hostname in Firebase Authorized Domains. No cloud account credentials or private API keys are included. Optional legacy importer reads expenses, incomes and points balance, locks historical periods without retrospective bonuses. Legacy wallet adjustments, denominations, projects and detailed challenge history are not imported. Existing Firebase data is never modified by migration.

## Google Calendar

Two ready-to-use options without OAuth configuration: per-challenge “Google Calendar” opens a pre-filled event for the user to save; `.ics` export includes alarms for calendar import. No event is sent merely by viewing a page.

Direct sync: enable Google Calendar API in your Google Cloud project; configure OAuth consent; create a Web OAuth client; add the deployed origin to Authorized JavaScript origins and add test users if necessary. Save its **client ID**, never a client secret, in Settings. Connect and approve `calendar.events.owned`. Tokens are only in memory and expire. Explicit per-challenge Sync creates/updates one deterministic event ID in the primary calendar with the selected reminder. It is one-way; edit then click Update event. Deleting a challenge does not delete the calendar event. Reconnect when the session expires. This app does not request a refresh token and does not sync in the background.

Reference: https://developers.google.com/identity/oauth2/web/guides/use-token-model and https://developers.google.com/calendar/api/v3/reference/events/insert

## AI companion

Local calculations provide budget usage, completion rates and pending-payment summaries without sending data. They are labelled as rule-based, not model-generated. To request AI analysis, enter a personal Gemini key for the current session and press Analyze. The key stays in React memory only (not localStorage, backup, or source). The direct API receives aggregate finances, unpaid amounts/due dates, the last 14 recorded days' challenge titles/statuses and the question, as disclosed in the UI. Review provider usage/costs. Configure a model available to the key in Settings. The default identifier is `gemini-2.5-flash`; it is configurable, not a guarantee of provider availability. Suggestions require an explicit click to add a challenge. No automatic financial mutations. Live API/Calendar/Firebase connections require user configuration and have not been tested with real accounts.

Reference: https://ai.google.dev/gemini-api/docs/text-generation

## Install/offline

Manifest, 192/512 icons, standalone display, safe-area mobile tabs and service worker included. Android/desktop Chromium: browser Install App or Settings → Install app when supported. iPhone: Safari → Share → Add to Home Screen. This is a PWA, not an APK/App Store binary. Offline shell is cached only after a successful initial production load and service-worker installation; APIs/cloud/Calendar require a network. Private hosting may still require platform sign-in on initial access. Automated penalties/month rollovers run when the app is opened/resumed; calendar reminders run in the chosen calendar. No background job claims.

## Verification

`npm test`: scoring, negative balances, duplicate prevention, complete bonus undo, rollover, monthly limits, point top-ups, historical locks, inactivity, bill idempotence, copy/edit schedules, backup validation and income separation. `npm run build` includes TypeScript checking and production static generation. Browser QA covers desktop/mobile navigation, forms, theme contrast and persisted changes; hardware installation and live external integrations require account/device testing.

Original source retained under `legacy/src/` for reference and migration, excluded from compilation. Files from the original project not used by v2 are not active application behavior.
