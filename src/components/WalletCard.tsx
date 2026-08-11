import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWallet, type WalletTransaction } from '@/hooks/useWallet'
import TransactionDetailsDialog from '@/components/TransactionDetailsDialog'
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'

interface Props {
  onFundWallet?: () => void
  onViewOrder?: (orderId: string) => void
}

const statusVariant = (s: string) =>
  s === 'completed' ? 'text-green-600' : s === 'failed' ? 'text-destructive' : 'text-muted-foreground'

const WalletCard: React.FC<Props> = ({ onFundWallet, onViewOrder }) => {
  const { balance, transactions, loading, error } = useWallet()
  const [selected, setSelected] = useState<WalletTransaction | null>(null)

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-primary text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WalletIcon className="h-6 w-6" />
            <div>
              <p className="text-xs opacity-80">Wallet balance</p>
              <p className="text-2xl font-bold">{loading ? '—' : `₦${balance.toLocaleString()}`}</p>
            </div>
          </div>
          {onFundWallet && (
            <Button size="sm" variant="secondary" onClick={onFundWallet}>
              <Plus className="h-4 w-4 mr-1" /> Fund
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Card className="p-3 border-destructive/40">
          <p className="text-sm text-destructive">Wallet unavailable: {error}</p>
        </Card>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Transaction history</h3>
        {transactions.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No transactions yet.</Card>
        ) : (
          transactions.map((t) => (
            <Card
              key={t.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(t)}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(t)}
              className="p-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    t.type === 'credit' ? 'bg-green-100' : 'bg-muted'
                  }`}
                >
                  {t.type === 'credit' ? (
                    <ArrowDownLeft className="h-4 w-4 text-green-700" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.description || (t.type === 'credit' ? 'Wallet funding' : 'Wallet payment')}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${t.type === 'credit' ? 'text-green-600' : ''}`}>
                  {t.type === 'credit' ? '+' : '−'}₦{Number(t.amount).toLocaleString()}
                </p>
                <Badge variant="secondary" className={`text-xs ${statusVariant(t.status)}`}>
                  {t.status}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>

      <TransactionDetailsDialog
        transaction={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        onViewOrder={onViewOrder}
      />
    </div>
  )
}

export default WalletCard
