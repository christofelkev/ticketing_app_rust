import React from 'react'
import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
      <Construction className="w-8 h-8 text-amber-500" />
    </div>
    <h1 className="page-title">{title}</h1>
    <p className="text-sm text-text-muted mt-2 max-w-sm">
      {description || 'Halaman ini sedang dalam pengembangan dan akan tersedia di versi berikutnya.'}
    </p>
  </div>
)
