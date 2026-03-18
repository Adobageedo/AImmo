import { z } from "zod"

const tenantEmploymentSchema = z.object({
  employer: z.string().min(2, "Nom de l'employeur requis"),
  position: z.string().min(2, "Poste requis"),
  contract_type: z.enum(['cdi', 'cdd', 'interim', 'freelance', 'retired', 'student', 'other']),
  start_date: z.string(),
  monthly_salary: z.number().positive().optional(),
  employer_phone: z.string().optional(),
  employer_address: z.string().optional(),
})

const tenantReferenceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['employer', 'previous_landlord', 'personal']),
  name: z.string().min(2, "Nom requis"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
})

const tenantGuarantorSchema = z.object({
  id: z.string().optional(),
  first_name: z.string().min(2, "Prénom requis"),
  last_name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Téléphone invalide"),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
  postal_code: z.string().min(4, "Code postal invalide"),
  country: z.string().min(2, "Pays requis"),
  relationship: z.string().min(2, "Relation requise"),
  monthly_income: z.number().positive().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
})

export const tenantSchema = z.object({
  type: z.enum(['individual', 'company']),
  
  // Personal Information (for individual)
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Téléphone invalide").optional(),
  date_of_birth: z.string().optional(),
  place_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  
  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  
  // Employment (for individual)
  employment: tenantEmploymentSchema.optional(),
  
  // References
  references: z.array(tenantReferenceSchema).optional(),
  
  // Guarantors
  guarantors: z.array(tenantGuarantorSchema).optional(),
  
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'individual') {
      return data.first_name && data.last_name
    }
    return data.company_name
  },
  {
    message: "Nom et prénom requis pour un particulier, ou nom de société pour une entreprise",
    path: ['first_name'],
  }
)

export type TenantFormValues = z.infer<typeof tenantSchema>
export type TenantEmploymentFormValues = z.infer<typeof tenantEmploymentSchema>
export type TenantReferenceFormValues = z.infer<typeof tenantReferenceSchema>
export type TenantGuarantorFormValues = z.infer<typeof tenantGuarantorSchema>
