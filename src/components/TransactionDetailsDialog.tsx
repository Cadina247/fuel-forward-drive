import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/hooks/use-toast'
import type { WalletTransaction } from '@/hooks/useWallet'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Package,
  XCircle,
} from 'lucide-react'

interface Props {
  transaction: (WalletTransaction & Record<string, unknown>) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Optional: jump to the related order screen */
  onViewOrder?: (orderId: string) => void
}

interface RelatedOrder {
  id: string
  status?: string | null
  total_amount?: number | null
  created_at?: string | null
  [key: string]: unknown
}

const money = (v: unknown) => `₦${Number(v ?? 0).toLocaleString()}`

const statusMeta = (status: string) => {
  if (status === 'completed')
    return { label: 'Successful', icon: CheckCircle2, className: 'text-green-600' }
  if (status === 'failed')
    return { label: 'Failed', icon: XCircle, className: 'text-destructive' }
  return { label: 'Pending', icon: Clock, className: 'text-amber-600' }
}

const TransactionDetailsDialog: React.FC<Props> = ({
  transaction,
  open,
  onOpenChange,
  onViewOrder,
}) => {
  const { toast } = useToast()
  const [order, setOrder] = useState<RelatedOrder | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const orderId =
    (transaction?.order_id as string | undefined) ||
    (transaction?.reference_id as string | undefined) ||
    null

  useEffect(() => {
    let cancelled = false
    setOrder(null)
    if (!open || !orderId) return
    setLoadingOrder(true)
    ;(async () => {
      const { data } = await supabase
        .from('orders' as never)
        .select('*')
        .eq('id', orderId)
        .maybeSingle()
      if (!cancelled) {
        setOrder((data as RelatedOrder | null) ?? null)
        setLoadingOrder(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, orderId])

  if (!transaction) return null

  const meta = statusMeta(transaction.status)
  const StatusIcon = meta.icon
  const isCredit = transaction.type === 'credit'
  const created = new Date(transaction.created_at)

  const timeline = [
    { label: 'Transaction initiated', at: created, done: true },
    {
      label: isCredit ? 'Payment confirmation' : 'Amount debited',
      at: transaction.status === 'pending' ? null : created,
      done: transaction.status !== 'pending',
      failed: transaction.status === 'failed',
    },
    {
      label: isCredit ? 'Wallet credited' : 'Transaction settled',
      at: transaction.status === 'completed' ? created : null,
      done: transaction.status === 'completed',
    },
  ]

  const copyRef = async () => {
    await navigator.clipboard.writeText(transaction.id)
    toast({ title: 'Reference copied' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
          <DialogDescription className="sr-only">
            Receipt, status timeline and related order
          </DialogDescription>
        </DialogHeader>

        {/* Receipt header */}
        <div className="flex flex-col items-center text-center gap-2 py-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isCredit ? 'bg-green-100' : 'bg-muted'
            }`}
          >
            {isCredit ? (
              <ArrowDownLeft className="h-6 w-6 text-green-700" />
            ) : (
              <ArrowUpRight className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <p className={`text-2xl font-bold ${isCredit ? 'text-green-600' : ''}`}>
            {isCredit ? '+' : '−'}
            {money(transaction.amount)}
          </p>
          <Badge variant="secondary" className={meta.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {meta.label}
          </Badge>
        </div>

        <Separator />

        {/* Receipt info */}
        <div className="space-y-2 text-sm">
          <Row label="Description" value={transaction.description || (isCredit ? 'Wallet funding' : 'Wallet payment')} />
          <Row label="Type" value={isCredit ? 'Credit' : 'Debit'} />
          <Row label="Date" value={created.toLocaleString()} />
          <div className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">Reference</span>
            <button
              onClick={copyRef}
              className="flex items-center gap-1 font-medium text-right break-all text-primary"
            >
              {transaction.id.slice(0, 8).toUpperCase()}
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>

        <Separator />

        {/* Status timeline */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Status timeline</h4>
          <ol className="space-y-3">
            {timeline.map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                      step.failed
                        ? 'bg-destructive'
                        : step.done
                          ? 'bg-primary'
                          : 'bg-muted-foreground/30'
                    }`}
                  />
                  {i < timeline.length - 1 && (
                    <span className="flex-1 w-px bg-border my-1" />
                  )}
                </div>
                <div className="pb-1">
                  <p
                    className={`text-sm ${step.done ? 'font-medium' : 'text-muted-foreground'}`}
                  >
                    {step.failed ? 'Payment failed' : step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.at ? step.at.toLocaleString() : 'Awaiting'}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Related order */}
        {orderId && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Related order</h4>
              {loadingOrder ? (
                <p className="text-xs text-muted-foreground">Loading order…</p>
              ) : order ? (
                <div className="rounded-lg border border-border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Order #{String(order.id).slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  {order.status && (
                    <p className="text-xs text-muted-foreground capitalize">
                      Status: {String(order.status)}
                    </p>
                  )}
                  {order.total_amount != null && (
                    <p className="text-xs text-muted-foreground">
                      Total: {money(order.total_amount)}
                    </p>
                  )}
                  {onViewOrder && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => onViewOrder(String(order.id))}
                    >
                      View order
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Order details are not available for this transaction.
                </p>
              )}
            </div>
          </>
        )}

        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
)

export default TransactionDetailsDialog
