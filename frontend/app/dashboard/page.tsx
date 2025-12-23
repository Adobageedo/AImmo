import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrganizationSwitcher } from '@/components/organization-switcher'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <OrganizationSwitcher />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-2">Bienvenue</h2>
            <p className="text-muted-foreground">
              Votre tableau de bord AImmo
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-2">Propriétés</h2>
            <p className="text-muted-foreground">
              Gérez vos propriétés
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-semibold mb-2">Documents</h2>
            <p className="text-muted-foreground">
              Accédez à vos documents
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
