'use client'

import type { CompanySummary, CreateCompanyInput, SettlementAssetOption } from '@/contexts'
import type { RolesEnum } from '@/enums'
import type { PropsWithChildren } from 'react'
import type { Address } from 'viem'
import { useAppKitAccount } from '@reown/appkit/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { zeroAddress } from 'viem'
import { useConnection, usePublicClient, useWalletClient } from 'wagmi'
import { StoreContext } from '@/contexts'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { SettlementAssetEnum } from '@/enums'

const STORAGE_KEY_PREFIX = 'salary-cipher'

function isDefined<T>(value: T | null): value is T {
  return value !== null
}

const SETTLEMENT_ASSET_PRESETS = [
  {
    value: SettlementAssetEnum.USDC,
    symbol: 'USDC',
    label: 'USDC (USD Coin)',
  },
  {
    value: SettlementAssetEnum.USDT,
    symbol: 'USDT',
    label: 'USDT (Tether)',
  },
] as const satisfies ReadonlyArray<Pick<SettlementAssetOption, 'value' | 'label' | 'symbol'>>

function getSelectedCompanyStorageKey(address: string) {
  return `${STORAGE_KEY_PREFIX}:selected-company:${address.toLowerCase()}`
}

interface SessionState {
  companies: CompanySummary[]
  settlementAssets: SettlementAssetOption[]
  selectedCompanyId: string | null
  isReady: boolean
}

/**
 * Centralizes wallet-scoped company state loaded directly from CompanyRegistry.
 */
export function StoreProvider({ children }: PropsWithChildren) {
  const { address, isConnecting } = useConnection()
  const { status, isConnected } = useAppKitAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [sessionState, setSessionState] = useState<SessionState>({
    companies: [],
    settlementAssets: [],
    selectedCompanyId: null,
    isReady: false,
  })
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)

  const registryAddress = CompanyRegistry.address
  const companyRegistryAbi = CompanyRegistry.abi

  const readStoredSelectedCompany = useCallback((account: string, companyIds: string[]) => {
    const storedCompanyId = window.localStorage.getItem(getSelectedCompanyStorageKey(account))
    return storedCompanyId && companyIds.includes(storedCompanyId) ? storedCompanyId : null
  }, [])

  const persistSelectedCompany = useCallback((account: string, companyId: string | null) => {
    if (companyId) {
      window.localStorage.setItem(getSelectedCompanyStorageKey(account), companyId)
      return
    }

    window.localStorage.removeItem(getSelectedCompanyStorageKey(account))
  }, [])

  const readSettlementAssets = useCallback(async () => {
    if (!publicClient || !registryAddress) {
      return []
    }

    const assetConfigs = await Promise.all(
      SETTLEMENT_ASSET_PRESETS.map(async (asset) => {
        const config = await publicClient.readContract({
          abi: companyRegistryAbi,
          address: registryAddress,
          functionName: 'getAssetConfig',
          args: [asset.value],
        }) as {
          underlyingToken: Address
          settlementToken: Address
          enabled: boolean
          decimals: number
        }

        if (!config.enabled || config.underlyingToken === zeroAddress || config.settlementToken === zeroAddress) {
          return null
        }

        return {
          value: asset.value,
          label: asset.label,
          symbol: asset.symbol,
          decimals: Number(config.decimals),
          underlyingToken: config.underlyingToken,
          settlementToken: config.settlementToken,
        } satisfies SettlementAssetOption
      }),
    )

    return assetConfigs.filter(isDefined)
  // eslint-disable-next-line react/exhaustive-deps
  }, [publicClient, registryAddress])

  const readCompanySummary = useCallback(async (companyId: bigint, account: Address) => {
    if (!publicClient || !registryAddress) {
      return null
    }

    const [company, role, employeeCount, payrollConfig, settlementAsset] = await Promise.all([
      publicClient.readContract({
        abi: companyRegistryAbi,
        address: registryAddress,
        functionName: 'getCompany',
        args: [companyId],
      }) as Promise<{ name: string, owner: Address, createdAt: bigint }>,
      publicClient.readContract({
        abi: companyRegistryAbi,
        address: registryAddress,
        functionName: 'getRole',
        args: [companyId, account],
      }) as Promise<RolesEnum>,
      publicClient.readContract({
        abi: companyRegistryAbi,
        address: registryAddress,
        functionName: 'getEmployeeCount',
        args: [companyId],
      }) as Promise<bigint>,
      publicClient.readContract({
        abi: companyRegistryAbi,
        address: registryAddress,
        functionName: 'getPayrollConfig',
        args: [companyId],
      }) as Promise<{ dayOfMonth: number, initialized: boolean }>,
      publicClient.readContract({
        abi: companyRegistryAbi,
        address: registryAddress,
        functionName: 'getCompanySettlementAsset',
        args: [companyId],
      }) as Promise<SettlementAssetEnum>,
    ])

    return {
      id: companyId.toString(),
      name: company.name,
      description: '',
      role,
      employeeCount: Number(employeeCount),
      wallet: company.owner,
      avatarSeed: company.name.charAt(0).toUpperCase() || 'C',
      payrollDayOfMonth: Number(payrollConfig.dayOfMonth),
      settlementAsset,
    } satisfies CompanySummary
  // eslint-disable-next-line react/exhaustive-deps
  }, [publicClient, registryAddress])

  const refreshCompanies = useCallback(async () => {
    if (!isConnected || !address) {
      setSessionState({
        companies: [],
        settlementAssets: [],
        selectedCompanyId: null,
        isReady: status === 'connected',
      })
      return
    }

    if (!publicClient || !registryAddress) {
      setSessionState({
        companies: [],
        settlementAssets: [],
        selectedCompanyId: null,
        isReady: true,
      })
      return
    }

    const [settlementAssets, companyIds] = await Promise.all([
      readSettlementAssets(),
      publicClient.readContract({
        abi: companyRegistryAbi,
        address: registryAddress,
        functionName: 'getUserCompanies',
        args: [address],
      }) as Promise<bigint[]>,
    ])

    const companies = (
      await Promise.all(companyIds.map(companyId => readCompanySummary(companyId, address)))
    ).filter(isDefined)

    const selectedCompanyId = readStoredSelectedCompany(
      address,
      companies.map(company => company.id),
    )

    setSessionState({
      companies,
      settlementAssets,
      selectedCompanyId,
      isReady: true,
    })
  // eslint-disable-next-line react/exhaustive-deps
  }, [
    address,
    status,
    isConnected,
    isConnecting,
    publicClient,
    readCompanySummary,
    readSettlementAssets,
    readStoredSelectedCompany,
    registryAddress,
  ])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!isConnected || !address) {
        setSessionState({
          companies: [],
          settlementAssets: [],
          selectedCompanyId: null,
          isReady: status === 'connected',
        })
        return
      }

      setSessionState(prevState => ({
        ...prevState,
        isReady: false,
      }))

      try {
        const [settlementAssets, companyIds] = await Promise.all([
          readSettlementAssets(),
          publicClient && registryAddress
            ? publicClient.readContract({
              abi: companyRegistryAbi,
              address: registryAddress,
              functionName: 'getUserCompanies',
              args: [address],
            }) as Promise<bigint[]>
            : Promise.resolve([]),
        ])

        const companies = publicClient && registryAddress
          ? (
              await Promise.all(companyIds.map(companyId => readCompanySummary(companyId, address)))
            ).filter(isDefined)
          : []

        if (cancelled) {
          return
        }

        const selectedCompanyId = registryAddress
          ? readStoredSelectedCompany(address, companies.map(company => company.id))
          : null

        setSessionState({
          companies,
          settlementAssets,
          selectedCompanyId,
          isReady: true,
        })
      }
      catch (error) {
        if (cancelled) {
          return
        }

        console.error(error)
        toast.error('Failed to load company data from chain.')
        setSessionState({
          companies: [],
          settlementAssets: [],
          selectedCompanyId: null,
          isReady: true,
        })
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react/exhaustive-deps
  }, [
    address,
    status,
    isConnected,
    isConnecting,
    publicClient,
    readCompanySummary,
    readSettlementAssets,
    readStoredSelectedCompany,
    registryAddress,
  ])

  const selectedCompany = useMemo(() => {
    return sessionState.companies.find(company => company.id === sessionState.selectedCompanyId) ?? null
  }, [sessionState.companies, sessionState.selectedCompanyId])

  const contextValue = useMemo(() => {
    return {
      companies: sessionState.companies,
      hasCompanies: sessionState.companies.length > 0,
      selectedCompany,
      selectedCompanyId: sessionState.selectedCompanyId,
      settlementAssets: sessionState.settlementAssets,
      isReady: sessionState.isReady,
      isCreatingCompany,
      createCompany: async (input: CreateCompanyInput) => {
        if (!walletClient || !publicClient || !registryAddress || !address) {
          toast.error('Wallet or contract is not ready.')
          return null
        }

        setIsCreatingCompany(true)

        try {
          const hash = await walletClient.writeContract({
            abi: companyRegistryAbi,
            address: registryAddress,
            functionName: 'createCompany',
            args: [input.name, input.payrollDayOfMonth, input.settlementAsset],
            account: address,
          })

          await publicClient.waitForTransactionReceipt({ hash })

          const companyIds = await publicClient.readContract({
            abi: companyRegistryAbi,
            address: registryAddress,
            functionName: 'getUserCompanies',
            args: [address],
          }) as bigint[]
          const companyId = companyIds.at(-1)

          if (!companyId) {
            await refreshCompanies()
            toast.success('Company created.')
            return null
          }

          persistSelectedCompany(address, null)
          const company = await readCompanySummary(companyId, address)
          await refreshCompanies()
          setSessionState(prevState => ({
            ...prevState,
            selectedCompanyId: null,
          }))
          toast.success('Company created.')

          return company
        }
        catch (error) {
          console.error(error)
          toast.error('Failed to create company.')
          return null
        }
        finally {
          setIsCreatingCompany(false)
        }
      },
      selectCompany: (companyId: string) => {
        if (!address) {
          return
        }

        persistSelectedCompany(address, companyId)
        setSessionState(prevState => ({
          ...prevState,
          selectedCompanyId: companyId,
        }))
      },
      clearSelectedCompany: () => {
        if (!address) {
          return
        }

        persistSelectedCompany(address, null)
        setSessionState(prevState => ({
          ...prevState,
          selectedCompanyId: null,
        }))
      },
      refreshCompanies,
    }
  // eslint-disable-next-line react/exhaustive-deps
  }, [
    address,
    isCreatingCompany,
    persistSelectedCompany,
    publicClient,
    readCompanySummary,
    refreshCompanies,
    registryAddress,
    selectedCompany,
    sessionState.companies,
    sessionState.isReady,
    sessionState.selectedCompanyId,
    sessionState.settlementAssets,
    walletClient,
  ])

  return (
    <StoreContext value={contextValue}>
      {children}
    </StoreContext>
  )
}
