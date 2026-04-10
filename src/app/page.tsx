import WalletConnection from '@/components/wallet-connection'

export default function RootPage() {
  return (
    <div>
      <h1 className="text-[24px] font-bold">Salary Cipher</h1>
      <p>Salary Cipher is a platform for managing employee salaries and related financial operations.</p>
      <WalletConnection />
    </div>
  )
}
