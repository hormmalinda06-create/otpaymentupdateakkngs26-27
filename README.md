# TutorPay Ledger

TutorPay Ledger is the original React + TypeScript tuition-management interface, updated to use:

- **Frontend hosting:** Vercel
- **Authentication:** Firebase Authentication (Google sign-in; verified email required)
- **Database:** Google Sheets through a secure Vercel serverless API

See [`README_MIGRATION_KM.md`](./README_MIGRATION_KM.md) for the full Khmer setup, deployment, Google Sheets configuration, and one-time Firestore migration instructions.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Configure `FIREBASE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SERVICE_ACCOUNT_JSON`, and `GOOGLE_SHEETS_ID` as server-only environment variables in Vercel before deploying.
