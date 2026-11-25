import { useMemo, useState } from 'react';
import { Download, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import type { Payment, PaymentMethod } from '../types';
import {
  exportPaymentsCsv,
  formatCurrency,
  formatKhmerMonth,
  formatPaymentMethod,
} from '../utils/format';

interface PaymentsViewProps {
  payments: Payment[];
  selectedMonth: string;
  onViewReceipt: (payment: Payment) => void;
  onTopUpPayment: (payment: Payment) => void;
  onDeletePayment: (payment: Payment) => void;
  onNewPayment: () => void;
}

export function PaymentsView({
  payments,
  selectedMonth,
  onViewReceipt,
  onTopUpPayment,
  onDeletePayment,
  onNewPayment,
}: PaymentsViewProps) {
  const [search, setSearch] = useState('');
  const [monthScope, setMonthScope] = useState<'selected' | 'all'>('selected');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (monthScope === 'selected' && p.billingMonth !== selectedMonth) return false;
      if (methodFilter !== 'all' && p.method !== methodFilter) return false;
      if (!q) return true;
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.receiptNo.toLowerCase().includes(q) ||
        p.className.toLowerCase().includes(q)
      );
    });
  }, [payments, monthScope, selectedMonth, methodFilter, search]);

  const totals = useMemo(() => {
    let usd = 0;
    let khr = 0;
    for (const p of filtered) {
      if (p.currency === 'KHR') khr += p.amountPaid;
      else usd += p.amountPaid;
    }
    return { usd, khr };
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setMonthScope('selected')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  monthScope === 'selected'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {formatKhmerMonth(selectedMonth)}
              </button>
              <button
                type="button"
                onClick={() => setMonthScope('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  monthScope === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ប្រវត្តិទាំងអស់
              </button>
            </div>

            <div className="relative w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ស្វែងរកសិស្ស ឬលេខវិក្កយបត្រ..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as 'all' | PaymentMethod)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            >
              <option value="all">គ្រប់វិធីបង់</option>
              <option value="khqr">ABA / KHQR</option>
              <option value="cash">សាច់ប្រាក់</option>
              <option value="transfer">ផ្ទេរប្រាក់</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() =>
                exportPaymentsCsv(filtered, monthScope === 'selected' ? selectedMonth : 'all')
              }
              className="px-3.5 py-2 flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយក CSV</span>
            </button>
            <button
              type="button"
              onClick={onNewPayment}
              className="px-4 py-2 flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>កត់ត្រាការបង់</span>
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            បង្ហាញ <strong className="font-mono tabular-nums text-slate-900">{filtered.length}</strong>{' '}
            ប្រតិបត្តិការ
          </span>
          <span className="font-mono tabular-nums">
            សរុប: <strong className="text-slate-900">{formatCurrency(totals.usd, 'USD')}</strong>
            {totals.khr > 0 ? ` · ${formatCurrency(totals.khr, 'KHR')}` : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-500">
              មិនមានប្រវត្តិការបង់ប្រាក់សម្រាប់តម្រងនេះនៅឡើយទេ។
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="py-3 px-6">លេខវិក្កយបត្រ</th>
                  <th className="py-3 px-4">ឈ្មោះសិស្ស</th>
                  <th className="py-3 px-4">ប្រចាំខែ</th>
                  <th className="py-3 px-4">វិធីបង់</th>
                  <th className="py-3 px-4">ថ្ងៃបង់</th>
                  <th className="py-3 px-4 text-right">ទឹកប្រាក់បានបង់</th>
                  <th className="py-3 px-4">ស្ថានភាព</th>
                  <th className="py-3 px-6 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/90 transition-colors">
                    <td className="py-3 px-6 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {p.receiptNo}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900 block">{p.studentName}</span>
                      <span className="text-xs text-slate-500">{p.className}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {formatKhmerMonth(p.billingMonth)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatPaymentMethod(p.method)}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                      {p.paidDate}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(p.amountPaid, p.currency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.paymentStatus === 'paid' ? (
                        <span className="text-xs font-medium text-emerald-700">បានបង់ពេញ</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onTopUpPayment(p)}
                          className="text-xs font-medium text-amber-700 hover:underline cursor-pointer"
                        >
                          បង់ខ្លះ (បង់បន្ថែម)
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(p)}
                          title="មើល និងបោះពុម្ពវិក្កយបត្រ"
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePayment(p)}
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
    </div>
  );
}
