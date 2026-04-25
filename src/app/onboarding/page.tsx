import Link from 'next/link'
import {
  MdAddCircle as AddCircleIcon,
  MdGroups as GroupsIcon,
  MdHelpOutline as HelpIcon,
  MdHub as HubIcon,
  MdLogout as LogoutIcon,
  MdVerifiedUser as VerifiedUserIcon,
  MdAccountBalanceWallet as WalletIcon,
} from 'react-icons/md'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const companyList = [
  {
    id: 1,
    name: 'Aura Labs',
    role: 'Owner',
    roleColor: 'bg-tertiary-fixed text-on-tertiary-fixed',
    employees: 124,
    wallet: '0x8F...4E2A',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATeDYJfRTWhulS5MFYP4Y_QMN7oFfIpTUzSKcxtyCdF7Sv50VxCz3ayNSg_qy4ROrxqx54JyiNyI2cT-kfPKokLSTu6rI6NamVrn8Wj3NWZVe-mhdACzK-gss2uGFiovh5C89RYEEu4f698j594h3GJ1upD6Jmx8LXST3NNCoqZPk_0H1XL-7iUWyc5yaiSnqRHOZn1L5I2731V605A6ELVS_9YG7zsUZ2q9_0yJffMBfaA9-0hPbQyKdjtVso7S3P_S0w0aIu_js',
  },
  {
    id: 2,
    name: 'Stark Bio',
    role: 'HR',
    roleColor: 'bg-primary-fixed text-on-primary-fixed',
    employees: 3420,
    wallet: '0x4D...1C88',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0kBOFGijFWaPK-fhex_u9EnVwIZUb2owEroYzlRrXL0F69FvpnecWvakXulOk-owu24_Ikd64h-eg4esd-OX9GxfW7sjlvWGfPhWhtzZhiTITRsOyeP0ilMvJempmSmfEEz7ff2t8CImPljXo-rUVxbwJidwZCxylmuhg4cLJGhO8_lgT5JIbx8O2T78zaju88Nt6Bfy-N7tw2Rz5xh_hKhnD9sqWGIYRnQt32d-2mWydtYpN7uB1_s3uTOJMc9XiVqPMFSL_MFk',
  },
  {
    id: 3,
    name: 'Nexus Protocol',
    role: 'Employee',
    roleColor: 'bg-surface-variant text-on-surface-variant',
    employees: 12,
    wallet: '0x2A...9B3F',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1Jw_-5_rfiPQYhZUCt12q7X-tg4IR1YiJsnev5hUsbaSDwoGL6xNELbwNk6CBeLB5H0ixf7b-Kktqa9RHy_UF_eoVjI2Z6dHmgLq6S0kd2eBfPPvIsXvK3z61wQj4dY9-Q1iYPlIKVjuUTwLuUJrffNW9x6nFp030ixPEKiIU8LgRfZBodmtaYGVfYKEVzMvY-v1OebIFLOTxUZYkFBp8YynqBkRwOrUIUshIKbDRe3DqXaVcRJzndhh33_Tf7MchnkqXwQCoRS4',
  },
]

export const metadata = {
  title: 'Salary Cipher | Company Selection',
  description: 'Select a sovereign vault to continue.',
}

export default function OnboardingPage() {
  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary/30 min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Left Identity */}
      <div className="fixed top-6 left-8 flex items-center gap-2 pointer-events-none opacity-40">
        <span className="font-heading font-black italic text-primary">Salary Cipher</span>
        <span className="text-[10px] font-mono text-outline uppercase tracking-widest">Sovereign Vault</span>
      </div>

      <main className="w-full max-w-2xl z-10">
        <div className="bg-surface-container shadow-[0_40px_80px_-20px_rgba(6,14,32,0.8)] rounded-lg overflow-hidden border-none">
          {/* Header Section */}
          <div className="p-8 pb-4 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-linear-to-br from-primary-container to-primary rounded-lg flex items-center justify-center shadow-lg">
                <HubIcon className="text-on-primary size-10" />
              </div>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-on-surface mb-2">Welcome to Salary Cipher</h1>
            <p className="text-on-surface-variant text-sm max-w-sm mx-auto">Select a sovereign vault to continue managing your cryptographic payroll and compliance.</p>
          </div>

          {/* Company List */}
          <div className="px-8 py-4 space-y-3">
            {companyList.map(company => (
              <div
                key={company.id}
                className="group flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container-high transition-all duration-300 rounded-lg cursor-pointer border border-transparent hover:border-white/5"
              >
                <Avatar className="w-12 h-12 rounded-lg border border-white/10">
                  <AvatarImage src={company.img} className="object-cover" />
                  <AvatarFallback className="bg-surface-container-highest text-primary font-bold">{company.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-semibold text-on-surface text-lg">{company.name}</span>
                    <Badge className={`${company.roleColor} border-none text-[10px] font-bold tracking-wider uppercase rounded-sm px-2 py-0.5`}>
                      {company.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium">
                    <span className="flex items-center gap-1">
                      <GroupsIcon className="size-3.5" /> {company.employees} Employees
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <WalletIcon className="size-3.5" /> {company.wallet}
                    </span>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button className="bg-primary/10 hover:bg-primary text-primary hover:text-on-primary px-5 py-2 text-sm font-bold rounded-lg transition-all duration-300 border-none">
                    Enter
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="p-8 pt-4">
            <div className="w-full h-px bg-white/5 mb-6" />
            <div className="flex flex-col items-center gap-4">
              <Link href="/onboarding/no-company" className="group flex items-center gap-2 text-on-surface-variant hover:text-primary font-bold transition-colors duration-200 text-sm">
                <AddCircleIcon className="size-5 group-hover:scale-110 transition-transform" />
                Create New Company
              </Link>
              <div className="flex items-center gap-6 mt-2">
                <button className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors font-bold uppercase tracking-widest">
                  <HelpIcon className="size-3.5" />
                  Support
                </button>
                <button className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 transition-colors font-bold uppercase tracking-widest">
                  <LogoutIcon className="size-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-8 flex justify-center items-center gap-3 opacity-60">
          <VerifiedUserIcon className="text-tertiary size-5" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-on-surface-variant">Secured by Zama Fully Homomorphic Encryption</span>
        </div>
      </main>
    </div>
  )
}
