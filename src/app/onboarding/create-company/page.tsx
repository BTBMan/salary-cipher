import type { Metadata } from 'next'
import { CreateCompanyPageContent } from '@/components/onboarding/create-company-page-content'

export const metadata: Metadata = {
  title: 'Salary Cipher | Create Company',
  description: 'Initialize a sovereign vault for a new company.',
}

export default function CreateCompanyPage() {
  return <CreateCompanyPageContent />
}
