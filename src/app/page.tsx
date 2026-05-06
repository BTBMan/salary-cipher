import type { Metadata } from 'next'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa'
import {
  MdAccountBalance as AccountBalanceIcon,
  MdArrowForward as ArrowForwardIcon,
  MdAutoGraph as AutoGraphIcon,
  MdCheckCircle as CheckCircleIcon,
  MdGavel as GavelIcon,
  MdGroups as GroupsIcon,
  MdHandshake as HandshakeIcon,
  MdLock as LockIcon,
  MdOpenInNew,
  MdPayments as PaymentsIcon,
  MdShield as ShieldIcon,
  MdVerified as VerifiedIcon,
  MdWorkspacePremium as WorkspacePremiumIcon,
} from 'react-icons/md'
import { LaunchApp } from '@/components/landing-page/launch-app'
import { AppTopNavbar } from '@/components/layout/app-top-navbar'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Salary Cipher | Encrypted Payroll for Real Companies',
  description: 'A multi-company payroll platform for encrypted salary payments, confidential negotiation, compliance audit, and RWA salary proofs powered by Zama FHE.',
}

const productStats = [
  { label: 'Settlement assets', value: 'USDC / USDT' },
  { label: 'Company model', value: 'Multi-tenant' },
  { label: 'Sensitive values', value: 'FHE encrypted' },
]

const featureCards = [
  {
    icon: AccountBalanceIcon,
    title: 'Company vaults',
    description: 'Each company gets an isolated treasury vault, chooses USDC or USDT, deposits public tokens, and wraps them into confidential settlement assets.',
  },
  {
    icon: PaymentsIcon,
    title: 'Encrypted payroll',
    description: 'Monthly salary, payroll amount, employee balance, and payroll history are handled as encrypted values instead of public token transfers.',
  },
  {
    icon: HandshakeIcon,
    title: 'Private salary negotiation',
    description: 'Owner and employee can submit encrypted offers and asks. The contract checks the match without exposing either side\'s number.',
  },
  {
    icon: GavelIcon,
    title: 'Salary fairness audit',
    description: 'Owner and HR can run company-level compliance checks and decrypt only the audit result, not every employee\'s salary.',
  },
  {
    icon: WorkspacePremiumIcon,
    title: 'RWA salary proofs',
    description: 'Employees can generate privacy-preserving income proofs and mint them as NFT credentials without revealing their exact salary.',
  },
  {
    icon: GroupsIcon,
    title: 'Role-based workspace',
    description: 'Owner, HR, and Employee see different menus, actions, and encrypted fields based on their role in the selected company.',
  },
]

const workflowSteps = [
  {
    title: 'Create company',
    description: 'Owner creates a company, sets the monthly payday, and selects USDC or USDT as the payroll asset.',
  },
  {
    title: 'Fund vault',
    description: 'The company deposits the selected token and wraps it into cUSDC or cUSDT inside its own treasury vault.',
  },
  {
    title: 'Add employees',
    description: 'HR or Owner adds employees, encrypts their monthly salary, and keeps account and payout wallet as separate fields.',
  },
  {
    title: 'Execute payroll',
    description: 'Payroll transfers confidential tokens to employee payout wallets while salary records remain encrypted on-chain.',
  },
]

const securityPoints = [
  'Salary amounts are encrypted before they are stored or processed.',
  'Payroll transfer amounts are represented by encrypted handles.',
  'Only authorized users can request decryption for the data they are allowed to see.',
  'Salary proofs can be shared as verifiable credentials without exposing raw income.',
]

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex flex-col min-h-screen">
      <AppTopNavbar />

      <main id="product" className="relative min-h-screen overflow-hidden px-6 pt-36 pb-24">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(192, 193, 255, 0.08) 1px, transparent 0)',
            backgroundSize: '42px 42px',
          }}
        />
        <div className="absolute left-1/2 top-20 h-96 w-180 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute -left-32 bottom-20 h-80 w-80 rounded-full bg-tertiary/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/5 bg-surface-container-low px-3 py-1">
              <span className="flex h-2 w-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(221,183,255,0.6)]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Zama FHE payroll protocol</span>
            </div>

            <h1 className="mb-6 max-w-4xl font-heading text-5xl font-extrabold leading-[1.06] tracking-tight text-on-surface md:text-7xl">
              Private payroll for companies that pay on-chain.
            </h1>

            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
              Salary Cipher lets companies manage employees, fund isolated vaults, execute encrypted payroll, negotiate salary changes, run fairness audits, and issue privacy-preserving salary proof NFTs.
            </p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-center">
              <LaunchApp />
              <Link
                href="#workflow"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-sm border border-white/10 bg-surface-container-low px-7 text-sm font-bold text-on-surface transition-colors hover:border-primary/30 hover:bg-surface-container"
              >
                See workflow
                <ArrowForwardIcon className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {productStats.map(item => (
                <div key={item.label} className="rounded-xl border border-white/5 bg-surface-container-low/70 p-4 backdrop-blur">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-outline">{item.label}</p>
                  <p className="mt-2 font-heading text-base font-black text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-linear-to-r from-primary/20 to-tertiary/20 opacity-40 blur-2xl" />
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-container-lowest shadow-2xl">
              <div className="border-b border-white/5 bg-surface-container-low px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Company vault</p>
                    <h2 className="mt-1 font-heading text-xl font-black">Encrypted payroll console</h2>
                  </div>
                  <div className="rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-tertiary">Live</div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container-low p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-outline">Wrapped balance</p>
                    <div className="mt-4 h-8 rounded-sm bg-linear-to-r from-primary/30 via-primary/10 to-transparent encrypted-shadow" />
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-4">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-outline">Next payday</p>
                    <p className="mt-3 font-heading text-2xl font-black text-on-surface">15th</p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/5 bg-surface-container-low p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <LockIcon className="size-5" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-black text-on-surface">Payroll batch</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-outline">Encrypted transfer handles</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase text-primary">Ready</span>
                  </div>

                  <div className="space-y-3">
                    {['0x7c5B...3639', '0x4E7B...4491', '0x9b5C...dFfF'].map((wallet, index) => (
                      <div key={wallet} className="flex items-center justify-between rounded-sm bg-surface-container-lowest px-3 py-3">
                        <div>
                          <p className="font-mono text-xs font-bold text-on-surface">{wallet}</p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
                            {index === 0 ? 'Employee' : index === 1 ? 'HR' : 'Payout wallet'}
                          </p>
                        </div>
                        <div className="h-4 w-28 rounded-sm bg-linear-to-r from-tertiary/40 to-primary/20 blur-[1px]" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['Audit', 'Proof', 'Withdraw'].map(item => (
                    <div key={item} className="rounded-lg border border-white/5 bg-surface-container-low p-3 text-center">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section id="features" className="relative z-10 bg-surface px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Product surface</p>
            <h2 className="font-heading text-3xl font-black tracking-tight text-on-surface md:text-5xl">Built around the real payroll lifecycle.</h2>
            <p className="mt-5 text-base leading-relaxed text-on-surface-variant md:text-lg">
              The current product covers company creation, employee management, encrypted salary storage, vault funding, payroll execution, negotiation, compliance audit, and employee-owned salary proofs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon

              return (
                <div key={feature.title} className="group rounded-xl border border-white/5 bg-surface-container-low p-7 transition-all duration-500 hover:border-primary/30 hover:bg-surface-container">
                  <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mb-3 font-heading text-xl font-black text-on-surface">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative overflow-hidden bg-surface-container-lowest px-6 py-24">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 rounded-full bg-primary/10 blur-[100px]" />
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative z-10">
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">Execution flow</p>
            <h2 className="font-heading text-3xl font-black tracking-tight text-on-surface md:text-5xl">From company setup to encrypted salary delivery.</h2>
            <p className="mt-5 text-base leading-relaxed text-on-surface-variant md:text-lg">
              Salary Cipher keeps the operational flow familiar for HR and finance teams while replacing public salary transfers with confidential token movement.
            </p>
          </div>

          <div className="relative z-10 grid gap-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="grid gap-4 rounded-xl border border-white/5 bg-surface-container-low p-5 sm:grid-cols-[auto_1fr]">
                <div className="flex size-12 items-center justify-center rounded-lg bg-surface-container-lowest font-mono text-sm font-black text-primary">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-black text-on-surface">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="bg-surface px-6 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Privacy model</p>
            <h2 className="font-heading text-3xl font-black tracking-tight text-on-surface md:text-5xl">FHE keeps payroll useful without making it public.</h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-on-surface-variant md:text-lg">
              The platform uses Zama FHE to let contracts process encrypted payroll data. Companies can run payroll and audits, employees can prove income, and sensitive salary values stay hidden unless an authorized user explicitly decrypts them.
            </p>

            <ul className="mt-8 space-y-4">
              {securityPoints.map(text => (
                <li key={text} className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-0.5 size-5 text-primary" />
                  <span className="text-sm font-medium leading-relaxed text-on-surface">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-xl border border-white/10 bg-surface-container-low p-6 shadow-xl">
            <div className="absolute -right-6 -top-6 size-32 rounded-full bg-tertiary/10 blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldIcon className="size-6" />
                </div>
                <div>
                  <p className="font-heading text-sm font-black text-on-surface">Encrypted by default</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">Salary, audit result, proof result, balance.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-tertiary/10 text-tertiary">
                  <VerifiedIcon className="size-6" />
                </div>
                <div>
                  <p className="font-heading text-sm font-black text-on-surface">Authorized decryption</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">Users only decrypt records allowed by their company role.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-surface-container-lowest p-4">
                <div className="flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <AutoGraphIcon className="size-6" />
                </div>
                <div>
                  <p className="font-heading text-sm font-black text-on-surface">Proof without disclosure</p>
                  <p className="mt-1 text-xs font-medium text-on-surface-variant">NFT metadata avoids raw salary while preserving proof status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-surface px-6 py-16">
        <div className="mx-auto mb-14 flex max-w-7xl flex-col items-start justify-between gap-12 md:flex-row">
          <div className="max-w-xs">
            <div className="mb-6 flex items-center gap-2">
              <Logo className="h-6 w-6" />
              <span className="font-heading text-xl font-bold tracking-tight text-white">Salary Cipher</span>
            </div>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Encrypted payroll infrastructure for companies that need on-chain settlement without public salary exposure.
            </p>
            <div className="flex mt-6">
              <Link href="https://github.com/BTBMan/salary-cipher" target="_blank"><FaGithub className="size-7" /></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-2">
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Product</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><Link className="transition-colors hover:text-primary" href="#product">Product</Link></li>
                <li><Link className="transition-colors hover:text-primary" href="#features">Features</Link></li>
                <li><Link className="transition-colors hover:text-primary" href="#workflow">Workflow</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-white">Security</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><Link className="transition-colors hover:text-primary" href="#privacy">Privacy</Link></li>
                <li>
                  <Link className="transition-colors hover:text-primary flex items-center" href="https://docs.zama.org/protocol" target="_blank">
                    Zama Protocol
                    <MdOpenInNew className="ml-1" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-outline">Powered by Zama Protocol</p>
        </div>
      </footer>
    </div>
  )
}
