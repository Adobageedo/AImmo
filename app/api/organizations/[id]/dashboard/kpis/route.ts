import { NextResponse } from "next/server";

export async function GET() {
  const mockKPIs = {
    financial: {
      portfolio_value: 1500000,
      total_rent_collected: 45000,
      average_gross_yield: 5.2,
      average_net_yield: 4.1,
      total_charges: 8500,
      cashflow: 36500,
    },
    operational: {
      total_properties: 0,
      occupied_properties: 0,
      vacant_properties: 0,
      occupancy_rate: 0,
      vacancy_rate: 0,
      active_leases: 0,
      overdue_payments: 0,
      overdue_amount: 0,
    },
    period: {
      start_date: new Date(new Date().getFullYear(), 0, 1).toISOString(),
      end_date: new Date().toISOString(),
    },
  };

  return NextResponse.json(mockKPIs);
}
