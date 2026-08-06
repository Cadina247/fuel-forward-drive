import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useWallet } from '@/hooks/useWallet'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Wallet as WalletIcon,
  CreditCard,
  Building2,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface Props {
  onBack: () => void
}

const QUICK_AMOUNTS = [2000, 5000, 10000, 20000]

const FundWalletScreen: React.FC<Props> = ({ onBack }) => {
  const { balance, loading, requestFunding, confirmFunding, transactions } = useWallet()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'card' | 'bank'>('card')
  const [state, setState] = useState<'idle' | 'processing' | 'pending'>('idle')
  const [pendingTxn, setPendingTxn] = useState<{ id: string; amount: number } | null>(null)

  const value = Number(amount || 0)
  const valid = value >= 100

  const handleFund = async () => {
    if (!valid) return
    setState('processing')
    try {
      const txn = await requestFunding(
        value,
        `Wallet funding via ${method === 'card' ? 'Card' : 'Bank transfer'}`
      )
      setPendingTxn({ id: txn.id, amount: value })
      setState('pending')
    } catch (e: any) {
      setState('idle')
      toast({ title: 'Could not start funding', description: e.message, variant: 'destructive' })
    }
  }

  const handleConfirm = async () => {
    if (!pendingTxn) return
    try {
      await confirmFunding(pendingTxn.id, pendingTxn.amount)
      toast({
        title: 'Wallet funded',
        description: `₦${pendingTxn.amount.toLocaleString()} added to your balance.`,
      })
      setPendingTxn(null)
      setAmount('')
      setState('idle')
    } catch (e: any) {
      toast({ title: 'Confirmation failed', description: e.message, variant: 'destructive' })
    }
  }

  const pendingCount = transactions.filter((t) => t.status === 'pending').length

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Fund Wallet</h1>
          <p className="text-xs text-muted-foreground">Top up your FuelNow balance</p>
        </div>
      </div>

      <Card className="p-5 bg-gradient-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <WalletIcon className="h-6 w-6" />
          <div>
            <p className="text-xs opacity-80">Current balance</p>
            <p className="text-2xl font-bold">
              {loading ? '—' : `₦${balance.toLocaleString()}`}
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <p className="text-xs opacity-90 mt-2">{pendingCount} pending confirmation(s)</p>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <Label htmlFor="amount">Amount (₦)</Label>
        <Input
          id="amount"
          inputMode="numeric"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
        />
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <Button key={a} variant="outline" size="sm" onClick={() => setAmount(String(a))}>
              ₦{a / 1000}k
            </Button>
          ))}
        </div>
        {amount && !valid && (
          <p className="text-xs text-destructive">Minimum funding amount is ₦100.</p>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Payment Method</h2>
        <Card
          className={`p-4 cursor-pointer border-2 transition-all ${
            method === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setMethod('card')}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Debit / Credit Card</h3>
              <p className="text-xs text-muted-foreground">Visa, Mastercard, Verve</p>
            </div>
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer border-2 transition-all ${
            method === 'bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setMethod('bank')}
        >
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Bank Transfer</h3>
              <p className="text-xs text-muted-foreground">Pay from any Nigerian bank app</p>
            </div>
          </div>
        </Card>
      </div>

      {state === 'pending' && pendingTxn ? (
        <Card className="p-4 border-primary/40 space-y-3">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Payment confirmation pending</p>
              <p className="text-muted-foreground text-xs">
                ₦{pendingTxn.amount.toLocaleString()} logged as a pending credit. A live payment
                gateway isn't connected yet — this is a placeholder flow.
              </p>
            </div>
          </div>
          <Separator />
          <Button variant="fuel" className="w-full" onClick={handleConfirm}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Simulate confirmation (demo)
          </Button>
        </Card>
      ) : (
        <Button
          variant="fuel"
          size="xl"
          className="w-full"
          disabled={!valid || state === 'processing' || loading}
          onClick={handleFund}
        >
          {state === 'processing' ? (
            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing…</>
          ) : (
            <>Fund ₦{(value || 0).toLocaleString()}</>
          )}
        </Button>
      )}

      <Card className="p-3">
        <Badge variant="secondary" className="mb-2">Placeholder</Badge>
        <p className="text-xs text-muted-foreground">
          No live payment gateway is integrated. Funding requests are recorded as pending
          transactions until a gateway is connected.
        </p>
      </Card>
    </div>
  )
}

export default FundWalletScreen
