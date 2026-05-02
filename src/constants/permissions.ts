import { RolesEnum } from '@/enums'

export const ALL_COMPANY_ROLES = [
  RolesEnum.Owner,
  RolesEnum.HR,
  RolesEnum.Employee,
] as const

export const OWNER_HR_ROLES = [
  RolesEnum.Owner,
  RolesEnum.HR,
] as const

export const OWNER_ONLY_ROLES = [
  RolesEnum.Owner,
] as const

export const ROUTE_ROLE_ACCESS = {
  '/overview': ALL_COMPANY_ROLES,
  '/dashboard': OWNER_HR_ROLES,
  '/employee': [RolesEnum.Employee],
  '/people': ALL_COMPANY_ROLES,
  '/payroll': ALL_COMPANY_ROLES,
  '/negotiate': ALL_COMPANY_ROLES,
  '/compliance': ALL_COMPANY_ROLES,
  '/finance': OWNER_ONLY_ROLES,
} as const satisfies Record<string, readonly RolesEnum[]>

export function hasRoleAccess(role: RolesEnum | undefined, allowedRoles: readonly RolesEnum[]) {
  return role !== undefined && allowedRoles.includes(role)
}

export function canAccessRoute(role: RolesEnum | undefined, pathname: string) {
  const allowedRoles = ROUTE_ROLE_ACCESS[pathname as keyof typeof ROUTE_ROLE_ACCESS]

  if (!allowedRoles) {
    return true
  }

  return hasRoleAccess(role, allowedRoles)
}

export function canManagePeople(role: RolesEnum | undefined) {
  return hasRoleAccess(role, OWNER_HR_ROLES)
}

export function canManagePayroll(role: RolesEnum | undefined) {
  return hasRoleAccess(role, OWNER_HR_ROLES)
}

export function canSubmitEmployerBudget(role: RolesEnum | undefined) {
  return hasRoleAccess(role, OWNER_ONLY_ROLES)
}

export function canSubmitExpectedSalary(role: RolesEnum | undefined) {
  return hasRoleAccess(role, [RolesEnum.HR, RolesEnum.Employee])
}

export function canRunCompanyAudit(role: RolesEnum | undefined) {
  return hasRoleAccess(role, OWNER_HR_ROLES)
}

export function canViewFinance(role: RolesEnum | undefined) {
  return hasRoleAccess(role, OWNER_ONLY_ROLES)
}
