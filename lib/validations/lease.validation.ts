import { z } from "zod"

export const leaseSchema = z.object({
  // Relations (optionnelles - gérées via lease_relationships)
  property_id: z.string().optional(),
  owner_ids: z.array(z.string()).optional(),
  tenant_ids: z.array(z.string()).optional(),
  
  // Lease type and dates
  lease_type: z.enum(['residential', 'commercial', 'furnished', 'unfurnished', 'seasonal']),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().min(1, "Date de fin requise"),
  duration_months: z.number().positive("Durée doit être positive"),
  
  // Financial terms
  monthly_rent: z.number().positive("Loyer doit être positif"),
  charges: z.number().min(0, "Charges doivent être positives ou nulles"),
  deposit: z.number().min(0, "Dépôt de garantie doit être positif ou nul"),
  payment_day: z.number().min(1).max(31, "Jour de paiement invalide"),
  payment_frequency: z.enum(['monthly', 'quarterly']),
  
  // Indexation
  indexation_clause: z.boolean(),
  indexation_rate: z.number().optional(),
  indexation_index: z.enum(['irl', 'icc', 'custom']).optional(),
  
  // Terms
  termination_notice_period: z.number().positive().optional(),
  renewal_automatic: z.boolean(),
  renewal_conditions: z.string().optional(),
  special_clauses: z.array(z.string()).optional(),
  
  notes: z.string().optional(),
}).refine(
  (data) => {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    return end > start
  },
  {
    message: "La date de fin doit être après la date de début",
    path: ['end_date'],
  }
)

export type LeaseFormValues = z.infer<typeof leaseSchema>
