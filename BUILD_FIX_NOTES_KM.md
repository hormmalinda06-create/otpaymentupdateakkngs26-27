# TutorPay Ledger — Build Fix 2

ការកែសម្រួលពី Build Logs ដែលបានផ្ញើ៖

1. បន្ថែម TypeScript parameter types នៅក្នុង callbacks ក្នុង `api/ledger.ts` ដើម្បីដោះស្រាយ TS7006 (implicit any) ដែលបង្ហាញក្នុង Build Logs។
2. កែ `src/firebase.ts` ឱ្យហៅ `getFirestore(app)` នៅពេល `firestoreDatabaseId` មិនមាន ហើយហៅ `getFirestore(app, databaseId)` តែនៅពេលមាន ID។ នេះដោះស្រាយករណី TS2345 ដែលបង្ហាញក្នុង Logs។

## អនុវត្ត
- ជំនួសឯកសារ `api/ledger.ts` និង `src/firebase.ts` ក្នុង GitHub repository ដោយឯកសារពី ZIP នេះ។
- Commit និង Push ទៅ GitHub ដើម្បីឱ្យ Vercel Build ម្តងទៀត។
- រក្សា Environment Variables នៅ Vercel ដដែល។

ចំណាំ៖ ការកែសម្រួលនេះផ្អែកលើកំហុសដែលអាចអានបានក្នុងរូបភាព។ មិនទាន់អាចបញ្ជាក់ Build ជោគជ័យបានទេ ព្រោះ Build ពេញលេញមិនទាន់អាចដំណើរការផ្ទៀងផ្ទាត់ក្នុងបរិស្ថាននេះ។ ប្រសិនបើមានកំហុសថ្មី សូមផ្ញើ Build Logs ពេញលេញ។
