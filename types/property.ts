import type { BaseEntity } from "./common";

export type PropertyType = "residential" | "commercial" | "industrial" | "mixed";
export type PropertyStatus = "available" | "rented" | "maintenance" | "sold";

export interface Property extends BaseEntity {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  type: PropertyType;
  surface: number;
  rooms?: number;
  bathrooms?: number;
  estimated_value: number;
  purchase_price?: number;
  purchase_date?: string;
  status: PropertyStatus;
  description?: string;
  features?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyYield {
  property_id: string;
  annual_rent: number;
  annual_charges: number;
  gross_yield: number;
  net_yield: number;
  occupancy_rate: number;
}

export interface CreatePropertyRequest {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  type: PropertyType;
  surface: number;
  rooms?: number;
  bathrooms?: number;
  estimated_value: number;
  purchase_price?: number;
  purchase_date?: string;
  description?: string;
  features?: string[];
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  status?: PropertyStatus;
}
