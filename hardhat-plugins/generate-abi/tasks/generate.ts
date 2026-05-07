import fs from 'node:fs/promises'
import path from 'node:path'
import { task } from 'hardhat/config'

const deploymentDirRegex = /^chain-(\d+)$/
const kebabUpperBoundaryRegex = /([A-Z]+)([A-Z][a-z])/g
const kebabLowerBoundaryRegex = /([a-z0-9])([A-Z])/g
const kebabInvalidCharsRegex = /[^a-z0-9]+/gi
const kebabEdgeDashRegex = /^-+|-+$/g
const invalidIdentifierCharsRegex = /[^\w$]+/g
const leadingDigitRegex = /^\d/

interface Args {
  include?: IncludeMode
}

type IncludeMode = 'abi' | 'addresses' | 'abiAndAddresses'

interface ArtifactFile {
  abi?: unknown[]
  contractName?: string
}

interface ContractData {
  abi?: unknown[]
  addresses?: Record<number, string>
  exportName: string
}

const includeModes = new Set<IncludeMode>(['abi', 'addresses', 'abiAndAddresses'])

// Generate ABI from ./artifacts/contracts, ./artifacts/@openzeppelin/contracts/token,
// ./artifacts/@openzeppelin/confidential-contracts/token recursively.
// Generate addresses from ./ignition/deployments/xxx/deployed_addresses.json.
// Generate to ./src/contract-data/xx-xx.ts.
// The content of the generated files will be like this:
/*
  import type { Address } from 'viem'

  export const XxxXxx = {
    addresses: {
      [chainId: number]: 0x...,
    } as Record<number, Address>,
    abi: [
      ...
    ],
  } as const
*/
task('generate')
  .addOptionalParam('include', 'Generated content: abi, addresses, or abiAndAddresses.', 'abi')
  .setAction(async (args: Args, hre) => {
    const include = getIncludeMode(args.include)
    const root = hre.config.paths.root
    const outputDir = path.join(root, 'src/contract-data')
    const contracts = new Map<string, ContractData>()

    if (include === 'abi' || include === 'abiAndAddresses') {
      await collectAbiArtifacts(root, contracts)
    }

    if (include === 'addresses' || include === 'abiAndAddresses') {
      await collectDeploymentAddresses(root, contracts)
    }

    await fs.mkdir(outputDir, { recursive: true })

    for (const [name, data] of [...contracts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const filePath = path.join(outputDir, `${toKebabCase(name)}.ts`)
      const existing = await readExistingContractData(filePath)

      const addresses = include === 'abi' ? existing.addresses : formatAddresses(data.addresses ?? {})
      const abi = include === 'addresses' ? existing.abi : formatAbi(data.abi ?? [])

      await fs.writeFile(filePath, buildContractDataFile(data.exportName, addresses, abi))
    }

    process.stdout.write(`Generated ${contracts.size} contract data file(s) with include=${include}.\n`)
  })

function getIncludeMode(include = 'abi'): IncludeMode {
  if (!includeModes.has(include as IncludeMode)) {
    throw new Error(`Invalid include value "${include}". Expected abi, addresses, or abiAndAddresses.`)
  }

  return include as IncludeMode
}

async function collectAbiArtifacts(root: string, contracts: Map<string, ContractData>) {
  const artifactRoots = [
    path.join(root, 'artifacts/contracts'),
    path.join(root, 'artifacts/@openzeppelin/contracts/token'),
    path.join(root, 'artifacts/@openzeppelin/confidential-contracts/token'),
  ]

  for (const artifactRoot of artifactRoots) {
    for (const filePath of await listArtifactFiles(artifactRoot)) {
      const artifact = await readArtifact(filePath)

      if (!artifact?.contractName || !Array.isArray(artifact.abi)) {
        continue
      }

      upsertContractData(contracts, artifact.contractName, {
        abi: artifact.abi,
      })
    }
  }
}

async function collectDeploymentAddresses(root: string, contracts: Map<string, ContractData>) {
  const deploymentsDir = path.join(root, 'ignition/deployments')
  const deploymentDirs = await listDirectories(deploymentsDir)

  for (const deploymentDir of deploymentDirs) {
    const chainId = getChainIdFromDeploymentDir(deploymentDir)

    if (chainId === null) {
      continue
    }

    const addressesPath = path.join(deploymentDir, 'deployed_addresses.json')
    const deployedAddresses = await readJson<Record<string, string>>(addressesPath)

    if (!deployedAddresses) {
      continue
    }

    for (const [deploymentKey, address] of Object.entries(deployedAddresses)) {
      const contractId = getContractIdFromDeploymentKey(deploymentKey)
      const current = upsertContractData(contracts, contractId)

      current.addresses = {
        ...(current.addresses ?? {}),
        [chainId]: address,
      }
    }
  }
}

async function listArtifactFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentDir: string) {
    const entries = await safeReadDir(currentDir)

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
        continue
      }

      if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.endsWith('.dbg.json')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)

  return files
}

async function listDirectories(dir: string): Promise<string[]> {
  const entries = await safeReadDir(dir)

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(dir, entry.name))
}

async function safeReadDir(dir: string) {
  try {
    return await fs.readdir(dir, { withFileTypes: true })
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function readArtifact(filePath: string): Promise<ArtifactFile | null> {
  return readJson<ArtifactFile>(filePath)
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

function upsertContractData(
  contracts: Map<string, ContractData>,
  name: string,
  value: Partial<Pick<ContractData, 'abi' | 'addresses'>> = {},
) {
  const current = contracts.get(name) ?? {
    exportName: toExportName(name),
  }

  contracts.set(name, {
    ...current,
    ...value,
  })

  return contracts.get(name)!
}

function getChainIdFromDeploymentDir(deploymentDir: string) {
  const match = path.basename(deploymentDir).match(deploymentDirRegex)

  return match ? Number(match[1]) : null
}

function getContractIdFromDeploymentKey(deploymentKey: string) {
  return deploymentKey.includes('#') ? deploymentKey.split('#').at(-1)! : deploymentKey
}

async function readExistingContractData(filePath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf8')

    if (!isGeneratedContractData(content)) {
      return getEmptyContractData()
    }

    return {
      addresses: extractObjectField(content, 'addresses') ?? '{} as Record<number, Address>',
      abi: extractObjectField(content, 'abi') ?? '[]',
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return getEmptyContractData()
    }

    throw error
  }
}

function getEmptyContractData() {
  return {
    addresses: '{} as Record<number, Address>',
    abi: '[]',
  }
}

function isGeneratedContractData(content: string) {
  return content.includes('  addresses: ')
    && content.includes('  abi: ')
    && !content.includes('Artifact')
    && !content.includes('deployedAddress')
    && !content.includes('  address: ')
}

function extractObjectField(content: string, field: 'abi' | 'addresses') {
  const marker = `  ${field}: `
  const start = content.indexOf(marker)

  if (start === -1) {
    return null
  }

  const valueStart = start + marker.length
  const valueEnd = findTopLevelFieldEnd(content, valueStart)

  return valueEnd === -1 ? null : content.slice(valueStart, valueEnd)
}

function findTopLevelFieldEnd(content: string, start: number) {
  let depth = 0
  let inString: '"' | '\'' | '`' | null = null
  let escaped = false

  for (let index = start; index < content.length; index++) {
    const char = content[index]
    const next = content[index + 1]

    if (inString) {
      if (escaped) {
        escaped = false
      }
      else if (char === '\\') {
        escaped = true
      }
      else if (char === inString) {
        inString = null
      }
      continue
    }

    if (char === '"' || char === '\'' || char === '`') {
      inString = char
      continue
    }

    if (char === '{' || char === '[' || char === '(') {
      depth++
      continue
    }

    if (char === '}' || char === ']' || char === ')') {
      depth--
      continue
    }

    if (depth === 0 && char === ',' && next === '\n') {
      return index
    }
  }

  return -1
}

function buildContractDataFile(exportName: string, addresses: string, abi: string) {
  return `import type { Address } from 'viem'

export const ${exportName} = {
  addresses: ${addresses},
  abi: ${abi},
} as const
`
}

function formatAddresses(addresses: Record<number, string>) {
  const entries = Object.entries(addresses).sort(([a], [b]) => Number(a) - Number(b))

  if (entries.length === 0) {
    return '{} as Record<number, Address>'
  }

  return `{
${entries.map(([chainId, address]) => `    ${chainId}: '${address}',`).join('\n')}
  } as Record<number, Address>`
}

function formatAbi(abi: unknown[]) {
  return JSON.stringify(abi, null, 2)
    .split('\n')
    .map((line, index) => index === 0 ? line : `  ${line}`)
    .join('\n')
}

function toKebabCase(value: string) {
  return value
    .replace(kebabUpperBoundaryRegex, '$1-$2')
    .replace(kebabLowerBoundaryRegex, '$1-$2')
    .replace(kebabInvalidCharsRegex, '-')
    .replace(kebabEdgeDashRegex, '')
    .toLowerCase()
}

function toExportName(value: string) {
  const identifier = value.replace(invalidIdentifierCharsRegex, '')

  if (!identifier) {
    return 'ContractData'
  }

  return leadingDigitRegex.test(identifier) ? `Contract${identifier}` : identifier
}
