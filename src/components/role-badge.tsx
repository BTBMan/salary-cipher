import type { RolesEnum } from '@/enums'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, ROLE_TONES } from '@/constants'
import { cn } from '@/utils'

interface RoleBadgeProps {
  className?: string
  role: RolesEnum
}

export function RoleBadge({ className, role }: RoleBadgeProps) {
  return (
    <Badge className={cn(ROLE_TONES[role], 'border-none uppercase', className)}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}
