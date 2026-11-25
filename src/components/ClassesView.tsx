import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { ClassGroup, Student } from '../types';
import { formatCurrency } from '../utils/format';

interface ClassesViewProps {
  classes: ClassGroup[];
  students: Student[];
  onAddClass: () => void;
  onEditClass: (cls: ClassGroup) => void;
  onDeleteClass: (cls: ClassGroup) => void;
}

export function ClassesView({
  classes,
  students,
  onAddClass,
  onEditClass,
  onDeleteClass,
}: ClassesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            បញ្ជីថ្នាក់រៀនក្រៅម៉ោង ({classes.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            កំណត់កាលវិភាគ និងតម្លៃសិក្សាស្ដង់ដារសម្រាប់មុខវិជ្ជានីមួយៗ
          </p>
        </div>
        <button
          type="button"
          onClick={onAddClass}
          className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមថ្នាក់រៀន</span>
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-600 mb-4">មិនទាន់មានថ្នាក់រៀននៅឡើយទេ។</p>
          <button
            type="button"
            onClick={onAddClass}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
          >
            បង្កើតថ្នាក់រៀនដំបូង
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-6">ឈ្មោះថ្នាក់ / មុខវិជ្ជា</th>
                  <th className="py-3 px-4">កាលវិភាគសិក្សា</th>
                  <th className="py-3 px-4 text-right">ចំនួនសិស្ស</th>
                  <th className="py-3 px-4 text-right">តម្លៃសិក្សា</th>
                  <th className="py-3 px-4">ស្ថានភាព</th>
                  <th className="py-3 px-6 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {classes.map((cls) => {
                  const enrolledCount = students.filter(
                    (s) => s.classId === cls.id && s.status === 'active'
                  ).length;

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {cls.name}
                        <span className="block text-xs font-normal text-slate-500 mt-0.5">
                          {cls.billingCycle === 'monthly' ? 'គិតថ្លៃប្រចាំខែ' : 'គិតថ្លៃតាមវគ្គ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{cls.schedule}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {enrolledCount} នាក់
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(cls.feeAmount, cls.currency)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium ${
                            cls.isActive ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {cls.isActive ? 'កំពុងបើកបង្រៀន' : 'បិទបណ្ដោះអាសន្ន'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditClass(cls)}
                            title="កែប្រែ"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteClass(cls)}
                            title="លុប"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
