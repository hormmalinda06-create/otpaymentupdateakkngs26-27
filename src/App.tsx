import { useState } from 'react';
import {
  BookOpen,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { ClassesView } from './components/ClassesView';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ClassFormModal,
  ConfirmDeleteModal,
  PaymentFormModal,
  ReceiptModal,
  StudentFormModal,
} from './components/Modals';
import { OverviewView } from './components/OverviewView';
import { PaymentsView } from './components/PaymentsView';
import { SettingsView } from './components/SettingsView';
import { StudentDrawer } from './components/StudentDrawer';
import { StudentsView } from './components/StudentsView';
import { useLedgerData } from './hooks/useLedgerData';
import type { AppView, ClassGroup, Payment, Student } from './types';
import { formatKhmerMonth, getCurrentMonthKey, shiftMonthKey } from './utils/format';

const NAV_ITEMS: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'ទិដ្ឋភាពទូទៅ', icon: LayoutDashboard },
  { id: 'students', label: 'បញ្ជីសិស្ស', icon: Users },
  { id: 'classes', label: 'ថ្នាក់រៀនក្រៅម៉ោង', icon: BookOpen },
  { id: 'payments', label: 'ប្រវត្តិបង់ប្រាក់', icon: CreditCard },
  { id: 'settings', label: 'ការកំណត់', icon: Settings },
];

function LedgerWorkspace() {
  const {
    user,
    authReady,
    authError,
    profile,
    classes,
    students,
    payments,
    dataLoading,
    loginWithGoogle,
    logout,
    updateProfileSettings,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    toggleStudentStatus,
    deleteStudent,
    recordPayment,
    topUpPartialPayment,
    deletePayment,
    seedStarterData,
    migrateLegacyData,
  } = useLedgerData();

  const [activeView, setActiveView] = useState<AppView>('overview');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal & Drawer state
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | undefined>(undefined);
  const [partialPaymentTarget, setPartialPaymentTarget] = useState<Payment | null>(null);

  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'class' | 'student' | 'payment';
    id: string;
    title: string;
    message: string;
  } | null>(null);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">កំពុងដំណើរការប្រព័ន្ធ...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate onLogin={loginWithGoogle} authError={authError} />;
  }

  if (!user.emailVerified) {
    return (
      <AuthGate
        onLogin={loginWithGoogle}
        authError={authError}
        unverifiedEmail
        onLogout={logout}
      />
    );
  }

  const schoolName = profile?.schoolName || 'ថ្នាក់រៀនបំប៉នក្រៅម៉ោង';
  const defaultCurrency = profile?.defaultCurrency || 'USD';
  const currentNavLabel = NAV_ITEMS.find((n) => n.id === activeView)?.label || '';
  const drawerStudent = drawerStudentId
    ? students.find((s) => s.id === drawerStudentId) || null
    : null;

  const openRecordPayment = (student?: Student) => {
    setPartialPaymentTarget(null);
    setPreselectedStudentId(student?.id);
    setPaymentModalOpen(true);
  };

  const openTopUpPayment = (payment: Payment) => {
    setPartialPaymentTarget(payment);
    setPreselectedStudentId(payment.studentId);
    setPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 no-print">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center gap-2.5">
          <BookOpenCheck className="w-5 h-5 text-emerald-800 shrink-0" />
          <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap truncate">
            TutorPay Ledger
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-800' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {profile?.displayName || user.displayName || 'គ្រូបង្រៀន'}
            </p>
            <p className="text-xs text-slate-500 truncate">{schoolName}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ចាកចេញ</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/40 flex no-print">
          <div className="w-64 bg-white h-full border-r border-slate-200 flex flex-col">
            <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-emerald-800" />
                <span className="text-base font-bold text-slate-900">TutorPay Ledger</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center gap-3 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-800' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <button
                type="button"
                onClick={logout}
                className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ចាកចេញ</span>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="បើកម៉ឺនុយ"
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 truncate max-w-[180px]">
                {schoolName}
              </span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <h1 className="font-semibold text-slate-900 whitespace-nowrap truncate">
                {currentNavLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {(activeView === 'overview' || activeView === 'payments') && (
              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftMonthKey(m, -1))}
                  aria-label="ខែមុន"
                  className="p-2 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs font-medium text-slate-900 whitespace-nowrap tabular-nums">
                  {formatKhmerMonth(selectedMonth)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMonth((m) => shiftMonthKey(m, 1))}
                  aria-label="ខែបន្ទាប់"
                  className="p-2 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={students.length === 0}
              onClick={() => openRecordPayment()}
              className="px-3.5 py-2 flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">កត់ត្រាការបង់ប្រាក់</span>
              <span className="sm:hidden">បង់ប្រាក់</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
          {activeView === 'overview' && (
            <OverviewView
              selectedMonth={selectedMonth}
              classes={classes}
              students={students}
              payments={payments}
              loading={dataLoading}
              onOpenNewClass={() => {
                setEditingClass(null);
                setClassModalOpen(true);
              }}
              onOpenNewStudent={() => {
                if (classes.length === 0) {
                  setEditingClass(null);
                  setClassModalOpen(true);
                } else {
                  setEditingStudent(null);
                  setStudentModalOpen(true);
                }
              }}
              onRecordPaymentForStudent={(student) => openRecordPayment(student)}
              onTopUpPayment={(payment) => openTopUpPayment(payment)}
              onViewReceipt={(payment) => setReceiptPayment(payment)}
              onSelectStudent={(student) => setDrawerStudentId(student.id)}
              onSeedStarterData={seedStarterData}
            />
          )}

          {activeView === 'students' && (
            <StudentsView
              students={students}
              classes={classes}
              onAddStudent={() => {
                setEditingStudent(null);
                setStudentModalOpen(true);
              }}
              onEditStudent={(st) => {
                setEditingStudent(st);
                setStudentModalOpen(true);
              }}
              onToggleStatus={toggleStudentStatus}
              onDeleteStudent={(st) =>
                setDeleteTarget({
                  type: 'student',
                  id: st.id,
                  title: 'លុបព័ត៌មានសិស្ស',
                  message: `តើអ្នកពិតជាចង់លុបឈ្មោះសិស្ស "${st.fullName}" ចេញពីបញ្ជីមែនទេ?`,
                })
              }
              onRecordPayment={(st) => openRecordPayment(st)}
              onSelectStudent={(st) => setDrawerStudentId(st.id)}
            />
          )}

          {activeView === 'classes' && (
            <ClassesView
              classes={classes}
              students={students}
              onAddClass={() => {
                setEditingClass(null);
                setClassModalOpen(true);
              }}
              onEditClass={(cls) => {
                setEditingClass(cls);
                setClassModalOpen(true);
              }}
              onDeleteClass={(cls) =>
                setDeleteTarget({
                  type: 'class',
                  id: cls.id,
                  title: 'លុបថ្នាក់រៀន',
                  message: `តើអ្នកពិតជាចង់លុបថ្នាក់ "${cls.name}" មែនទេ?`,
                })
              }
            />
          )}

          {activeView === 'payments' && (
            <PaymentsView
              payments={payments}
              selectedMonth={selectedMonth}
              onViewReceipt={(p) => setReceiptPayment(p)}
              onTopUpPayment={(p) => openTopUpPayment(p)}
              onDeletePayment={(p) =>
                setDeleteTarget({
                  type: 'payment',
                  id: p.id,
                  title: 'លុបប្រតិបត្តិការបង់ប្រាក់',
                  message: `តើអ្នកពិតជាចង់លុបវិក្កយបត្រលេខ "${p.receiptNo}" មែនទេ?`,
                })
              }
              onNewPayment={() => openRecordPayment()}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView profile={profile} onSave={updateProfileSettings} onMigrate={migrateLegacyData} />
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      {classModalOpen && (
        <ClassFormModal
          initial={editingClass}
          defaultCurrency={defaultCurrency}
          onClose={() => {
            setClassModalOpen(false);
            setEditingClass(null);
          }}
          onSubmit={async (input) => {
            if (editingClass) {
              await updateClass(editingClass.id, input);
            } else {
              await addClass(input);
            }
          }}
        />
      )}

      {studentModalOpen && (
        <StudentFormModal
          initial={editingStudent}
          classes={classes}
          onClose={() => {
            setStudentModalOpen(false);
            setEditingStudent(null);
          }}
          onSubmit={async (input) => {
            if (editingStudent) {
              await updateStudent(editingStudent.id, input);
            } else {
              await addStudent(input);
            }
          }}
        />
      )}

      {paymentModalOpen && (
        <PaymentFormModal
          students={students}
          preselectedStudentId={preselectedStudentId}
          billingMonth={selectedMonth}
          existingPartialPayment={partialPaymentTarget}
          onClose={() => {
            setPaymentModalOpen(false);
            setPartialPaymentTarget(null);
            setPreselectedStudentId(undefined);
          }}
          onRecordPayment={recordPayment}
          onTopUpPayment={topUpPartialPayment}
          onSuccessReceipt={(created) => setReceiptPayment(created)}
        />
      )}

      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          schoolName={schoolName}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {drawerStudent && (
        <StudentDrawer
          student={drawerStudent}
          payments={payments}
          onClose={() => setDrawerStudentId(null)}
          onRecordPayment={(st) => {
            setDrawerStudentId(null);
            openRecordPayment(st);
          }}
          onEditStudent={(st) => {
            setDrawerStudentId(null);
            setEditingStudent(st);
            setStudentModalOpen(true);
          }}
          onViewReceipt={(p) => setReceiptPayment(p)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title={deleteTarget.title}
          message={deleteTarget.message}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (deleteTarget.type === 'class') await deleteClass(deleteTarget.id);
            if (deleteTarget.type === 'student') await deleteStudent(deleteTarget.id);
            if (deleteTarget.type === 'payment') await deletePayment(deleteTarget.id);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LedgerWorkspace />
    </ErrorBoundary>
  );
}
