import { z } from "zod";

export const propertySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"),
  postal_code: z.string().min(1, "Le code postal est requis"),
  country: z.string().min(1, "Le pays est requis"),
  type: z.enum(["residential", "commercial", "industrial", "mixed"]),
  surface: z.number().min(1, "La surface doit être positive"),
  rooms: z.number().optional(),
  bathrooms: z.number().optional(),
  estimated_value: z.number().min(0, "La valeur doit être positive"),
  purchase_price: z.number().optional(),
  purchase_date: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export const updatePropertySchema = propertySchema.partial().extend({
  status: z.enum(["available", "rented", "maintenance", "sold"]).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
export type UpdatePropertyFormData = z.infer<typeof updatePropertySchema>;
