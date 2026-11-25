import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider, legacyDb } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ledgerApi } from '../api';
import {
  FIELD_LIMITS, PATTERNS, type BillingCycle, type ClassGroup, type CurrencyCode,
  type Gender, type Payment, type PaymentMethod, type PaymentStatus, type Student,
  type StudentStatus, type UserProfile,
} from '../types';
import { clampText, generateReceiptNo, generateStudentCode, getCurrentMonthKey, getTodayDateString, shiftMonthKey } from '../utils/format';

export interface ClassInput { name: string; schedule: string; feeAmount: number; currency: CurrencyCode; billingCycle: BillingCycle; isActive: boolean; }
export interface StudentInput { fullName: string; gender: Gender; parentPhone: string; classId: string; monthlyFee: number; currency: CurrencyCode; dueDay: number; status: StudentStatus; notes: string; }
export interface PaymentInput { studentId: string; billingMonth: string; amountPaid: number; expectedAmount: number; method: PaymentMethod; paidDate: string; note: string; }
const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
const errText = (e: unknown) => e instanceof Error ? e.message : 'មានបញ្ហាក្នុងការភ្ជាប់ទិន្នន័យ';
const normalizeLegacy = (value: any): any => { if (value && typeof value.toDate === 'function') return value.toDate().toISOString(); if (Array.isArray(value)) return value.map(normalizeLegacy); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, normalizeLegacy(v)])); return value; };

export function useLedgerData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refresh = async () => {
    const data = await ledgerApi.bootstrap();
    setProfile(data.profile as UserProfile);
    setClasses((data.classes as ClassGroup[]).sort((a,b) => a.name.localeCompare(b.name)));
    setStudents((data.students as Student[]).sort((a,b) => a.fullName.localeCompare(b.fullName)));
    setPayments((data.payments as Payment[]).sort((a,b) => b.paidDate.localeCompare(a.paidDate)));
  };

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); if (!u) { setProfile(null); setClasses([]); setStudents([]); setPayments([]); setDataLoading(false); } }), []);
  useEffect(() => {
    if (!authReady || !user) return;
    if (!user.emailVerified) { setDataLoading(false); return; }
    let alive = true; setDataLoading(true);
    refresh().catch(e => { if (alive) setAuthError(errText(e)); }).finally(() => { if (alive) setDataLoading(false); });
    return () => { alive = false; };
  }, [authReady, user]);

  const loginWithGoogle = async () => { setAuthError(null); try { await signInWithPopup(auth, googleProvider); } catch (e) { const m = errText(e); if (!m.includes('popup-closed-by-user')) setAuthError('ការភ្ជាប់គណនី Google មានបញ្ហា។ សូមព្យាយាមម្តងទៀត។'); } };
  const logout = async () => signOut(auth);
  const updateProfileSettings = async (updates: { displayName: string; schoolName: string; defaultCurrency: CurrencyCode }) => {
    const result = await ledgerApi.profile({ displayName: clampText(updates.displayName, FIELD_LIMITS.NAME_MAX) || 'គ្រូបង្រៀន', schoolName: clampText(updates.schoolName, FIELD_LIMITS.SCHOOL_NAME_MAX) || 'ថ្នាក់រៀនបំប៉នក្រៅម៉ោង', defaultCurrency: updates.defaultCurrency });
    setProfile(result.data as UserProfile);
  };

  const addClass = async (input: ClassInput): Promise<string> => {
    const id = makeId(); const fee = Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0, Number(input.feeAmount) || 0));
    await ledgerApi.create('Classes', id, { ...input, name: clampText(input.name, FIELD_LIMITS.NAME_MAX), schedule: clampText(input.schedule, FIELD_LIMITS.SCHEDULE_MAX), feeAmount: fee, isActive: Boolean(input.isActive) });
    await refresh(); return id;
  };
  const updateClass = async (id: string, input: ClassInput) => { await ledgerApi.update('Classes', id, { ...input, name: clampText(input.name, FIELD_LIMITS.NAME_MAX), schedule: clampText(input.schedule, FIELD_LIMITS.SCHEDULE_MAX), feeAmount: Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0, Number(input.feeAmount) || 0)), isActive: Boolean(input.isActive) }); await refresh(); };
  const deleteClass = async (id: string) => { await ledgerApi.remove('Classes', id); await refresh(); };

  const addStudent = async (input: StudentInput): Promise<string> => {
    const cls = classes.find(c => c.id === input.classId); if (!cls) throw new Error('រកមិនឃើញថ្នាក់រៀនដែលបានជ្រើសរើសទេ');
    const id = makeId(); await ledgerApi.create('Students', id, { ...input, studentCode: generateStudentCode(), fullName: clampText(input.fullName, FIELD_LIMITS.NAME_MAX), parentPhone: clampText(input.parentPhone, FIELD_LIMITS.PHONE_MAX), classId: cls.id, className: cls.name, monthlyFee: Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0, Number(input.monthlyFee) || 0)), dueDay: Math.min(31, Math.max(1, Math.round(Number(input.dueDay) || 5))), notes: clampText(input.notes, FIELD_LIMITS.STUDENT_NOTES_MAX) });
    await refresh(); return id;
  };
  const updateStudent = async (id: string, input: StudentInput) => {
    const cls = classes.find(c => c.id === input.classId); if (!cls) throw new Error('រកមិនឃើញថ្នាក់រៀនដែលបានជ្រើសរើសទេ');
    await ledgerApi.update('Students', id, { ...input, fullName: clampText(input.fullName, FIELD_LIMITS.NAME_MAX), parentPhone: clampText(input.parentPhone, FIELD_LIMITS.PHONE_MAX), classId: cls.id, className: cls.name, monthlyFee: Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0, Number(input.monthlyFee) || 0)), dueDay: Math.min(31, Math.max(1, Math.round(Number(input.dueDay) || 5))), notes: clampText(input.notes, FIELD_LIMITS.STUDENT_NOTES_MAX) }); await refresh();
  };
  const toggleStudentStatus = async (student: Student) => { await ledgerApi.update('Students', student.id, { ...student, status: student.status === 'active' ? 'paused' : 'active' }); await refresh(); };
  const deleteStudent = async (id: string) => { await ledgerApi.remove('Students', id); await refresh(); };

  const recordPayment = async (input: PaymentInput): Promise<Payment> => {
    const student = students.find(s => s.id === input.studentId); if (!student) throw new Error('រកមិនឃើញព័ត៌មានសិស្សទេ');
    const billingMonth = PATTERNS.BILLING_MONTH.test(input.billingMonth) ? input.billingMonth : getCurrentMonthKey();
    const paidDate = PATTERNS.PAID_DATE.test(input.paidDate) ? input.paidDate : getTodayDateString();
    const expectedAmount = Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0, Number(input.expectedAmount) || student.monthlyFee));
    const amountPaid = Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0.01, Number(input.amountPaid) || 0));
    const id = makeId(); const payload = { receiptNo: generateReceiptNo(billingMonth), studentId: student.id, studentName: student.fullName, classId: student.classId, className: student.className, billingMonth, amountPaid, expectedAmount, currency: student.currency, method: input.method, paymentStatus: (amountPaid >= expectedAmount ? 'paid' : 'partial') as PaymentStatus, paidDate, note: clampText(input.note, FIELD_LIMITS.PAYMENT_NOTE_MAX) };
    const result = await ledgerApi.create('Payments', id, payload); await refresh(); return result.data as Payment;
  };
  const topUpPartialPayment = async (payment: Payment, additionalAmount: number, method: PaymentMethod, paidDate: string, note: string) => {
    if (payment.paymentStatus !== 'partial') return;
    const amountPaid = Math.min(FIELD_LIMITS.AMOUNT_MAX, Math.max(0.01, payment.amountPaid + additionalAmount));
    await ledgerApi.update('Payments', payment.id, { ...payment, amountPaid, paymentStatus: amountPaid >= payment.expectedAmount ? 'paid' : 'partial', method, paidDate: PATTERNS.PAID_DATE.test(paidDate) ? paidDate : getTodayDateString(), note: clampText(note, FIELD_LIMITS.PAYMENT_NOTE_MAX) }); await refresh();
  };
  const deletePayment = async (id: string) => { await ledgerApi.remove('Payments', id); await refresh(); };

  const migrateLegacyData = async () => {
    if (!user) throw new Error('សូមចូលគណនីជាមុនសិន');
    const [profileSnap, classSnap, studentSnap, paymentSnap] = await Promise.all([
      getDoc(doc(legacyDb, 'users', user.uid)),
      getDocs(query(collection(legacyDb, 'classes'), where('ownerId', '==', user.uid))),
      getDocs(query(collection(legacyDb, 'students'), where('ownerId', '==', user.uid))),
      getDocs(query(collection(legacyDb, 'payments'), where('ownerId', '==', user.uid))),
    ]);
    const toItems = (snap: any) => snap.docs.map((d: any) => ({ id: d.id, ...normalizeLegacy(d.data()) }));
    const oldProfile = profileSnap.exists() ? [{ id: user.uid, ...normalizeLegacy(profileSnap.data()) }] : [];
    const result = await ledgerApi.bulkImport({ Users: oldProfile, Classes: toItems(classSnap), Students: toItems(studentSnap), Payments: toItems(paymentSnap) });
    await refresh();
    return result.imported;
  };

  const seedStarterData = async () => {
    const currentMonth = getCurrentMonthKey(); const prevMonth = shiftMonthKey(currentMonth, -1); const today = getTodayDateString();
    const specs: ClassInput[] = [
      { name: 'គណិតវិទ្យា ថ្នាក់ទី១២', schedule: 'ចន្ទ - សុក្រ · ៥:៣០ - ៦:៣០ ល្ងាច', feeAmount: 25, currency: 'USD', billingCycle: 'monthly', isActive: true },
      { name: 'ភាសាអង់គ្លេស កម្រិតមធ្យម', schedule: 'ចន្ទ - ពុធ - សុក្រ · ៦:៣០ - ៧:៣០ ល្ងាច', feeAmount: 80000, currency: 'KHR', billingCycle: 'monthly', isActive: true },
      { name: 'រូបវិទ្យា ត្រៀមប្រឡងបាក់ឌុប', schedule: 'សៅរ៍ - អាទិត្យ · ៨:០០ - ១០:០០ ព្រឹក', feeAmount: 20, currency: 'USD', billingCycle: 'monthly', isActive: true },
    ];
    const classIds: string[] = [];
    for (const c of specs) { const id = makeId(); await ledgerApi.create('Classes', id, c); classIds.push(id); }
    const templates = [
      { fullName: 'សុខ ចាន់ដារ៉ា', gender: 'male' as Gender, phone: '012 458 920', ci: 0, dueDay: 5 },
      { fullName: 'លី ស្រីនាង', gender: 'female' as Gender, phone: '096 774 210', ci: 0, dueDay: 5 },
      { fullName: 'ជា បញ្ញា', gender: 'male' as Gender, phone: '077 823 119', ci: 0, dueDay: 10 },
      { fullName: 'ហេង ម៉ាលីស', gender: 'female' as Gender, phone: '015 339 402', ci: 1, dueDay: 5 },
      { fullName: 'វណ្ណ សុវណ្ណារ៉ា', gender: 'male' as Gender, phone: '089 612 780', ci: 1, dueDay: 12 },
      { fullName: 'កែវ រស្មី', gender: 'female' as Gender, phone: '010 519 884', ci: 2, dueDay: 8 },
    ];
    const studentIds: string[] = [];
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i]; const c = specs[t.ci]; const id = makeId();
      await ledgerApi.create('Students', id, { studentCode: `STU-10${i + 1}`, fullName: t.fullName, gender: t.gender, parentPhone: t.phone, classId: classIds[t.ci], className: c.name, monthlyFee: c.feeAmount, currency: c.currency, dueDay: t.dueDay, status: 'active', notes: '' });
      studentIds.push(id);
    }
    const entries = [{ i: 0, m: currentMonth, a: 25, method: 'khqr' as PaymentMethod }, { i: 1, m: currentMonth, a: 15, method: 'cash' as PaymentMethod }, { i: 3, m: currentMonth, a: 80000, method: 'khqr' as PaymentMethod }, { i: 0, m: prevMonth, a: 25, method: 'cash' as PaymentMethod }];
    for (let i = 0; i < entries.length; i++) {
      const p = entries[i]; const t = templates[p.i]; const c = specs[t.ci];
      await ledgerApi.create('Payments', makeId(), { receiptNo: `REC-${p.m.replace('-', '')}-10${i + 1}`, studentId: studentIds[p.i], studentName: t.fullName, classId: classIds[t.ci], className: c.name, billingMonth: p.m, amountPaid: p.a, expectedAmount: c.feeAmount, currency: c.currency, method: p.method, paymentStatus: p.a >= c.feeAmount ? 'paid' : 'partial', paidDate: today, note: p.a < c.feeAmount ? 'សិស្សបង់កក់មុនពាក់កណ្ដាល' : '' });
    }
    await refresh();
  };

  return { user, authReady, authError, profile, classes, students, payments, dataLoading, loginWithGoogle, logout, updateProfileSettings, addClass, updateClass, deleteClass, addStudent, updateStudent, toggleStudentStatus, deleteStudent, recordPayment, topUpPartialPayment, deletePayment, seedStarterData, migrateLegacyData };
}
