# Velour Hairs & Beauty — Booking & Shop Platform

A full-stack hair salon booking & shop platform built with React and Node.js, fully powered by **Firebase Cloud Functions (v2)** and **Cloud Firestore**.

Features service catalog, appointment booking with live slot availability, a hair care shop with checkout, and a full admin dashboard.

---

## Tech Stack

- **Frontend**: React 19 + Vite + React Router + Tailwind CSS
- **Backend**: Node.js + Express + Firebase Cloud Functions v2 (`onRequest`)
- **Database**: Cloud Firestore (NoSQL cloud persistence with auto-seeding)
- **Authentication**: JWT & Admin credentials

---

## Project Structure

```
velour/
├── firebase.json            # Firebase Functions, Hosting rewrites, Firestore & Emulators config
├── .firebaserc              # Firebase project target
├── firestore.rules          # Firestore database security rules
├── firestore.indexes.json   # Firestore database index definitions
├── package.json             # Root workspace scripts (dev, build, deploy)
│
├── server/                  # Backend Express API & Firebase Functions
│   ├── index.js             # Entry point & exported Cloud Function (exports.api)
│   ├── db.js                # Firebase Admin SDK init + Firestore auto-seeding
│   ├── routes/              # services, products, bookings, orders, admin
│   ├── middleware/          # JWT auth guard
│   ├── package.json         # Backend dependencies & npm scripts (start, dev)
│   └── .env                 # Server env config (PORT, JWT_SECRET, FIREBASE_PROJECT_ID)
│
└── client/                  # Frontend React application (Vite)
    ├── src/pages/           # Home, Services, Shop, Cart, Booking, Admin
    ├── src/components/      # Navbar, Footer, ServiceCard, ProductCard, CircleCollage
    ├── src/context/         # Cart state, Admin auth state
    └── src/lib/             # API client, formatting helpers
```

---

## Getting Started

### 1. Configure Firebase Credentials

1. Open [Firebase Console](https://console.firebase.google.com/) and create (or select) your Firebase Project.
2. Enable **Cloud Firestore** in your Firebase project.
3. In [server/.env](file:///home/aziel/Music/velour/server/.env), set your Firebase Project ID:
   ```env
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ```
4. *(For local development)*: Download a Service Account private key from **Firebase Console > Project Settings > Service Accounts > Generate new private key**, save it as `server/serviceAccountKey.json`, and reference it in `server/.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
   ```

---

### 2. Running Locally

You can run both client and server from the root or in separate terminals:

**Backend (Port 4000):**
```bash
cd server
npm install
npm run dev
# or: npm start
```
*On first boot, it automatically seeds Firestore with default salon services, shop products, and the initial admin account.*

**Frontend (Port 5173):**
```bash
cd client
npm install
npm run dev
```

**Admin credentials** (set in `server/.env`):
- Username: `admin`
- Password: `velour2026`

---

## Deploying to Firebase

### Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
firebase login
```

### Link your Firebase project
```bash
firebase use --add
```
*(Select your Firebase project or enter its project ID)*

### Deploy everything (Hosting + Functions + Firestore rules)
```bash
npm run deploy
```

Or deploy individual parts:
- **Deploy backend function**: `npm run deploy:functions`
- **Deploy frontend to hosting**: `npm run deploy:hosting`
- **Deploy Firestore rules**: `npm run deploy:firestore`

---

## Features

- **Services**: Categorized hair services (Braiding, Styling, Locs, Wigs, Treatments) with duration and pricing.
- **Live Booking**: Real-time slot availability check prevents double-booking.
- **Shop & Cart**: Browse products, manage cart quantities, and submit orders with server-side price recalculation.
- **Admin Dashboard**: Real-time stats summary, booking management (update status / cancel), order tracking, and dynamic service/product creation.
