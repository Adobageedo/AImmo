export interface DashboardKPIs {
  financial: FinancialKPIs;
  operational: OperationalKPIs;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface FinancialKPIs {
  portfolio_value: number;
  total_rent_collected: number;
  average_gross_yield: number;
  average_net_yield: number;
  total_charges: number;
  cashflow?: number;
}

export interface OperationalKPIs {
  total_properties: number;
  occupied_properties: number;
  vacant_properties: number;
  occupancy_rate: number;
  vacancy_rate: number;
  active_leases: number;
  overdue_payments: number;
  overdue_amount: number;
}

export interface RevenueChartData {
  period: string;
  collected: number;
  pending: number;
  overdue: number;
}

export interface GeographicDistribution {
  city: string;
  count: number;
  total_value: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
  property_ids?: string[];
  city?: string;
  region?: string;
  country?: string;
  property_type?: string;
}
