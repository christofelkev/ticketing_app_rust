import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../lib/utils'

const toastConfig = {
  success: { icon: CheckCircle, bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', icon_color: 'text-emerald-500' },
  error: { icon: XCircle, bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon_color: 'text-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', icon_color: 'text-amber-500' },
  info: { icon: Info, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon_color: 'text-blue-500' },
}

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map(toast => {
        const config = toastConfig[toast.type]
        const Icon = config.icon

        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm animate-slide-in-right',
              config.bg
            )}
          >
            <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.icon_color)} />
            <p className={cn('text-sm font-medium flex-1', config.text)}>{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              className={cn('flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors', config.text)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
