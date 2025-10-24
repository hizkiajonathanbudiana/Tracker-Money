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