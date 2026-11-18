# Simple Money Spend Tracker (MVP)

A minimal, secure web app for tracking expenses built with Next.js, Firebase, and Tailwind CSS.

## Features

-   **Secure Authentication:** Email/Password and Google login.
-   **Protected Dashboard:** All app routes are private.
-   **Expense Tracking:** Add, view, and delete expenses.
-   **Data Visualization:** Charts for spending by category and over time.
-   **Mobile-First Design:** Clean UI built with Tailwind CSS.

## Tech Stack

-   **Next.js (App Router)**
-   **TypeScript**
-   **Firebase** (Auth & Firestore)
-   **Tailwind CSS**
-   **Chart.js** (`react-chartjs-2`)
-   **Vercel** (Deployment)

---

## Firebase Setup Guide

Follow these steps to configure your Firebase backend.

### 1. Create Your Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **Add project** and give it a name (e.g., "money-tracker-app").

### 2. Enable Authentication Methods

1.  In the Firebase Console, go to **Build** > **Authentication**.
2.  Click **Get started**.
3.  Go to the **Sign-in method** tab.
4.  Enable **Email/Password**.
5.  Enable **Google** (you will be prompted to set a project support email).

### 3. Set Up Firestore Database

1.  Go to **Build** > **Firestore Database**.
2.  Click **Create database**.
3.  Start in **Production mode**.
4.  Choose a Firestore location (e.g., `nam5 (us-central)`). **This cannot be changed later.**

### 4. Apply Security Rules

This is the most important step for security.

1.  Go to the **Firestore Database** > **Rules** tab.
2.  Replace the default rules with the following:
    ```
    rules_version = '2';

    service cloud.firestore {
      match /databases/{database}/documents {
        
        // Users can only read, create, update, and delete their own expenses.
        // The {uid} wildcard must match the authenticated user's ID.
        match /users/{uid}/expenses/{expenseId} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }
      }
    }
    ```
3.  Click **Publish**.

### 5. Get Environment Variables

1.  Go to your **Project Overview** (click the project name at the top).
2.  Click the **Web icon** (`</>`) to add a new web app.
3.  Give it a nickname (e.g., "Web App") and click **Register app**.
4.  You will be shown a `firebaseConfig` object. You need these values.

---

## Project Setup (Local)

### 1. Create `.env.local` File

In the root of your project, create a file named `.env.local`. Copy the keys from your `firebaseConfig` object and add the `NEXT_PUBLIC_` prefix to each.

**.env.local**
---

## Points & Daily Challenges (economy layer)

Every account has a small economy under `users/{uid}/...`. All values are editable from
**Points → Point settings**, no redeploy needed. The whole UI is in English.

### Concepts

All money is shown in **US dollars** (`$`, two decimals). `currencyCode`, `currencySymbol`,
`locale` and `decimals` live in the settings doc, so a different currency is a settings change,
not a code change.

| Concept | Meaning |
| --- | --- |
| Points | Earned from daily challenges and from finishing raw-material projects |
| Point value | `moneyPerPoint` (default 1 pt = $1) |
| Food allowance | `monthlyRegularAllowance` (default $6,000/month) — food & drink only |
| Project allowance | `monthlyProjectAllowance` (default $2,000/month) — raw materials |
| Daily limit | `dailyBaseLimit` = the monthly food allowance spread over the days of the month; a fixed `dailyLimit > 0` overrides it |
| Regular categories | `regularCategories` — which categories spend the food allowance (default Food & Beverage, Groceries, Coffee, Drinks, Treats, Snacks). Rent, utilities, transport and anything else are tracked but never touch it |
| Earn cap | `dailyEarnCap` (default 50 pts/day) — most points you can earn in a day |
| Redeem | Turn points into today's treat (`treat`) or cash out to the wallet (`cashout`) |
| Raise the limit | Points can break the limit: one step = `boostStepPoints` pts = `moneyPerPoint x boostStepPoints` extra money, capped by `maxBoostPointsPerDay` |
| Raw materials | Per-project ingredient purchases; their money is **spread into** the daily limit, and still checked against the project budget |

- Days roll over at 00:00 in the timezone stored in the settings (`timeZone`, default
  `Asia/Jakarta`, editable on Points → Settings), never at UTC midnight, so a 00:30 challenge still
  belongs to that day and the countdown on the Points page shows the next reset.
- The daily limit covers treat spending, redeemed treats **and the daily share of raw materials**;
  balances and pace are summarised on the dashboard (`MonthlyAllowanceCard`, `SpendTrendCard`).
- Limits and caps are frozen per day in `days/{yyyy-MM-dd}` so changing settings never rewrites history.
- **Points can raise the limit.** Example: daily limit $10, one boost step of 10 pts ($10) makes
  today's limit $20. Boosts live in `days/{yyyy-MM-dd}` (`boostedMoney`, `boostedPoints`), are
  logged to the ledger as `boost`, and cannot exceed `maxBoostPointsPerDay` (default 30 pts/day =
  $30 extra). Disable with `limitBoostEnabled` on Points → Settings.
- **Raw materials count inside the daily limit.** A single grocery run cannot fit in one day, so the
  purchase is split over `spreadDays` (default `defaultSpreadDays`, 7): today's share is charged to
  today immediately, the rest sits in `users/{uid}/charges` and is folded into its own day when that
  day arrives (`applyPendingCharges`, called on load). With a $10 daily limit, buying $100 over 10
  days charges exactly $10 per day; over 7 days it charges $14.26 on day one and $14.29 after that,
  so those days show over budget until points boost them. The purchase itself is never blocked by
  the limit (only by the project budget and wallet balance), and deleting the expense reverses every
  share it created. Turn the whole behaviour off with `spreadRawMaterials`; `spreadDays = 1` charges
  the full amount to today.
- Raw materials are logged as expenses in the `Raw Materials` category and lower the wallet balance,
  so project capital stays visible: `spent / outputQuantity` = cost per produced unit.

### Firestore layout

```
users/{uid}/settings/economy              # settings (currency, allowances, rate, cap, spread, timezone)
users/{uid}/points/summary                # point balance + lifetime counters
users/{uid}/ledger/{opId}                 # point history (challenge, redeem, cash-out, bonus, boost)
users/{uid}/days/{yyyy-MM-dd}             # per-day limit & cap (spentMoney, rawMaterialSpent, boostedMoney/Points)
users/{uid}/days/{yyyy-MM-dd}/completions/{challengeId}
users/{uid}/charges/{expenseId}_{n}       # pending raw-material shares for future days
users/{uid}/challenges/{challengeId}      # daily challenge list
users/{uid}/rewards/{rewardId}            # reward list (treat / cashout)
users/{uid}/redemptions/{opId}            # point redemptions
users/{uid}/projects/{projectId}          # raw materials -> product projects
users/{uid}/projects/{projectId}/items/{itemId}
```

### Security rules

Repo sudah punya `firestore.rules` + `firebase.json`, jadi rules tidak perlu ditempel manual:

```bash
firebase login                     # akun Google yang punya project money-tracker-aa8c1
firebase deploy --only firestore:rules --project money-tracker-aa8c1
```

Isi filenya:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Kalau CLI tidak bisa dipakai, salin blok di atas ke **Firestore → Rules** di console lalu Publish.

Kalau ingin lebih ketat per koleksi, ganti baris wildcard dengan daftar eksplisit:

```
    match /users/{uid}/expenses/{id} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/settings/{id} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/points/{id}   { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/ledger/{id}   { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/days/{id}     { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/challenges/{id}  { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/rewards/{id}     { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/redemptions/{id} { allow read, write: if request.auth != null && request.auth.uid == uid; }
    match /users/{uid}/projects/{id}    { allow read, write: if request.auth != null && request.auth.uid == uid; }
```

Catatan: aplikasi memakai client SDK tanpa Cloud Functions, jadi pengecekan limit/poin terjadi di
transaksi client. Rules di atas mencegah akses antar-user, bukan memvalidasi besaran poin.

### Build

Next.js 16 memakai Turbopack secara default, sedangkan `next-pwa` masih butuh webpack config.
Script `build` di `package.json` sudah memakai flag `--webpack`, jadi cukup:

```bash
npm ci
npm run build
```

Butuh 7 variabel `NEXT_PUBLIC_FIREBASE_*` (lihat `.env.example`) sebelum build/dev, karena
`src/lib/firebase.ts` membaca semuanya dari environment.
