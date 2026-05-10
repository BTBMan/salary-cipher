import type { Metadata } from 'next'
import { OnboardingPageContent } from '@/components/onboarding/onboarding-page-content'

export const metadata: Metadata = {
  title: 'Salary Cipher | Company Selection',
  description: 'Select a sovereign vault to continue.',
}

export default function OnboardingPage() {
  return <OnboardingPageContent />
}
