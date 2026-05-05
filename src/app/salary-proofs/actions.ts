'use server'

import { PinataSDK } from 'pinata'
import { z } from 'zod'
import 'server-only'

const metadataAttributeSchema = z.object({
  trait_type: z.string(),
  value: z.string(),
})

const metadataSchema = z.object({
  attributes: z.array(metadataAttributeSchema),
  description: z.string(),
  external_url: z.string(),
  image: z.string(),
  name: z.string(),
})

const uploadSalaryProofNftSchema = z.object({
  metadata: metadataSchema.omit({ image: true }),
  proofId: z.string().min(1),
  svg: z.string().min(1),
})
const trailingSlashRegex = /\/$/
const unsafeFileNameRegex = /[^a-z0-9-]/gi
const repeatedDashRegex = /-+/g

function getPinata() {
  if (!process.env.PINATA_JWT) {
    throw new Error('PINATA_JWT is not configured.')
  }

  return new PinataSDK({
    pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
    pinataJwt: process.env.PINATA_JWT,
  })
}

function toGatewayUrl(cid: string) {
  const configuredGateway = process.env.NEXT_PUBLIC_GATEWAY_URL?.trim()
  const gateway = configuredGateway
    ? configuredGateway.startsWith('http')
      ? configuredGateway
      : `https://${configuredGateway}`
    : 'https://gateway.pinata.cloud'

  return `${gateway.replace(trailingSlashRegex, '')}/ipfs/${cid}`
}

function toIpfsUri(cid: string) {
  return `ipfs://${cid}`
}

function safeFileName(value: string) {
  return value.replace(unsafeFileNameRegex, '-').replace(repeatedDashRegex, '-').toLowerCase()
}

export async function uploadSalaryProofNft(input: z.input<typeof uploadSalaryProofNftSchema>) {
  const parsed = uploadSalaryProofNftSchema.parse(input)
  const pinata = getPinata()
  const fileName = safeFileName(parsed.proofId || 'salary-proof')

  const svgFile = new File([parsed.svg], `${fileName}.svg`, {
    type: 'image/svg+xml',
  })
  const imageUpload = await pinata.upload.public.file(svgFile)
  const imageUri = toIpfsUri(imageUpload.cid)
  const metadata = {
    ...parsed.metadata,
    image: imageUri,
  }

  const metadataUpload = await pinata.upload.public.json(metadata)

  return {
    imageCid: imageUpload.cid,
    imageGatewayUrl: toGatewayUrl(imageUpload.cid),
    imageUri,
    metadataCid: metadataUpload.cid,
    metadataGatewayUrl: toGatewayUrl(metadataUpload.cid),
    tokenUri: toIpfsUri(metadataUpload.cid),
  }
}
