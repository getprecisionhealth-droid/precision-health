import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center items-start justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">{title}</h1>
        {description && <p className="text-sm text-text-tertiary mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">{actions}</div>}
    </div>
  )
}
