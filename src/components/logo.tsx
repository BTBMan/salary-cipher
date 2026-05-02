import Image from 'next/image'
import LogoImg from '@/assets/images/logo.png'
import { cn } from '@/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <>
      <div className={cn('w-10 h-10 bg-primary-container flex items-center justify-center rounded-lg shadow-lg overflow-hidden', className)}>
        <Image src={LogoImg} alt="Salary Cipher" />
      </div>
    </>
  )
}
