export const SALARY_PROOF_TYPES = [
  {
    description: 'Proves the encrypted monthly salary is greater than or equal to a selected threshold.',
    label: 'Monthly Salary >= X',
    value: 'MONTHLY_GTE',
  },
  {
    description: 'Proves the encrypted monthly salary is inside a selected encrypted range.',
    label: 'Monthly Salary between X and Y',
    value: 'MONTHLY_BETWEEN',
  },
  {
    description: 'Proves the employee has worked for at least the selected number of months.',
    label: 'Employment Duration >= N months',
    value: 'EMPLOYMENT_DURATION_GTE',
  },
] as const

export type SalaryProofType = typeof SALARY_PROOF_TYPES[number]['value']
const leadingProofIdHashRegex = /^#/

export interface SalaryProofSvgInput {
  companyName: string
  expiresAt: string
  proofId: string
  proofTypeLabel: string
  settlementToken: string
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

function fitLabel(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
}

export function buildSalaryProofSvg({
  companyName,
  expiresAt,
  proofId,
  proofTypeLabel,
  settlementToken,
}: SalaryProofSvgInput) {
  const safeCompanyName = escapeXml(fitLabel(companyName, 28).toUpperCase())
  const safeExpiresAt = escapeXml(fitLabel(expiresAt, 18).toUpperCase())
  const safeProofId = escapeXml(fitLabel(proofId, 18).toUpperCase())
  const safeProofType = escapeXml(fitLabel(proofTypeLabel, 34).toUpperCase())
  const safeSettlementToken = escapeXml(fitLabel(settlementToken, 12).toUpperCase())

  return `<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">SalaryCipher RWA Salary Proof NFT</title>
  <desc id="desc">A privacy-preserving RWA income proof credential. The SVG does not reveal the salary amount.</desc>
  <defs>
    <radialGradient id="glowTop" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(238 145) rotate(43) scale(730 640)">
      <stop stop-color="#70E7D1" stop-opacity="0.55"/>
      <stop offset="0.38" stop-color="#2D6BFF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#071019" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowBottom" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(790 862) rotate(-138) scale(620 540)">
      <stop stop-color="#E3C36A" stop-opacity="0.5"/>
      <stop offset="0.45" stop-color="#4B7DFF" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#071019" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="card" x1="215" y1="171" x2="839" y2="874" gradientUnits="userSpaceOnUse">
      <stop stop-color="#14243A" stop-opacity="0.96"/>
      <stop offset="0.55" stop-color="#0D1828" stop-opacity="0.98"/>
      <stop offset="1" stop-color="#10140F" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="seal" x1="345" y1="267" x2="686" y2="606" gradientUnits="userSpaceOnUse">
      <stop stop-color="#BDF8EA"/>
      <stop offset="0.48" stop-color="#6D94FF"/>
      <stop offset="1" stop-color="#EBD47B"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#FFE9A8"/>
      <stop offset="1" stop-color="#A9822C"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" stroke="#FFFFFF" stroke-opacity="0.045" stroke-width="1"/>
      <circle cx="0" cy="0" r="1.6" fill="#FFFFFF" fill-opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1024" height="1024" fill="#071019"/>
  <rect width="1024" height="1024" fill="url(#glowTop)"/>
  <rect width="1024" height="1024" fill="url(#glowBottom)"/>
  <rect width="1024" height="1024" fill="url(#grid)"/>
  <path d="M100 138C220 88 296 88 421 124C552 161 644 127 764 92C850 67 922 80 975 122" stroke="#8AF8DF" stroke-opacity="0.16" stroke-width="2"/>
  <path d="M54 838C183 780 306 801 421 850C546 904 677 922 869 816" stroke="#EBD47B" stroke-opacity="0.13" stroke-width="2"/>
  <rect x="164" y="132" width="696" height="780" rx="48" fill="url(#card)" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1.5"/>
  <rect x="188" y="156" width="648" height="732" rx="34" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/>
  <text x="512" y="223" text-anchor="middle" fill="#EAF7F3" font-family="ui-sans-serif, Inter, Arial, sans-serif" font-size="33" font-weight="800" letter-spacing="8">SALARYCIPHER</text>
  <text x="512" y="262" text-anchor="middle" fill="#9FB4C6" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" letter-spacing="4">PRIVACY-PRESERVING RWA CREDENTIAL</text>
  <g transform="translate(512 424)">
    <circle r="141" fill="#071019" fill-opacity="0.58" stroke="url(#seal)" stroke-width="2"/>
    <circle r="111" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1"/>
    <circle r="76" fill="url(#seal)" fill-opacity="0.1" stroke="#AEEFE3" stroke-opacity="0.45" stroke-width="1.5"/>
    <path d="M-44 13L-9 48L58 -45" stroke="url(#seal)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-128 -4H-95M95 -4H128M-4 -128V-95M-4 95V128" stroke="#EBD47B" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round"/>
  </g>
  <rect x="348" y="602" width="328" height="52" rx="26" fill="#0B151F" stroke="#76EBD7" stroke-opacity="0.28"/>
  <text x="512" y="636" text-anchor="middle" fill="#9DF6E5" font-family="ui-sans-serif, Inter, Arial, sans-serif" font-size="19" font-weight="900" letter-spacing="5">SEALED PROOF</text>
  <rect x="236" y="700" width="552" height="1" fill="#FFFFFF" fill-opacity="0.09"/>
  <text x="236" y="738" fill="#8196A8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">PROOF ID</text>
  <text x="788" y="738" text-anchor="end" fill="#EAF7F3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="800">${safeProofId}</text>
  <text x="236" y="779" fill="#8196A8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">TYPE</text>
  <text x="788" y="779" text-anchor="end" fill="#EAF7F3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="800">${safeProofType}</text>
  <text x="236" y="820" fill="#8196A8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">COMPANY</text>
  <text x="788" y="820" text-anchor="end" fill="#EAF7F3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="800">${safeCompanyName}</text>
  <text x="236" y="861" fill="#8196A8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">TOKEN / EXPIRY</text>
  <text x="788" y="861" text-anchor="end" fill="#EAF7F3" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="15" font-weight="800">${safeSettlementToken} / ${safeExpiresAt}</text>
  <rect x="224" y="304" width="157" height="38" rx="19" fill="#FFFFFF" fill-opacity="0.055" stroke="#FFFFFF" stroke-opacity="0.08"/>
  <text x="302" y="328" text-anchor="middle" fill="#B9C8D4" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="800" letter-spacing="2">FHE SEALED</text>
  <rect x="642" y="304" width="157" height="38" rx="19" fill="#FFFFFF" fill-opacity="0.055" stroke="#FFFFFF" stroke-opacity="0.08"/>
  <text x="721" y="328" text-anchor="middle" fill="#B9C8D4" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="800" letter-spacing="2">ON-CHAIN</text>
  <text x="512" y="954" text-anchor="middle" fill="#AAB8C4" font-family="ui-sans-serif, Inter, Arial, sans-serif" font-size="14" font-weight="700">Salary amount encrypted by FHE</text>
  <text x="512" y="982" text-anchor="middle" fill="url(#gold)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="900" letter-spacing="3">POWERED BY ZAMA FHE</text>
</svg>`
}

export function buildSalaryProofMetadata({
  companyName,
  expiresAt,
  imageUri,
  proofId,
  proofTypeLabel,
  settlementToken,
}: SalaryProofSvgInput & { imageUri: string }) {
  return {
    name: `SalaryCipher Income Proof ${proofId}`,
    description: 'A privacy-preserving RWA salary proof generated by SalaryCipher. The NFT metadata does not reveal the salary amount.',
    image: imageUri,
    attributes: [
      { trait_type: 'Proof Type', value: proofTypeLabel },
      { trait_type: 'Company', value: companyName },
      { trait_type: 'Settlement Token', value: settlementToken },
      { trait_type: 'Proof Privacy', value: 'FHE Sealed' },
      { trait_type: 'Expires At', value: expiresAt },
    ],
    external_url: `https://salarycipher.app/salary-proofs/${proofId.replace(leadingProofIdHashRegex, '')}`,
  } satisfies NFTMetadata & { external_url: string }
}
