'use client'

import type { CompanySummary, CreateCompanyInput, SettlementAssetOption } from '@/contexts'
import type { RolesEnum } from '@/enums'
import type { PropsWithChildren } from 'react'
import type { Address, Hash } from 'viem'
import { useAppKitAccount } from '@reown/appkit/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { zeroAddress } from 'viem'
import { useConfig, useConnection, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { readContracts } from 'wagmi/actions'
import { StoreContext } from '@/contexts'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { SalaryCipherFactory } from '@/contract-data/salary-cipher-factory'
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

interface AssetConfigResult {
  decimals: number
  enabled: boolean
  settlementToken: Address
  underlyingToken: Address
}

interface SessionState {
  companies: CompanySummary[]
  settlementAssets: SettlementAssetOption[]
  selectedCompanyId: string | null
  isReady: boolean
}

interface ReceiptWaiter {
  hash: Hash
  resolve: () => void
  reject: (error: Error) => void
}

/**
 * Centralizes wallet-scoped company state loaded directly from CompanyRegistry.
 */
export function StoreProvider({ children }: PropsWithChildren) {
  const { address, isConnecting } = useConnection()
  const { status, isConnected } = useAppKitAccount()
  const config = useConfig()
  const { mutateAsync } = useWriteContract()

  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [sessionState, setSessionState] = useState<SessionState>({
    companies: [],
    settlementAssets: [],
    selectedCompanyId: null,
    isReady: false,
  })
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)

  const receiptQuery = useWaitForTransactionReceipt({
    hash: receiptHash,
    query: {
      enabled: Boolean(receiptHash),
    },
  })

  useEffect(() => {
    if (!receiptQuery.data || !receiptWaiterRef.current) {
      return
    }

    const waiter = receiptWaiterRef.current
    if (waiter.hash.toLowerCase() !== receiptQuery.data.transactionHash.toLowerCase()) {
      return
    }

    receiptWaiterRef.current = null
    waiter.resolve()
  }, [receiptQuery.data])

  useEffect(() => {
    if (!receiptQuery.error || !receiptWaiterRef.current) {
      return
    }

    const waiter = receiptWaiterRef.current
    receiptWaiterRef.current = null
    waiter.reject(receiptQuery.error)
  }, [receiptQuery.error])

  useEffect(() => {
    return () => {
      receiptWaiterRef.current?.reject(new Error('Transaction receipt wait was cancelled.'))
      receiptWaiterRef.current = null
    }
  }, [])

  const waitForReceipt = useCallback((hash: Hash) => {
    if (receiptWaiterRef.current) {
      return Promise.reject(new Error('Another transaction receipt is already pending.'))
    }

    return new Promise<void>((resolve, reject) => {
      receiptWaiterRef.current = {
        hash,
        resolve,
        reject,
      }
      setReceiptHash(hash)
    })
  }, [])

  const registryAddress = CompanyRegistry.address
  const companyRegistryAbi = CompanyRegistry.abi
  const assetConfigContracts = useMemo(() => {
    return SETTLEMENT_ASSET_PRESETS.map(asset => ({
      abi: companyRegistryAbi,
      address: registryAddress,
      functionName: 'getAssetConfig',
      args: [asset.value],
    }) as const)
  }, [companyRegistryAbi, registryAddress])

  const { refetch: refetchAssetConfigs } = useReadContracts({
    contracts: assetConfigContracts,
    query: {
      enabled: false,
    },
  })

  const { refetch: refetchUserCompanyIds } = useReadContract({
    abi: companyRegistryAbi,
    address: registryAddress,
    functionName: 'getUserCompanies',
    args: address ? [address] : undefined,
    query: {
      enabled: false,
    },
  })

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
    const assetConfigsResult = await refetchAssetConfigs()
    const assetConfigs = assetConfigsResult.data ?? []

    return SETTLEMENT_ASSET_PRESETS.map((asset, index) => {
      const result = assetConfigs[index]
      if (!result || result.status !== 'success') {
        return null
      }

      const config = result.result as AssetConfigResult
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
    }).filter(isDefined)
  }, [refetchAssetConfigs])

  const readCompanySummary = useCallback(async (companyId: bigint, account: Address) => {
    if (!registryAddress) {
      return null
    }

    const results = await readContracts(config, {
      contracts: [
        {
          abi: companyRegistryAbi,
          address: registryAddress,
          functionName: 'getCompany',
          args: [companyId],
        },
        {
          abi: companyRegistryAbi,
          address: registryAddress,
          functionName: 'getRole',
          args: [companyId, account],
        },
        {
          abi: companyRegistryAbi,
          address: registryAddress,
          functionName: 'getEmployeeCount',
          args: [companyId],
        },
        {
          abi: companyRegistryAbi,
          address: registryAddress,
          functionName: 'getPayrollConfig',
          args: [companyId],
        },
        {
          abi: companyRegistryAbi,
          address: registryAddress,
          functionName: 'getCompanySettlementAsset',
          args: [companyId],
        },
      ],
    })

    if (results.some((result: { status: string }) => result.status !== 'success')) {
      return null
    }

    const company = results[0].result as { name: string, owner: Address, createdAt: bigint }
    const role = results[1].result as RolesEnum
    const employeeCount = results[2].result as bigint
    const payrollConfig = results[3].result as { dayOfMonth: number, initialized: boolean }
    const settlementAsset = results[4].result as SettlementAssetEnum

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
  }, [companyRegistryAbi, config, registryAddress])

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

    if (!registryAddress) {
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
      refetchUserCompanyIds().then(result => (result.data ?? []) as bigint[]),
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
  }, [
    address,
    status,
    isConnected,
    readCompanySummary,
    readSettlementAssets,
    readStoredSelectedCompany,
    refetchUserCompanyIds,
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
          refetchUserCompanyIds().then(result => (result.data ?? []) as bigint[]),
        ])

        const companies = registryAddress
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
  }, [
    address,
    status,
    isConnected,
    isConnecting,
    readCompanySummary,
    readSettlementAssets,
    readStoredSelectedCompany,
    refetchUserCompanyIds,
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
        if (!registryAddress || !SalaryCipherFactory.address || !address) {
          toast.error('Wallet or contract is not ready.')
          return null
        }

        setIsCreatingCompany(true)

        try {
          const hash = await mutateAsync({
            abi: SalaryCipherFactory.abi,
            address: SalaryCipherFactory.address,
            functionName: 'createCompany',
            args: [input.name, input.payrollDayOfMonth, input.settlementAsset],
            account: address,
          })

          await waitForReceipt(hash)

          const companyIdsResult = await refetchUserCompanyIds()
          const companyIds = (companyIdsResult.data ?? []) as bigint[]
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
  }, [
    address,
    isCreatingCompany,
    persistSelectedCompany,
    readCompanySummary,
    refreshCompanies,
    registryAddress,
    selectedCompany,
    sessionState.companies,
    sessionState.isReady,
    sessionState.selectedCompanyId,
    sessionState.settlementAssets,
    refetchUserCompanyIds,
    waitForReceipt,
    mutateAsync,
  ])

  return (
    <StoreContext value={contextValue}>
      {children}
    </StoreContext>
  )
}
