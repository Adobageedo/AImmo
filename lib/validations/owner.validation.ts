import { z } from "zod"

export const ownerSchema = z.object({
  // Personal Information
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  date_of_birth: z.string().optional(),
  place_of_birth: z.string().optional(),
  nationality: z.string().optional(),
  
  // Address
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  postal_code: z.string().min(4, "Code postal invalide"),
  country: z.string().min(2, "Pays invalide"),
  
  // Preferences
  preferred_contact_method: z.enum(['email', 'phone', 'sms', 'mail']).optional(),
  preferred_language: z.enum(['fr', 'en']).optional(),
  
  notes: z.string().optional(),
})

export type OwnerFormValues = z.infer<typeof ownerSchema>
