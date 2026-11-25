import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { FIELD_LIMITS, type CurrencyCode, type UserProfile } from '../types';

interface SettingsViewProps {
  profile: UserProfile | null;
  onMigrate: () => Promise<Record<string, number>>;
  onSave: (updates: {
    displayName: string;
    schoolName: string;
    defaultCurrency: CurrencyCode;
  }) => Promise<void>;
}

export function SettingsView({ profile, onSave, onMigrate }: SettingsViewProps) {
  const [schoolName, setSchoolName] = useState(
    profile?.schoolName || 'ថ្នាក់រៀនបំប៉នក្រៅម៉ោង'
  );
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(
    profile?.defaultCurrency || 'USD'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setSchoolName(profile.schoolName);
      setDisplayName(profile.displayName);
      setDefaultCurrency(profile.defaultCurrency);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        schoolName: schoolName.trim() || 'ថ្នាក់រៀនបំប៉នក្រៅម៉ោង',
        displayName: displayName.trim() || 'គ្រូបង្រៀន',
        defaultCurrency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
      <h2 className="text-base font-semibold text-slate-900 mb-1">
        ការកំណត់សាលា និងគណនី
      </h2>
      <p className="text-xs text-slate-500 mb-6">
        ឈ្មោះសាលា ឬថ្នាក់រៀនបំប៉ននេះនឹងបង្ហាញនៅលើក្បាលវិក្កយបត្របង់ប្រាក់ជូនអាណាព្យាបាល។
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ឈ្មោះសាលា / ថ្នាក់រៀនបំប៉ន
          </label>
          <input
            type="text"
            required
            maxLength={FIELD_LIMITS.SCHOOL_NAME_MAX}
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            ឈ្មោះអ្នកគ្រប់គ្រង / លោកគ្រូអ្នកគ្រូ
          </label>
          <input
            type="text"
            required
            maxLength={FIELD_LIMITS.NAME_MAX}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            រូបិយប័ណ្ណលំនាំដើម (ពេលបង្កើតថ្នាក់ថ្មី)
          </label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          >
            <option value="USD">ដុល្លារ ($ USD)</option>
            <option value="KHR">រៀល (៛ KHR)</option>
          </select>
        </div>

        {profile?.email && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              អ៊ីមែលគណនី
            </label>
            <input
              type="text"
              disabled
              value={profile.email}
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 text-slate-500 border border-slate-200 rounded-lg"
            />
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="text-xs text-emerald-700 flex items-center gap-1.5">
            {saved && (
              <>
                <Check className="w-4 h-4" />
                <span>បានរក្សាទុកការកំណត់រួចរាល់</span>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកំណត់'}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">ផ្ទេរទិន្នន័យពី Firebase ទៅ Google Sheets</h3>
        <p className="text-xs text-slate-500 mt-1 mb-3">មុខងារនេះនឹងចម្លងទិន្នន័យចាស់របស់គណនីនេះទៅ Google Sheets។ ទិន្នន័យដែលមាន ID ដូចគ្នានៅ Sheets នឹងមិនត្រូវបានសរសេរជាន់ទេ។</p>
        <button type="button" disabled={migrating} onClick={async () => {
          if (!window.confirm('តើអ្នកប្រាកដថាចង់ផ្ទេរទិន្នន័យពី Firebase ទៅ Google Sheets មែនទេ?')) return;
          setMigrating(true); setMigrationMessage('');
          try { const counts = await onMigrate(); setMigrationMessage(`បានផ្ទេររួច៖ ថ្នាក់ ${counts.Classes || 0}, សិស្ស ${counts.Students || 0}, ការបង់ប្រាក់ ${counts.Payments || 0}, គណនី ${counts.Users || 0}`); }
          catch (e) { setMigrationMessage(e instanceof Error ? e.message : 'ការផ្ទេរទិន្នន័យបរាជ័យ'); }
          finally { setMigrating(false); }
        }} className="px-4 py-2 text-xs font-medium rounded-lg border border-emerald-700 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50">
          {migrating ? 'កំពុងផ្ទេរទិន្នន័យ...' : 'ចាប់ផ្តើមផ្ទេរទិន្នន័យ'}
        </button>
        {migrationMessage && <p className="text-xs mt-3 text-slate-700">{migrationMessage}</p>}
      </div>
    </div>
  );
}
