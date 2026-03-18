import { z } from "zod";

export const leaseSchema = z.object({
  property_id: z.string().uuid("ID propriété invalide"),
  tenant_id: z.string().uuid("ID locataire invalide"),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().min(1, "Date de fin requise"),
  monthly_rent: z.number().min(0, "Le loyer doit être positif"),
  charges: z.number().min(0, "Les charges doivent être positives"),
  deposit: z.number().min(0, "Le dépôt doit être positif"),
  indexation_clause: z.boolean().default(false),
  indexation_rate: z.number().optional(),
  payment_day: z.number().min(1).max(31).default(1),
  termination_notice_period: z.number().optional(),
  renewal_conditions: z.string().optional(),
  special_clauses: z.array(z.string()).optional(),
}).refine(
  (data) => new Date(data.end_date) > new Date(data.start_date),
  {
    message: "La date de fin doit être après la date de début",
    path: ["end_date"],
  }
);

export const updateLeaseSchema = leaseSchema.partial().extend({
  status: z.enum(["active", "expired", "terminated", "pending"]).optional(),
});

export type LeaseFormData = z.infer<typeof leaseSchema>;
export type UpdateLeaseFormData = z.infer<typeof updateLeaseSchema>;
