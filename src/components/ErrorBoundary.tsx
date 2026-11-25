import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'មានបញ្ហាបច្ចេកទេសបានកើតឡើង។',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMessage = 'មានបញ្ហាក្នុងការដំណើរការប្រព័ន្ធ ឬការភ្ជាប់ទិន្នន័យ។ សូមព្យាយាមផ្ទុកទំព័រឡើងវិញ។';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error?.includes('Missing or insufficient permissions')) {
          friendlyMessage =
            'អ្នកមិនមានសិទ្ធិគ្រប់គ្រាន់សម្រាប់ប្រតិបត្តិការនេះទេ ឬគណនីរបស់អ្នកមិនទាន់ផ្ទៀងផ្ទាត់អ៊ីមែល។';
        }
      } catch {
        // Keep friendly fallback message
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              មានបញ្ហាក្នុងការដំណើរការ
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {friendlyMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
            >
              ផ្ទុកទំព័រឡើងវិញ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
