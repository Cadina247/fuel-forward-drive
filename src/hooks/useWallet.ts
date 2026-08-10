import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'

export interface Wallet {
  id: string
  user_id: string
  balance: number
  currency: string
  updated_at: string | null
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  amount: number
  type: 'credit' | 'debit'
  description: string | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export function useWallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTransactions = useCallback(async (walletId: string) => {
    // Ledger table is optional on the shared portal backend.
    const { data } = await supabase
      .from('wallet_transactions' as never)
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions((data as WalletTransaction[] | null) ?? [])
  }, [])

  const load = useCallback(async () => {
    if (!user) {
      setWallet(null)
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    // The portal backend scopes wallets by `owner_id`; older schemas used `user_id`.
    let row: Wallet | null = null
    for (const column of ['owner_id', 'user_id']) {
      const { data, error: selErr } = await supabase
        .from('wallets')
        .select('*')
        .eq(column, user.id)
        .maybeSingle()
      if (!selErr) {
        row = (data as Wallet | null) ?? null
        if (row) break
      }
    }

    if (!row) {
      // Fallback if the profile trigger hasn't run for this user yet.
      const { data: created, error: insErr } = await supabase
        .from('wallets')
        .insert({ owner_id: user.id })
        .select('*')
        .maybeSingle()
      if (insErr) {
        setError(insErr.message)
        setLoading(false)
        return
      }
      row = created as Wallet | null
    }

    setWallet(row)
    if (row) await loadTransactions(row.id)
    setLoading(false)
  }, [user, loadTransactions])

  useEffect(() => {
    load()
  }, [load])

  /** Creates a pending credit — real settlement waits on a payment gateway. */
  const requestFunding = useCallback(
    async (amount: number, description: string) => {
      if (!wallet) throw new Error('Wallet not ready')
      const { data, error: e } = await supabase
        .from('wallet_transactions' as never)
        .insert({
          wallet_id: wallet.id,
          amount,
          type: 'credit',
          description,
          status: 'pending',
        })
        .select('*')
        .maybeSingle()
      if (e) throw new Error(e.message)
      await loadTransactions(wallet.id)
      return data as WalletTransaction
    },
    [wallet, loadTransactions]
  )

  /** Demo-only settlement of a pending funding request. */
  const confirmFunding = useCallback(
    async (txnId: string, amount: number) => {
      if (!wallet) throw new Error('Wallet not ready')
      const { error: txErr } = await supabase
        .from('wallet_transactions' as never)
        .update({ status: 'completed' })
        .eq('id', txnId)
      if (txErr) throw new Error(txErr.message)

      const newBalance = Number(wallet.balance ?? 0) + amount
      const { data, error: wErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
        .select('*')
        .maybeSingle()
      if (wErr) throw new Error(wErr.message)
      setWallet((data as Wallet) ?? { ...wallet, balance: newBalance })
      await loadTransactions(wallet.id)
    },
    [wallet, loadTransactions]
  )

  /** Atomic debit via the security-definer RPC. Throws on insufficient funds. */
  const spend = useCallback(
    async (amount: number, description: string) => {
      if (!wallet) throw new Error('Wallet not ready')
      const { data, error: e } = await supabase.rpc('spend_from_wallet', {
        _amount: amount,
        _description: description,
      })
      if (e) throw new Error(e.message)
      const updated = (Array.isArray(data) ? data[0] : data) as Wallet | null
      if (updated) setWallet(updated)
      await loadTransactions(wallet.id)
      return updated
    },
    [wallet, loadTransactions]
  )

  return {
    wallet,
    balance: Number(wallet?.balance ?? 0),
    currency: wallet?.currency ?? 'NGN',
    transactions,
    loading,
    error,
    refresh: load,
    requestFunding,
    confirmFunding,
    spend,
  }
}
