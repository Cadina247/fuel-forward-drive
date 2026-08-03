import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Mail, Phone, User as UserIcon } from 'lucide-react'

const ProfileScreen: React.FC = () => {
  const { profile, user, signOut } = useAuth()

  const name = profile?.full_name || 'FuelNow user'
  const email = profile?.email || user?.email || '—'
  const phone = profile?.phone || user?.phone || '—'

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Account</h1>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">{name}</h2>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium break-all">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{phone}</p>
            </div>
          </div>
        </div>
      </Card>

      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Log out
      </Button>
    </div>
  )
}

export default ProfileScreen
