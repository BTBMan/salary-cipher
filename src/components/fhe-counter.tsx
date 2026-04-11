'use client'

// import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web'
import { Button } from '@/components/ui/button'

export default function FheCounter() {
  // const init = async () => {
  //   const instance = await createInstance({
  //     ...SepoliaConfig,
  //     network: 'https://ethereum-sepolia-rpc.publicnode.com',
  //   })
  // }

  return (
    <div>
      <div>FheCounter</div>
      <div>Count: 0</div>
      <div>Encrypted: 0x00</div>
      <Button variant="secondary">Increase Count +1</Button>
      <Button variant="secondary">Decrease Count -1</Button>
    </div>
  )
}
