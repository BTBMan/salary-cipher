import {
  MdAccountBalanceWallet as AccountBalanceWalletIcon,
  MdDashboard as DashboardIcon,
  MdGroups as GroupsIcon,
  MdHelpOutline as HelpIcon,
  MdHistory as HistoryIcon,
  MdSecurity as SecurityIcon,
  MdSettings as SettingsIcon,
} from 'react-icons/md'

export const navItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: DashboardIcon,
  },
  {
    title: 'People',
    href: '/people',
    icon: GroupsIcon,
  },
  {
    title: 'Finance & Vault',
    href: '/finance',
    icon: AccountBalanceWalletIcon,
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: SecurityIcon,
  },
  {
    title: 'Payroll History',
    href: '/history',
    icon: HistoryIcon,
  },
  {
    title: 'Employee',
    href: '/employee',
    icon: HistoryIcon,
  },
]

export const secondaryNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
  {
    title: 'Support',
    href: '/support',
    icon: HelpIcon,
  },
]
