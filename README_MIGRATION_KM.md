# TutorPay Ledger — Google Sheets + Vercel + Firebase Auth

## Architecture
- React/Vite frontend is hosted on Vercel.
- Firebase Authentication remains the Google sign-in provider.
- `/api/ledger` is a Vercel serverless API. It verifies Firebase ID tokens with Firebase Admin SDK.
- Google Sheets is the application database. The API owns all spreadsheet access; browser code never receives the Google service-account key.

## Google Sheets setup
1. Create a Google Spreadsheet, for example `TutorPay_Database`.
2. Copy its spreadsheet ID from the URL (`/spreadsheets/d/SPREADSHEET_ID/edit`).
3. Enable **Google Sheets API** in the Google Cloud project used by the Google service account.
4. Create a Google service account and download its JSON key.
5. Share the spreadsheet with the service account's `client_email` as **Editor**.
6. The API creates these tabs and headers automatically: `Users`, `Classes`, `Students`, `Payments`.
7. Each tab uses readable columns for its actual fields (for example `studentCode`, `fullName`, `gender`, `classId`, `monthlyFee` in `Students`; and `receiptNo`, `studentId`, `amountPaid`, `paidDate` in `Payments`), alongside `id`, `ownerId`, `createdAt`, and `updatedAt`. This preserves the app data model while letting you inspect and filter records directly in Sheets.

## Firebase Authentication setup
1. Use the Firebase project already configured for this application, or replace the web configuration with your own Firebase project's Web App config.
2. Enable Google as a sign-in provider in Firebase Authentication.
3. Add the deployed Vercel domain to Firebase Authentication > Settings > Authorized domains.
4. Create a Firebase service account with permission to verify Firebase ID tokens. Set its JSON in Vercel as `FIREBASE_SERVICE_ACCOUNT_JSON`.
5. The `email_verified` claim is required by the API.

## Vercel environment variables
Set these in Vercel Project > Settings > Environment Variables:
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase Admin service account JSON, server-side only.
- `GOOGLE_SERVICE_ACCOUNT_JSON` — Google service account JSON, server-side only.
- `GOOGLE_SHEETS_ID` — spreadsheet ID.

The Firebase web config is currently retained in `firebase-applet-config.json` for compatibility with the original project. It is a public client config, not a service-account key. For a different Firebase project, update that file to the project's Web App values. Never put either service-account JSON in a `VITE_` variable.

## Deploy
```bash
npm install
npm run build
```
Push the project to GitHub and import it into Vercel. Vercel detects Vite automatically. Set the environment variables before deploying.

## One-time migration from Firestore
1. Keep the old Firestore database and its security rules available during migration.
2. Deploy the new version and configure both service accounts and the spreadsheet ID.
3. Sign in using the same Google account that owns the old Firestore records. The email must be verified.
4. Open **Settings** in TutorPay and choose **Start migration from Firebase to Google Sheets**.
5. The migration reads only the signed-in user's `users/{uid}` profile and records whose `ownerId` equals that UID. It imports by original document ID and skips IDs already present, so it can be safely retried without duplicate rows.
6. Check the four tabs in Google Sheets and compare counts before considering the migration complete.
7. Do not delete the old Firestore project until you have verified the data and retained a backup/export.

## Notes and limitations
- Google Sheets is suitable for a small/medium tuition ledger. It is not a transactional database; simultaneous writes can be slower than Firestore. For high-volume multi-user usage, use a real database.
- This migration copies data; it does not delete or modify the source Firestore records.
- The original `firestore.rules` and tests are retained as historical source files. The new API enforces verified Firebase identity and owner scoping on server-side reads/writes.
- Use a separate Google service account for Sheets access and restrict access to the spreadsheet itself.
