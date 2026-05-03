'use client'

import type { CompanySummary } from '@/contexts'
import type { Hash } from 'viem'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useConnection, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CompanyRegistry } from '@/contract-data/company-registry'
import { SalaryCipherCore } from '@/contract-data/salary-cipher-core'
import { useStoreContext } from './use-store-context'

interface ReceiptWaiter {
  hash: Hash
  resolve: () => void
  reject: (error: Error) => void
}

export function usePayrollActions(selectedCompany: CompanySummary | null) {
  const { address } = useConnection()
  const { refreshCompanies } = useStoreContext()
  const { mutateAsync } = useWriteContract()
  const receiptWaiterRef = useRef<ReceiptWaiter | null>(null)
  const [receiptHash, setReceiptHash] = useState<Hash>()
  const [isExecutingPayroll, setIsExecutingPayroll] = useState(false)
  const [isUpdatingPayrollConfig, setIsUpdatingPayrollConfig] = useState(false)
  const companyId = selectedCompany ? BigInt(selectedCompany.id) : null

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

  const executePayrollNow = useCallback(async () => {
    if (!address || !companyId) {
      toast.error('Wallet or company is not ready.')
      return false
    }

    setIsExecutingPayroll(true)

    try {
      const hash = await mutateAsync({
        abi: SalaryCipherCore.abi,
        address: SalaryCipherCore.address,
        functionName: 'executePayrollNow',
        args: [companyId],
        account: address,
      })

      await waitForReceipt(hash)
      await refreshCompanies()
      toast.success('Payroll executed.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to execute payroll.')
      return false
    }
    finally {
      setIsExecutingPayroll(false)
    }
  }, [address, companyId, mutateAsync, refreshCompanies, waitForReceipt])

  const updatePayrollDay = useCallback(async (dayOfMonth: number) => {
    if (!address || !companyId) {
      toast.error('Wallet or company is not ready.')
      return false
    }

    setIsUpdatingPayrollConfig(true)

    try {
      const hash = await mutateAsync({
        abi: CompanyRegistry.abi,
        address: CompanyRegistry.address,
        functionName: 'setPayrollConfig',
        args: [companyId, dayOfMonth],
        account: address,
      })

      await waitForReceipt(hash)
      await refreshCompanies()
      toast.success('Payroll day updated.')
      return true
    }
    catch (error) {
      console.error(error)
      toast.error('Failed to update payroll day.')
      return false
    }
    finally {
      setIsUpdatingPayrollConfig(false)
    }
  }, [address, companyId, mutateAsync, refreshCompanies, waitForReceipt])

  return {
    executePayrollNow,
    isExecutingPayroll,
    isUpdatingPayrollConfig,
    updatePayrollDay,
  } as const
}
