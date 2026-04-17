import Link from 'next/link'
import {
  AccountBalanceIcon,
  AlternateEmailIcon,
  CheckCircleIcon,
  CodeIcon,
  HubIcon,
  LockIcon,
  PublicIcon,
  SecurityIcon,
  VerifiedIcon,
} from '@/components/icons'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Salary Cipher | Sovereign HR & Payroll',
  description: 'The world\'s first payroll protocol where sensitive employee data stays encrypted even while being processed.',
}

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 w-full bg-[#131b2e]/60 backdrop-blur-xl font-sans antialiased">
        <div className="flex items-center gap-2">
          <HubIcon className="text-[#6366F1] size-6" />
          <span className="text-xl font-bold tracking-tight text-white font-heading">Salary Cipher</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm font-semibold text-[#6366F1]" href="#">Overview</Link>
          <Link className="text-sm text-slate-400 hover:text-slate-300 transition-colors" href="#features">Features</Link>
          <Link className="text-sm text-slate-400 hover:text-slate-300 transition-colors" href="#security">Security</Link>
          <Link className="text-sm text-slate-400 hover:text-slate-300 transition-colors" href="#">Docs</Link>
        </div>
        <div className="flex items-center gap-4">
          <Button size="sm" className="px-5 py-2 text-sm font-semibold rounded-sm primary-gradient text-on-primary-fixed hover:opacity-90 transition-all active:scale-95 border-none">
            Connect Wallet
          </Button>
        </div>
      </nav>

      <main className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-surface-container-low border border-white/5">
            <span className="flex h-2 w-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(221,183,255,0.6)]" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-on-surface-variant">Zama-Powered FHE Protocol Live</span>
          </div>

          <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface mb-6 leading-[1.1]">
            Sovereign HR & Payroll, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-tertiary italic">Powered by FHE</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant mb-10 leading-relaxed">
            The world's first payroll protocol where sensitive employee data stays encrypted even while being processed. Secure, compliant, and fully decentralized.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 py-7 text-base font-semibold rounded-sm primary-gradient text-on-primary-fixed shadow-lg shadow-primary/20 hover:opacity-90 transition-all border-none"
              render={<Link href="/app">Launch App</Link>}
            >
              Launch App
            </Button>
            {/* <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-7 text-base font-semibold rounded-sm bg-surface-container border border-white/10 hover:bg-surface-container-high transition-all text-on-surface">
              View Docs
            </Button> */}
          </div>

          {/* Dashboard Preview */}
          <div className="mt-24 relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-tertiary/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
            <div className="relative rounded-xl overflow-hidden bg-surface-container-lowest border border-white/5 shadow-2xl">
              <img
                alt="Cryptographic dashboard UI"
                className="w-full opacity-80"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuANZ2JKip6ywpeVWnipwqJ6ha7EAwPk_brBe3JQeiCmRakm55kIW2uAWoXHgYQ7qOyvdyax0oPRWoMzvn8Y1Ki2n2_IRP6WYrLUiWXSZBmHf6-rFGp7o9RNibaYMxoJ4hHNs0srb1pQ5tGW_dsK9-yzR4IOByQtQNJhXG3gEbzBHCRzn_DKdqENkXwOUQ5J8Gtl2q3mba1Kfzysv4q4RntHi_raUHUxOElPYpQnPci0iJI8PBwQIdSINsN_qaTv8gXM3E-HuXpNOqc"
              />
              {/* Overlay Glass Component */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-surface-container-high/60 backdrop-blur-md p-6 rounded-lg border border-white/10 max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <LockIcon className="text-tertiary size-4 fill-current" />
                    <span className="font-mono text-[10px] tracking-wider text-on-surface-variant uppercase">DECRYPTING_STREAM...</span>
                  </div>
                  <div className="h-1.5 w-48 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-6 relative z-10 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-surface-container-low p-8 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                <SecurityIcon className="size-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-on-surface mb-3">Full Encryption</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Utilizing Fully Homomorphic Encryption (FHE), we compute payroll without ever seeing the raw salary data. Your privacy is mathematically guaranteed.
              </p>
            </div>

            <div className="group bg-surface-container-low p-8 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-tertiary/10 text-tertiary mb-6 group-hover:scale-110 transition-transform">
                <AccountBalanceIcon className="size-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-on-surface mb-3">Multi-Company Management</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Manage global payroll for multiple entities from a single sovereign vault. Granular permissioning for HR, accounting, and compliance teams.
              </p>
            </div>

            <div className="group bg-surface-container-low p-8 rounded-xl border border-white/5 hover:border-primary/30 transition-all duration-500">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary mb-6 group-hover:scale-110 transition-transform">
                <VerifiedIcon className="size-6" />
              </div>
              <h3 className="font-heading text-xl font-bold text-on-surface mb-3">RWA Salary Proofs</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Generate zero-knowledge proofs of income for real-world applications like mortgages and loans without exposing your entire transaction history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="security" className="py-24 px-6 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="w-full md:w-1/2">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-on-surface mb-6">Built for the next era of sovereign work.</h2>
            <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
              Traditional payroll is broken. Data breaches, delayed cross-border payments, and lack of financial privacy are the norms. Salary Cipher replaces trust with cryptography.
            </p>
            <ul className="space-y-4">
              {[
                'No centralized database of employee PII',
                'Instant, low-cost cross-border settlement',
                'Automated tax withholding & compliance',
              ].map(text => (
                <li key={text} className="flex items-start gap-3">
                  <CheckCircleIcon className="text-primary mt-1 size-5" />
                  <span className="text-on-surface font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2 relative">
            <div className="aspect-square bg-linear-to-tr from-primary/10 to-transparent rounded-full absolute -top-10 -right-10 w-64 h-64 blur-3xl opacity-50" />
            <div className="relative bg-surface-container p-4 rounded-xl border border-white/5 shadow-xl overflow-hidden">
              <img
                alt="Cybersecurity close-up"
                className="rounded-lg grayscale hover:grayscale-0 transition-all duration-700 w-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAde0TNa3hoPufcXHHE5YqQ84gqoIKpFHzqxqUc7sjmfVVHXWNadjRLIJvApNu2SSd1hvPbnNRQTnWuRwr9tdVhmig1eM_ZDKtYWNn1GntEgmrj55OCntEgPshXEsNnkLUpfshX7He1srYnLRZ3Fodth9oFP3alLEEmbRQipMW39hTJh_NXqFe9pCtF4x1CetXZ25fUzwNhXa0I7AfCjSdhMK7KsJO33LfGrNj29zrzfqdTi8daUg39fzJhUmC9l95Rv8548WQL44"
              />
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-surface-container-highest/80 backdrop-blur-xl border border-white/10 rounded-lg">
                <p className="font-mono text-[10px] text-primary mb-2 font-bold tracking-widest uppercase">IMMUTABLE_LOG_V4.02</p>
                <p className="text-sm font-medium text-on-surface leading-relaxed">"The integration of FHE into payroll isn't just a feature, it's a fundamental paradigm shift in how we handle employee privacy."</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-6">
              <HubIcon className="text-[#6366F1] size-6" />
              <span className="text-xl font-bold tracking-tight text-white font-heading">Salary Cipher</span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Securing the future of decentralized workforce management with cutting-edge privacy technology.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div>
              <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Product</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><Link className="hover:text-primary transition-colors" href="#">Overview</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Features</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Solutions</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Company</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><Link className="hover:text-primary transition-colors" href="#">About Us</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Careers</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-sm mb-6 uppercase tracking-widest">Legal</h4>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li><Link className="hover:text-primary transition-colors" href="#">Privacy</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Security</Link></li>
                <li><Link className="hover:text-primary transition-colors" href="#">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-outline font-mono uppercase tracking-[0.2em]">© 2024 Salary Cipher_PROTOCOL. ALL_RIGHTS_RESERVED.</p>
          <div className="flex gap-6">
            <PublicIcon className="text-outline hover:text-primary cursor-pointer transition-colors size-5" />
            <AlternateEmailIcon className="text-outline hover:text-primary cursor-pointer transition-colors size-5" />
            <CodeIcon className="text-outline hover:text-primary cursor-pointer transition-colors size-5" />
          </div>
        </div>
      </footer>
    </div>
  )
}
