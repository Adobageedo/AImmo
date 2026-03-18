import { z } from "zod";

export const tenantSchema = z.object({
  type: z.enum(["individual", "company"]),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === "individual") {
      return data.first_name && data.last_name;
    }
    return data.company_name;
  },
  {
    message: "Nom et prénom requis pour un particulier, nom de société requis pour une entreprise",
  }
);

export const updateTenantSchema = tenantSchema.partial().extend({
  payment_status: z.enum(["ok", "late", "unpaid"]).optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;
