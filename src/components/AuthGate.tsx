import { BookOpenCheck, CreditCard, FileSpreadsheet, ShieldCheck } from 'lucide-react';

interface AuthGateProps {
  onLogin: () => Promise<void>;
  authError: string | null;
  unverifiedEmail?: boolean;
  onLogout?: () => Promise<void>;
}

export function AuthGate({ onLogin, authError, unverifiedEmail, onLogout }: AuthGateProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-6 py-12">
      <div className="max-w-4xl w-full mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left editorial panel */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 text-emerald-800 mb-6">
              <BookOpenCheck className="w-6 h-6 shrink-0" />
              <span className="text-base font-bold tracking-tight whitespace-nowrap">
                TutorPay Ledger
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug mb-4 [text-wrap:balance]">
              ប្រព័ន្ធគ្រប់គ្រងការបង់ប្រាក់សិស្សរៀនក្រៅម៉ោង
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
              តាមដានបញ្ជីសិស្ស ថ្នាក់រៀនបំប៉ន ការបង់ថ្លៃសិក្សាប្រចាំខែ និងចេញវិក្កយបត្រជូនអាណាព្យាបាលយ៉ាងមានរបៀបរៀបរយ។
            </p>
          </div>

          <div className="divide-y divide-slate-200 border-t border-slate-200">
            <div className="py-3.5 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  តាមដានការបង់ប្រាក់ប្រចាំខែ និងបង់ខ្លះ
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ស្គាល់ភ្លាមៗថាសិស្សណាបានបង់រួច មិនទាន់បង់ ឬហួសកំណត់ថ្ងៃបង់ប្រាក់
                </p>
              </div>
            </div>
            <div className="py-3.5 flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  វិក្កយបត្របោះពុម្ព និងទាញយក CSV
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  បោះពុម្ពវិក្កយបត្រ ឬចម្លងសារផ្ញើជូនអាណាព្យាបាលតាម Telegram
                </p>
              </div>
            </div>
            <div className="py-3.5 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  គាំទ្រប្រាក់ដុល្លារ ($) និងប្រាក់រៀល (៛)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  រក្សាទុកទិន្នន័យលើ Cloud សម្រាប់គណនីលោកគ្រូអ្នកគ្រូផ្ទាល់ខ្លួន
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right sign-in panel */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-slate-50/60 flex flex-col justify-center">
          {unverifiedEmail ? (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                អ៊ីមែលមិនទាន់បានផ្ទៀងផ្ទាត់
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                ដើម្បីសុវត្ថិភាពទិន្នន័យសិស្ស និងហិរញ្ញវត្ថុ សូមប្រើគណនី Google ដែលបានផ្ទៀងផ្ទាត់អ៊ីមែលរួចរាល់។
              </p>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ចាកចេញ និងសាកល្បងគណនីផ្សេង
                </button>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                ចូលប្រើប្រាស់ប្រព័ន្ធ
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                សូមភ្ជាប់ជាមួយគណនី Google របស់អ្នកដើម្បីចាប់ផ្តើមគ្រប់គ្រងបញ្ជីសិស្ស និងការបង់ប្រាក់។
              </p>

              {authError && (
                <div className="mb-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {authError}
                </div>
              )}

              <button
                type="button"
                onClick={onLogin}
                className="w-full py-3 px-4 flex items-center justify-center gap-3 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81"
                  />
                </svg>
                <span>ចូលប្រើដោយគណនី Google</span>
              </button>

              <p className="mt-4 text-xs text-slate-500 text-center">
                ទិន្នន័យថ្នាក់រៀន និងការបង់ប្រាក់របស់អ្នកត្រូវបានរក្សាទុកជាឯកជន
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
