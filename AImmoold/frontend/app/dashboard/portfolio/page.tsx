"use client"

// Dashboard Portfolio Page - Phase 7: Portfolio Dashboard MVP
// Vue macro PowerBI-like pour direction / investisseurs

import { useMemo } from "react"
import {
    Building2,
    Users,
    FileText,
    TrendingUp,
    Percent,
    Euro,
    Home,
    AlertTriangle,
    RefreshCw,
    LayoutDashboard,
} from "lucide-react"
import { useDashboard } from "@/lib/hooks/use-dashboard"
import {
    KpiCard,
    Chart,
    ProgressRing,
    GeoMap,
    DashboardFiltersBar,
} from "@/components/dashboard"
import {
    formatCurrency,
    formatPercentage,
    formatSurface,
} from "@/lib/dashboardCalculations"
import "./dashboard.css"

export default function PortfolioDashboardPage() {
    const {
        kpis,
        properties,
        isLoading,
        error,
        lastRefresh,
        summary,
        propertyTypeChart,
        tenantTypeChart,
        citiesData,
        occupancyChart,
        refresh,
        setFilters,
        filters,
    } = useDashboard({ autoRefresh: true, refreshInterval: 300000 })

    // Extract unique values for filters
    const uniquePropertyTypes = useMemo(() => {
        return [...new Set(properties.map((p) => p.propertyType))].filter(Boolean)
    }, [properties])

    const uniqueCities = useMemo(() => {
        return [...new Set(properties.map((p) => p.city))].filter(Boolean).sort()
    }, [properties])

    // Loading state
    if (isLoading && !kpis) {
        return (
            <div className="dashboard">
                <div className="dashboard__loading">
                    <div className="dashboard__loading-spinner" />
                    <p className="dashboard__loading-text">
                        Chargement du tableau de bord...
                    </p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="dashboard">
                <div className="dashboard__error">
                    <AlertTriangle className="dashboard__error-icon" />
                    <h3 className="dashboard__error-title">Erreur de chargement</h3>
                    <p className="dashboard__error-message">{error}</p>
                    <button className="dashboard__error-retry" onClick={refresh}>
                        Réessayer
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard__header">
                <div>
                    <h1 className="dashboard__title">
                        <LayoutDashboard className="dashboard__title-icon" />
                        Dashboard Portefeuille
                    </h1>
                    <p className="dashboard__subtitle">
                        Vue d'ensemble de votre patrimoine immobilier
                        {lastRefresh && (
                            <span>
                                {" "}
                                • Mis à jour le{" "}
                                {new Date(lastRefresh).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        )}
                    </p>
                </div>
                <div className="dashboard__actions">
                    <button
                        className={`dashboard__refresh-btn ${isLoading ? "dashboard__refresh-btn--loading" : ""
                            }`}
                        onClick={refresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className="dashboard__refresh-icon" />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Filters */}
            <DashboardFiltersBar
                filters={filters}
                onFilterChange={setFilters}
                propertyTypes={uniquePropertyTypes}
                cities={uniqueCities}
            />

            {/* Summary Banner */}
            {summary && (
                <div className="dashboard__summary">
                    <div className="dashboard__summary-item">
                        <div className="dashboard__summary-value">
                            {formatCurrency(summary.portfolioValue)}
                        </div>
                        <div className="dashboard__summary-label">Valeur du portefeuille</div>
                    </div>
                    <div className="dashboard__summary-item">
                        <div className="dashboard__summary-value">
                            {formatCurrency(summary.annualRevenue)}
                        </div>
                        <div className="dashboard__summary-label">Revenus annuels</div>
                    </div>
                    <div className="dashboard__summary-item">
                        <div className="dashboard__summary-value">
                            {formatPercentage(summary.averageOccupancy, 1)}
                        </div>
                        <div className="dashboard__summary-label">Taux d'occupation</div>
                    </div>
                    <div className="dashboard__summary-item">
                        <div className="dashboard__summary-value">
                            {summary.performanceScore}/100
                        </div>
                        <div className="dashboard__summary-label">Score de performance</div>
                    </div>
                </div>
            )}

            {/* Main KPIs Grid */}
            <div className="dashboard__kpi-grid">
                <KpiCard
                    title="Propriétés"
                    value={kpis?.totalProperties || 0}
                    description={formatSurface(kpis?.totalSurfaceArea || 0)}
                    icon={Building2}
                    variant="default"
                    href="/dashboard/properties"
                />
                <KpiCard
                    title="Taux d'occupation"
                    value={formatPercentage(kpis?.occupancyRate || 0, 1)}
                    description={`${kpis?.occupiedUnits || 0} occupé(s) / ${kpis?.vacantUnits || 0
                        } vacant(s)`}
                    icon={Percent}
                    variant={
                        (kpis?.occupancyRate || 0) >= 80
                            ? "success"
                            : (kpis?.occupancyRate || 0) >= 50
                                ? "warning"
                                : "danger"
                    }
                />
                <KpiCard
                    title="Loyers mensuels"
                    value={formatCurrency(kpis?.totalMonthlyRent || 0)}
                    description={`${formatCurrency(
                        kpis?.averageRentPerSqm || 0
                    )}/m² en moyenne`}
                    icon={Euro}
                    variant="highlight"
                />
                <KpiCard
                    title="Rendement brut"
                    value={formatPercentage(kpis?.grossYield || 0, 2)}
                    description="Rendement annuel"
                    icon={TrendingUp}
                    variant={
                        (kpis?.grossYield || 0) >= 5
                            ? "success"
                            : (kpis?.grossYield || 0) >= 3
                                ? "warning"
                                : "danger"
                    }
                />
            </div>

            {/* Secondary KPIs */}
            <div className="dashboard__kpi-grid">
                <KpiCard
                    title="Locataires"
                    value={kpis?.totalTenants || 0}
                    description="Locataires actifs"
                    icon={Users}
                    href="/dashboard/tenants"
                />
                <KpiCard
                    title="Baux actifs"
                    value={kpis?.activeLeases || 0}
                    description={`${kpis?.expiringSoonLeases || 0} expire(nt) bientôt`}
                    icon={FileText}
                    variant={
                        (kpis?.expiringSoonLeases || 0) > 0 ? "warning" : "default"
                    }
                    href="/dashboard/leases"
                />
                <KpiCard
                    title="Documents"
                    value={kpis?.totalDocuments || 0}
                    description="Fichiers stockés"
                    icon={FileText}
                    href="/dashboard/documents"
                />
                <KpiCard
                    title="Valeur estimée"
                    value={formatCurrency(kpis?.totalEstimatedValue || 0)}
                    description="Patrimoine total"
                    icon={Home}
                    variant="highlight"
                />
            </div>

            {/* Charts Section */}
            <div className="dashboard__section">
                <div className="dashboard__section-header">
                    <h2 className="dashboard__section-title">Analyse du portefeuille</h2>
                </div>

                <div className="dashboard__charts-grid">
                    {/* Occupancy Doughnut */}
                    <div className="dashboard__chart">
                        <h3 className="dashboard__chart-title">Taux d'occupation</h3>
                        <div
                            className="dashboard__chart-container"
                            style={{
                                height: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ProgressRing
                                value={Math.round(kpis?.occupancyRate || 0)}
                                size={160}
                                strokeWidth={14}
                                color={
                                    (kpis?.occupancyRate || 0) >= 80
                                        ? "#10b981"
                                        : (kpis?.occupancyRate || 0) >= 50
                                            ? "#f59e0b"
                                            : "#ef4444"
                                }
                                label="Occupé"
                            />
                        </div>
                        <div className="dashboard__chart-legend">
                            {occupancyChart.map((item, index) => (
                                <div key={index} className="dashboard__chart-legend-item">
                                    <span
                                        className="dashboard__chart-legend-color"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="dashboard__chart-legend-label">
                                        {item.label}
                                    </span>
                                    <span className="dashboard__chart-legend-value">
                                        {item.value}
                                        <span className="dashboard__chart-legend-percentage">
                                            ({item.percentage}%)
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Property Types Bar Chart */}
                    <Chart
                        type="bar"
                        data={propertyTypeChart}
                        title="Répartition par type de bien"
                        height={250}
                        showLegend={false}
                        animated
                    />
                </div>
            </div>

            {/* Geographic Distribution */}
            <div className="dashboard__section">
                <div className="dashboard__section-header">
                    <h2 className="dashboard__section-title">Répartition géographique</h2>
                </div>

                <GeoMap properties={properties} regions={citiesData} />
            </div>

            {/* Tenant Analysis */}
            {tenantTypeChart.length > 0 && (
                <div className="dashboard__section">
                    <div className="dashboard__section-header">
                        <h2 className="dashboard__section-title">Analyse des locataires</h2>
                    </div>

                    <div className="dashboard__charts-grid--3-col">
                        <Chart
                            type="doughnut"
                            data={tenantTypeChart}
                            title="Type de locataires"
                            height={200}
                            animated
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
