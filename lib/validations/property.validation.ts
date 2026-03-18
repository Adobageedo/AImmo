import { z } from "zod"

export const propertySchema = z.object({
  // Basic information
  name: z.string().min(1, "Le nom de la propriété est requis"),
  type: z.enum(['residential', 'commercial', 'industrial', 'mixed']),
  status: z.enum(['available', 'rented', 'maintenance', 'sold']),
  
  // Address
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postal_code: z.string().min(1, "Le code postal est requis"),
  country: z.string().min(1, "Le pays est requis"),
  
  // Property details
  surface: z.number().positive("La surface doit être positive"),
  rooms: z.number().int().positive("Le nombre de pièces doit être positif"),
  bathrooms: z.number().int().min(0, "Le nombre de salles de bain doit être positif ou nul"),
  
  // Financial information
  estimated_value: z.number().positive("La valeur estimée doit être positive"),
  purchase_price: z.number().positive("Le prix d'achat doit être positif"),
  purchase_date: z.string().min(1, "La date d'achat est requise"),
  
  // Additional information
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>
