import {
  HelpCircle,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'

export const navItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'People',
    href: '/people',
    icon: Users,
  },
  {
    title: 'Finance & Vault',
    href: '/finance',
    icon: Wallet,
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: ShieldCheck,
  },
  {
    title: 'Payroll History',
    href: '/history',
    icon: History,
  },
  {
    title: 'Employee',
    href: '/employee',
    icon: History,
  },
]

export const secondaryNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Support',
    href: '/support',
    icon: HelpCircle,
  },
]
