import { useMemo, useState } from 'react';
import { CreditCard, PauseCircle, Pencil, PlayCircle, Plus, Search, Trash2 } from 'lucide-react';
import type { ClassGroup, Student } from '../types';
import { formatCurrency } from '../utils/format';

interface StudentsViewProps {
  students: Student[];
  classes: ClassGroup[];
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onToggleStatus: (student: Student) => Promise<void>;
  onDeleteStudent: (student: Student) => void;
  onRecordPayment: (student: Student) => void;
  onSelectStudent: (student: Student) => void;
}

export function StudentsView({
  students,
  classes,
  onAddStudent,
  onEditStudent,
  onToggleStatus,
  onDeleteStudent,
  onRecordPayment,
  onSelectStudent,
}: StudentsViewProps) {
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== 'all' && s.classId !== classFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.parentPhone.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter, statusFilter]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកឈ្មោះ លេខកូដ ឬទូរស័ព្ទ..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          >
            <option value="all">គ្រប់ថ្នាក់រៀន</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                ['all', 'ទាំងអស់'],
                ['active', 'កំពុងរៀន'],
                ['paused', 'ផ្អាករៀន'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatusFilter(k)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === k
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onAddStudent}
          disabled={classes.length === 0}
          className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>ចុះឈ្មោះសិស្សថ្មី</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-slate-600 mb-4">
            {students.length === 0
              ? 'មិនទាន់មានសិស្សនៅក្នុងបញ្ជីនៅឡើយទេ។'
              : 'មិនមានសិស្សត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ។'}
          </p>
          {students.length === 0 && classes.length > 0 && (
            <button
              type="button"
              onClick={onAddStudent}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
            >
              បន្ថែមសិស្សដំបូង
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                <th className="py-3 px-6">លេខកូដ</th>
                <th className="py-3 px-4">ឈ្មោះសិស្ស</th>
                <th className="py-3 px-4">ទូរស័ព្ទអាណាព្យាបាល</th>
                <th className="py-3 px-4">ថ្នាក់រៀន</th>
                <th className="py-3 px-4 text-right">ថ្លៃសិក្សា</th>
                <th className="py-3 px-4 text-right">ថ្ងៃត្រូវបង់</th>
                <th className="py-3 px-4">ស្ថានភាព</th>
                <th className="py-3 px-6 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="py-3 px-6 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {s.studentCode}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectStudent(s)}
                      className="font-medium text-slate-900 hover:text-emerald-800 hover:underline text-left cursor-pointer"
                    >
                      {s.fullName}
                    </button>
                    <span className="text-xs text-slate-400 ml-2">
                      {s.gender === 'male' ? 'ប្រុស' : 'ស្រី'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                    {s.parentPhone || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700">{s.className}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                    {formatCurrency(s.monthlyFee, s.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                    ទី {String(s.dueDay).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${
                        s.status === 'active' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {s.status === 'active' ? 'កំពុងរៀន' : 'ផ្អាករៀន'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onRecordPayment(s)}
                        title="កត់ត្រាបង់ប្រាក់"
                        className="p-1.5 text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditStudent(s)}
                        title="កែប្រែ"
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void onToggleStatus(s)}
                        title={s.status === 'active' ? 'ប្តូរទៅផ្អាករៀន' : 'បើករៀនវិញ'}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        {s.status === 'active' ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteStudent(s)}
                        title="លុប"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
