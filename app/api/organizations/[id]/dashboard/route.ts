import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: organizationId } = await params

    // Récupérer le nombre total de propriétés
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Récupérer le nombre total de baux
    const { count: leasesCount } = await supabase
      .from('leases')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Récupérer le nombre de baux actifs
    const { count: activeLeasesCount } = await supabase
      .from('leases')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    // Récupérer le nombre total de locataires
    const { count: tenantsCount } = await supabase
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Récupérer le nombre total de propriétaires
    const { count: ownersCount } = await supabase
      .from('owners')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Calculer le revenu mensuel total (somme des loyers actifs)
    const { data: activeLeases } = await supabase
      .from('leases')
      .select('monthly_rent')
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    const totalMonthlyRevenue = activeLeases?.reduce((sum, lease) => sum + (lease.monthly_rent || 0), 0) || 0

    // Récupérer les baux expirant dans les 30 prochains jours
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: expiringLeases } = await supabase
      .from('leases')
      .select(`
        id,
        start_date,
        end_date,
        monthly_rent,
        status
      `)
      .eq('organization_id', organizationId)
      .gte('end_date', new Date().toISOString())
      .lte('end_date', thirtyDaysFromNow.toISOString())
      .order('end_date', { ascending: true })
      .limit(5)

    // Enrichir les baux expirants avec les relations
    const expiringLeasesWithRelations = await Promise.all(
      (expiringLeases || []).map(async (lease) => {
        // Récupérer la propriété liée
        const { data: propertyRel } = await supabase
          .from('lease_relationships')
          .select('entity_id')
          .eq('lease_id', lease.id)
          .eq('entity_type', 'property')
          .single()

        let property = null
        if (propertyRel) {
          const { data: prop } = await supabase
            .from('properties')
            .select('id, name, address, city')
            .eq('id', propertyRel.entity_id)
            .single()
          property = prop
        }

        // Récupérer les locataires liés
        const { data: tenantRels } = await supabase
          .from('lease_relationships')
          .select('entity_id')
          .eq('lease_id', lease.id)
          .eq('entity_type', 'tenant')

        const tenants = await Promise.all(
          (tenantRels || []).map(async (rel) => {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('id, first_name, last_name, email')
              .eq('id', rel.entity_id)
              .single()
            return tenant
          })
        )

        return {
          ...lease,
          property,
          tenants: tenants.filter(Boolean)
        }
      })
    )

    // Récupérer les propriétés récemment ajoutées
    const { data: recentProperties } = await supabase
      .from('properties')
      .select('id, name, address, city, created_at, status')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Récupérer les baux récemment créés
    const { data: recentLeases } = await supabase
      .from('leases')
      .select('id, start_date, end_date, monthly_rent, created_at, status')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Calculer les statistiques par statut de propriété
    const { data: propertiesByStatus } = await supabase
      .from('properties')
      .select('status')
      .eq('organization_id', organizationId)

    const propertyStatusStats = propertiesByStatus?.reduce((acc, prop) => {
      acc[prop.status] = (acc[prop.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProperties: propertiesCount || 0,
          totalLeases: leasesCount || 0,
          activeLeases: activeLeasesCount || 0,
          totalTenants: tenantsCount || 0,
          totalOwners: ownersCount || 0,
          totalMonthlyRevenue,
          propertyStatusStats
        },
        expiringLeases: expiringLeasesWithRelations,
        recentActivity: {
          properties: recentProperties || [],
          leases: recentLeases || []
        }
      }
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' 
      },
      { status: 500 }
    )
  }
}
