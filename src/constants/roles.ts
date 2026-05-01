import { RolesEnum } from '@/enums'

export const ROLE_LABELS: Record<RolesEnum, string> = {
  [RolesEnum.None]: 'Unknown',
  [RolesEnum.Owner]: 'Owner',
  [RolesEnum.HR]: 'HR',
  [RolesEnum.Employee]: 'Employee',
} as const

export const ROLE_TONES: Record<RolesEnum, string> = {
  [RolesEnum.None]: '',
  [RolesEnum.Owner]: 'bg-tertiary-container/20 text-tertiary',
  [RolesEnum.HR]: 'bg-primary-container/20 text-primary',
  [RolesEnum.Employee]: 'bg-surface-variant text-on-surface-variant',
} as const
