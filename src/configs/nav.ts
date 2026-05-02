import {
  MdAccountBalance,
  MdDashboard,
  MdGavel,
  MdGroups,
  MdHandshake,
  MdHelpOutline,
  MdPayments,
  MdSettings,
} from 'react-icons/md'
import { ALL_COMPANY_ROLES, OWNER_ONLY_ROLES } from '@/constants'

export const sidebarMainNavItems = [
  { title: 'Overview', href: '/overview', icon: MdDashboard, roles: ALL_COMPANY_ROLES },
  { title: 'People', href: '/people', icon: MdGroups, roles: ALL_COMPANY_ROLES },
  { title: 'Payroll', href: '/payroll', icon: MdPayments, roles: ALL_COMPANY_ROLES },
  { title: 'Negotiate', href: '/negotiate', icon: MdHandshake, roles: ALL_COMPANY_ROLES },
  { title: 'Compliance', href: '/compliance', icon: MdGavel, roles: ALL_COMPANY_ROLES },
  { title: 'Finance', href: '/finance', icon: MdAccountBalance, roles: OWNER_ONLY_ROLES },
  // { title: 'Settings', href: '/settings', icon: SettingsIcon },
]

export const sidebarSecondaryNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: MdSettings,
  },
  {
    title: 'Support',
    href: '/support',
    icon: MdHelpOutline,
  },
]

export const topNavItems = [
  { title: 'Overview', href: '#overview' },
  { title: 'Features', href: '#features' },
  { title: 'Security', href: '#security' },
  // { title: 'Docs', href: '#' },
]
