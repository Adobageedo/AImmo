"""
Dashboard API Endpoints - Phase 7: Portfolio Dashboard MVP
Provides KPI aggregations and portfolio overview data
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from decimal import Decimal
from collections import defaultdict

from app.core.supabase import get_supabase_client
from app.schemas.dashboard import (
    DashboardKPIs,
    DashboardResponse,
    DashboardSummary,
    PropertyLocation,
    GeoRegion,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def calculate_occupancy_rate(occupied: int, total: int) -> Decimal:
    """Calculate occupancy rate as percentage"""
    if total == 0:
        return Decimal("0")
    return round(Decimal(occupied) / Decimal(total) * 100, 2)


def calculate_gross_yield(annual_rent: Decimal, property_value: Decimal) -> Decimal:
    """Calculate gross rental yield"""
    if property_value == 0:
        return Decimal("0")
    return round(annual_rent / property_value * 100, 2)


def calculate_performance_score(
    occupancy_rate: Decimal, gross_yield: Decimal, expiring_ratio: Decimal
) -> Decimal:
    """Calculate portfolio performance score (0-100)"""
    # Weights
    occupancy_weight = Decimal("0.4")
    yield_weight = Decimal("0.35")
    stability_weight = Decimal("0.25")

    # Normalize yield (target 5-10%, cap at 15%)
    yield_score = min(gross_yield / 10 * 100, Decimal("100"))

    # Stability score
    stability_score = max(Decimal("0"), 100 - expiring_ratio * 100)

    total_score = (
        occupancy_rate * occupancy_weight
        + yield_score * yield_weight
        + stability_score * stability_weight
    )

    return round(total_score, 2)


@router.get("/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis(
    organization_id: UUID = Query(..., description="Organization ID"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    city: Optional[str] = Query(None, description="Filter by city"),
):
    """
    Get KPI aggregations for the portfolio dashboard.
    Returns all key metrics for properties, leases, tenants, and documents.
    """
    supabase = get_supabase_client()
    now = datetime.utcnow()
    ninety_days_later = now + timedelta(days=90)

    try:
        # Fetch properties
        properties_query = supabase.table("properties").select("*").eq(
            "organization_id", str(organization_id)
        )
        if property_type:
            properties_query = properties_query.eq("property_type", property_type)
        if city:
            properties_query = properties_query.eq("city", city)
        properties_result = properties_query.execute()
        properties = properties_result.data or []

        # Fetch leases
        leases_result = (
            supabase.table("leases")
            .select("*")
            .eq("organization_id", str(organization_id))
            .execute()
        )
        leases = leases_result.data or []

        # Fetch tenants
        tenants_result = (
            supabase.table("tenants")
            .select("*")
            .eq("organization_id", str(organization_id))
            .execute()
        )
        tenants = tenants_result.data or []

        # Fetch documents
        documents_result = (
            supabase.table("documents")
            .select("*")
            .eq("organization_id", str(organization_id))
            .execute()
        )
        documents = documents_result.data or []

        # Calculate lease metrics
        active_leases = []
        expiring_soon_leases = []
        expired_leases = []

        for lease in leases:
            end_date = lease.get("end_date")
            if end_date:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                if end_dt.replace(tzinfo=None) <= now:
                    expired_leases.append(lease)
                elif end_dt.replace(tzinfo=None) <= ninety_days_later:
                    expiring_soon_leases.append(lease)
                    active_leases.append(lease)
                else:
                    active_leases.append(lease)
            else:
                # No end date = ongoing lease
                active_leases.append(lease)

        # Calculate occupied properties
        occupied_property_ids = set(l["property_id"] for l in active_leases)

        # Filter properties if needed based on city/type
        property_ids = set(p["id"] for p in properties)

        # Calculate totals
        total_monthly_rent = sum(
            Decimal(str(l.get("monthly_rent", 0) or 0))
            for l in active_leases
            if l["property_id"] in property_ids
        )
        total_charges = sum(
            Decimal(str(l.get("charges", 0) or 0))
            for l in active_leases
            if l["property_id"] in property_ids
        )
        total_deposits = sum(
            Decimal(str(l.get("deposit", 0) or 0))
            for l in active_leases
            if l["property_id"] in property_ids
        )
        total_surface_area = sum(
            Decimal(str(p.get("surface_area", 0) or 0)) for p in properties
        )
        total_estimated_value = sum(
            Decimal(str(p.get("estimated_value", 0) or 0)) for p in properties
        )

        # Group by type
        properties_by_type = defaultdict(int)
        for p in properties:
            properties_by_type[p.get("property_type", "other")] += 1

        tenants_by_type = defaultdict(int)
        for t in tenants:
            tenants_by_type[t.get("tenant_type", "individual")] += 1

        documents_by_type = defaultdict(int)
        for d in documents:
            documents_by_type[d.get("document_type", "autre")] += 1

        # Calculate rates
        occupied_units = len(occupied_property_ids.intersection(property_ids))
        vacant_units = len(properties) - occupied_units
        occupancy_rate = calculate_occupancy_rate(occupied_units, len(properties))
        vacancy_rate = Decimal("100") - occupancy_rate

        # Calculate average rent per sqm
        avg_rent_per_sqm = Decimal("0")
        if total_surface_area > 0:
            avg_rent_per_sqm = round(total_monthly_rent / total_surface_area, 2)

        # Calculate gross yield
        annual_rent = total_monthly_rent * 12
        gross_yield = calculate_gross_yield(annual_rent, total_estimated_value)

        return DashboardKPIs(
            total_properties=len(properties),
            properties_by_type=dict(properties_by_type),
            total_surface_area=total_surface_area,
            total_estimated_value=total_estimated_value,
            occupancy_rate=occupancy_rate,
            vacancy_rate=vacancy_rate,
            occupied_units=occupied_units,
            vacant_units=vacant_units,
            total_monthly_rent=total_monthly_rent,
            total_annual_rent=annual_rent,
            total_charges=total_charges,
            total_deposits=total_deposits,
            average_rent_per_sqm=avg_rent_per_sqm,
            gross_yield=gross_yield,
            total_tenants=len(tenants),
            tenants_by_type=dict(tenants_by_type),
            total_leases=len(leases),
            active_leases=len(active_leases),
            expiring_soon_leases=len(expiring_soon_leases),
            expired_leases=len(expired_leases),
            total_documents=len(documents),
            documents_by_type=dict(documents_by_type),
            last_updated=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KPIs: {str(e)}")


@router.get("/full", response_model=DashboardResponse)
async def get_full_dashboard(
    organization_id: UUID = Query(..., description="Organization ID"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    city: Optional[str] = Query(None, description="Filter by city"),
):
    """
    Get complete dashboard data including KPIs, properties, and geographic distribution.
    """
    supabase = get_supabase_client()

    try:
        # Get KPIs
        kpis = await get_dashboard_kpis(
            organization_id=organization_id,
            property_type=property_type,
            city=city,
        )

        # Fetch properties with filters
        properties_query = supabase.table("properties").select("*").eq(
            "organization_id", str(organization_id)
        )
        if property_type:
            properties_query = properties_query.eq("property_type", property_type)
        if city:
            properties_query = properties_query.eq("city", city)
        properties_result = properties_query.execute()
        properties_data = properties_result.data or []

        # Fetch active leases to determine occupancy
        leases_result = (
            supabase.table("leases")
            .select("*")
            .eq("organization_id", str(organization_id))
            .execute()
        )
        leases = leases_result.data or []

        now = datetime.utcnow()
        active_lease_property_ids = set()
        for lease in leases:
            end_date = lease.get("end_date")
            if not end_date:
                active_lease_property_ids.add(lease["property_id"])
            else:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                if end_dt.replace(tzinfo=None) > now:
                    active_lease_property_ids.add(lease["property_id"])

        # Build property locations
        property_locations = []
        for p in properties_data:
            occupancy_status = (
                "occupied" if p["id"] in active_lease_property_ids else "vacant"
            )

            # Find monthly rent for this property
            monthly_rent = None
            for l in leases:
                if l["property_id"] == p["id"]:
                    monthly_rent = Decimal(str(l.get("monthly_rent", 0) or 0))
                    break

            property_locations.append(
                PropertyLocation(
                    id=p["id"],
                    name=p["name"],
                    address=p["address"],
                    city=p["city"],
                    postal_code=p["postal_code"],
                    country=p["country"],
                    property_type=p["property_type"],
                    surface_area=(
                        Decimal(str(p["surface_area"]))
                        if p.get("surface_area")
                        else None
                    ),
                    estimated_value=(
                        Decimal(str(p["estimated_value"]))
                        if p.get("estimated_value")
                        else None
                    ),
                    occupancy_status=occupancy_status,
                    monthly_rent=monthly_rent,
                )
            )

        # Group by city for regions
        city_data = defaultdict(list)
        for p in property_locations:
            city_data[p.city].append(p)

        regions = []
        for city_name, city_props in city_data.items():
            occupied_count = sum(1 for p in city_props if p.occupancy_status == "occupied")
            total_value = sum(p.estimated_value or Decimal("0") for p in city_props)
            occupancy_rate = calculate_occupancy_rate(occupied_count, len(city_props))

            regions.append(
                GeoRegion(
                    name=city_name,
                    property_count=len(city_props),
                    total_value=total_value,
                    occupancy_rate=occupancy_rate,
                )
            )

        # Sort regions by property count
        regions.sort(key=lambda r: r.property_count, reverse=True)

        # Calculate summary
        expiring_ratio = Decimal("0")
        if kpis.total_leases > 0:
            expiring_ratio = Decimal(kpis.expiring_soon_leases) / Decimal(
                kpis.total_leases
            )

        performance_score = calculate_performance_score(
            kpis.occupancy_rate, kpis.gross_yield, expiring_ratio
        )

        summary = DashboardSummary(
            portfolio_value=kpis.total_estimated_value,
            annual_revenue=kpis.total_annual_rent,
            average_occupancy=kpis.occupancy_rate,
            performance_score=performance_score,
        )

        return DashboardResponse(
            kpis=kpis,
            properties=property_locations,
            summary=summary,
            regions=regions,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching dashboard: {str(e)}"
        )


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    organization_id: UUID = Query(..., description="Organization ID"),
):
    """
    Get quick summary metrics for the dashboard header.
    Lightweight endpoint for fast loading.
    """
    kpis = await get_dashboard_kpis(organization_id=organization_id)

    expiring_ratio = Decimal("0")
    if kpis.total_leases > 0:
        expiring_ratio = Decimal(kpis.expiring_soon_leases) / Decimal(kpis.total_leases)

    performance_score = calculate_performance_score(
        kpis.occupancy_rate, kpis.gross_yield, expiring_ratio
    )

    return DashboardSummary(
        portfolio_value=kpis.total_estimated_value,
        annual_revenue=kpis.total_annual_rent,
        average_occupancy=kpis.occupancy_rate,
        performance_score=performance_score,
    )
