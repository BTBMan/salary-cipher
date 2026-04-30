import {
  MdAccountBalance,
  MdDashboard,
  MdGavel,
  MdGroups,
  MdHelpOutline,
  MdPayments,
  MdSettings,
} from 'react-icons/md'

export const sidebarMainNavItems = [
  { title: 'Overview', href: '/dashboard', icon: MdDashboard },
  { title: 'People', href: '/people', icon: MdGroups },
  { title: 'Payroll', href: '/payroll', icon: MdPayments },
  { title: 'Negotiate', href: '/negotiate', icon: MdGavel },
  { title: 'Compliance', href: '/compliance', icon: MdGavel },
  { title: 'Finance', href: '/finance', icon: MdAccountBalance },
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
