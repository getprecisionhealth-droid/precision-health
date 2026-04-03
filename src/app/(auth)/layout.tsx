import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between p-12 bg-surface-alt border-r border-border-subtle relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="text-text-primary font-semibold text-lg tracking-tight">Precision Health</span>
          </div>
        </div>
        <div className="relative space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary leading-tight">
              Your clients deserve<br />data-driven coaching.
            </h1>
            <p className="mt-3 text-text-tertiary text-base leading-relaxed">
              Track every metric, every session, every milestone — all in one platform built for serious trainers.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { stat: '100%', label: 'Client visibility at a glance' },
              { stat: 'Real-time', label: 'Health trend analysis & charts' },
              { stat: 'Built-in', label: 'Workout plan builder & assignment' },
            ].map(({ stat, label }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-1 h-8 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-text-primary text-sm font-semibold">{stat}</p>
                  <p className="text-text-muted text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <p className="text-text-faint text-xs">© 2025 Precision Health. Built for coaches.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="text-text-primary font-semibold">Precision Health</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
