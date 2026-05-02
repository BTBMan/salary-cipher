import { RolesEnum } from '@/enums'

export type CompanyRole = RolesEnum
export type AssignableCompanyRole = RolesEnum.HR | RolesEnum.Employee

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

export const ASSIGNABLE_COMPANY_ROLE_OPTIONS = [
  {
    label: ROLE_LABELS[RolesEnum.HR],
    value: RolesEnum.HR,
  },
  {
    label: ROLE_LABELS[RolesEnum.Employee],
    value: RolesEnum.Employee,
  },
] as const satisfies ReadonlyArray<{
  label: string
  value: AssignableCompanyRole
}>
