import { LucideIcon } from 'lucide-react'
import { designSystem } from '@/lib/design-system'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
  onClick?: () => void
}

const colorConfig = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  purple: 'from-purple-500 to-pink-500',
  yellow: 'from-yellow-500 to-orange-500',
  red: 'from-red-500 to-rose-500'
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue', onClick }: StatsCardProps) {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 transform' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${colorConfig[color]} rounded-xl shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </Component>
  )
}
