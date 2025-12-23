/**
 * Lease Detail Page
 * Phase 6 - Business UI Foundation
 */

"use client"

import React, { useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
    FileText,
    Calendar,
    Euro,
    Building2,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Shield,
    Banknote,
} from "lucide-react"
import { EntityDetail } from "@/components/entity"
import { Badge } from "@/components/ui/badge"
import { useLeases } from "@/lib/hooks/use-leases"
import type { Lease, LeasePayment } from "@/lib/types/entity"

export default function LeaseDetailPage() {
    const router = useRouter()
    const params = useParams()
    const leaseId = params.id as string

    const {
        selectedItem: lease,
        loadingItem: loading,
        error,
        loadItem,
        deleteItem,
        payments,
        loadingPayments,
        loadPayments,
        getStatusInfo,
        getTypeLabel,
        getPaymentStatusInfo,
        formatPeriod,
        formatMonthlyTotal,
        isExpiringSoon,
        getRemainingMonths,
    } = useLeases({ autoLoad: false })

    // Load lease on mount
    useEffect(() => {
        if (leaseId) {
            loadItem(leaseId)
            loadPayments(leaseId)
        }
    }, [leaseId, loadItem, loadPayments])

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (!lease) return

        const confirmed = window.confirm(
            `Êtes-vous sûr de vouloir supprimer ce bail ? Cette action est irréversible.`
        )

        if (confirmed) {
            const success = await deleteItem(lease.id)
            if (success) {
                router.push("/dashboard/leases")
            }
        }
    }, [lease, deleteItem, router])

    // Format currency
    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return "Non renseigné"
        return new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
        }).format(amount)
    }

    // Format date
    const formatDate = (date?: string) => {
        if (!date) return "Non renseignée"
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
    }

    if (!lease && !loading && !error) {
        return null
    }

    const status = lease ? getStatusInfo(lease.status) : null
    const remainingMonths = lease ? getRemainingMonths(lease) : null
    const expiringSoon = lease ? isExpiringSoon(lease) : false

    // Build contract info items
    const buildContractInfo = (l: Lease) => [
        { label: "Référence", value: l.reference, highlight: true },
        { label: "Type de bail", value: getTypeLabel(l.lease_type) },
        { label: "Durée", value: `${l.duration_months} mois` },
        { label: "Date de début", value: formatDate(l.start_date) },
        { label: "Date de fin", value: formatDate(l.end_date), empty: !l.end_date },
        { label: "Mois restants", value: remainingMonths !== null ? `${remainingMonths} mois` : "Indéterminée" },
    ]

    // Build financial info items
    const buildFinancialInfo = (l: Lease) => [
        { label: "Loyer mensuel", value: formatCurrency(l.rent_amount), highlight: true },
        { label: "Charges mensuelles", value: formatCurrency(l.charges_amount) },
        { label: "Total mensuel", value: formatCurrency(l.rent_amount + l.charges_amount), highlight: true },
        { label: "Dépôt de garantie", value: formatCurrency(l.deposit_amount) },
        { label: "Dépôt versé", value: l.deposit_paid ? "Oui" : "Non" },
        { label: "Fréquence de paiement", value: l.payment_frequency === "monthly" ? "Mensuel" : l.payment_frequency === "quarterly" ? "Trimestriel" : "Annuel" },
        { label: "Jour de paiement", value: `Le ${l.payment_day} du mois` },
    ]

    // Build revision info
    const buildRevisionInfo = (l: Lease) => {
        if (!l.rent_revision_date && !l.rent_revision_index) return []
        return [
            { label: "Date de révision", value: formatDate(l.rent_revision_date), empty: !l.rent_revision_date },
            { label: "Indice de révision", value: l.rent_revision_index || undefined, empty: !l.rent_revision_index },
        ]
    }

    // Build insurance info
    const buildInsuranceInfo = (l: Lease) => [
        { label: "Assurance requise", value: l.insurance_required ? "Oui" : "Non" },
        { label: "Assurance fournie", value: l.insurance_provided ? "Oui" : "Non" },
    ]

    // Build timeline from payments
    const buildTimeline = (paymentList: LeasePayment[]) => {
        return paymentList.slice(0, 10).map(p => ({
            id: p.id,
            title: `${formatCurrency(p.paid_amount)} sur ${formatCurrency(p.total_amount)}`,
            date: formatDate(p.payment_date || p.due_date),
            description: `Période: ${formatDate(p.period_start)} - ${formatDate(p.period_end)}`,
            variant: (p.status === "paid" ? "success" :
                p.status === "late" || p.status === "unpaid" ? "error" :
                    "default") as "success" | "error" | "default",
        }))
    }

    return (
        <EntityDetail
            title={lease?.reference || `Bail ${leaseId.slice(0, 8)}`}
            subtitle={lease ? formatPeriod(lease) : undefined}
            icon={FileText}
            status={status || undefined}
            badges={lease ? [
                { label: getTypeLabel(lease.lease_type), variant: "secondary" as const },
                ...(expiringSoon ? [{ label: `Expire dans ${remainingMonths} mois`, variant: "warning" as const }] : []),
                ...(lease.payment_status ? [{
                    label: getPaymentStatusInfo(lease.payment_status).label,
                    variant: getPaymentStatusInfo(lease.payment_status).variant
                }] : []),
            ] : []}
            meta={lease ? [
                { icon: Euro, value: formatMonthlyTotal(lease) },
                { icon: Calendar, value: formatPeriod(lease) },
            ] : []}

            backHref="/dashboard/leases"
            backLabel="Baux"

            editHref={lease ? `/dashboard/leases/${lease.id}/edit` : undefined}
            onDelete={lease ? handleDelete : undefined}

            loading={loading}
            error={error}
            createdAt={lease?.created_at}
            updatedAt={lease?.updated_at}

            stats={lease ? [
                {
                    label: "Loyer mensuel",
                    value: formatCurrency(lease.rent_amount),
                    icon: Euro,
                    variant: "highlight",
                },
                {
                    label: "Total mensuel",
                    value: formatCurrency(lease.rent_amount + lease.charges_amount),
                    icon: Banknote,
                    variant: "default",
                },
                {
                    label: "Dépôt de garantie",
                    value: formatCurrency(lease.deposit_amount),
                    icon: Shield,
                    variant: lease.deposit_paid ? "success" : "warning",
                },
                ...(lease.total_collected !== undefined ? [{
                    label: "Total encaissé",
                    value: formatCurrency(lease.total_collected),
                    icon: CreditCard,
                    variant: "success" as const,
                }] : []),
                ...(lease.outstanding_amount && lease.outstanding_amount > 0 ? [{
                    label: "Impayés",
                    value: formatCurrency(lease.outstanding_amount),
                    icon: AlertCircle,
                    variant: "error" as const,
                }] : []),
            ] : []}

            sections={lease ? [
                {
                    id: "contract",
                    title: "Informations du contrat",
                    icon: FileText,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildContractInfo(lease).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className={`${item.highlight ? "font-semibold text-indigo-600" : "text-gray-900"} ${item.empty ? "text-gray-400 italic font-normal" : ""}`}>
                                        {item.empty ? "Non renseigné" : item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                },
                {
                    id: "financial",
                    title: "Données financières",
                    icon: Euro,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildFinancialInfo(lease).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className={`${item.highlight ? "font-semibold text-indigo-600" : "text-gray-900"}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                },
                ...(buildRevisionInfo(lease).length > 0 ? [{
                    id: "revision",
                    title: "Révision du loyer",
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildRevisionInfo(lease).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className={`text-gray-900 ${item.empty ? "text-gray-400 italic" : ""}`}>
                                        {item.empty ? "Non renseigné" : item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ),
                }] : []),
                {
                    id: "insurance",
                    title: "Assurance",
                    icon: Shield,
                    content: (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildInsuranceInfo(lease).map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-500 mb-1">{item.label}</span>
                                    <span className="text-gray-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    ),
                },
                ...(lease.special_clauses ? [{
                    id: "clauses",
                    title: "Clauses particulières",
                    content: (
                        <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                            {lease.special_clauses}
                        </div>
                    ),
                }] : []),
                ...(lease.notes ? [{
                    id: "notes",
                    title: "Notes",
                    content: (
                        <div className="prose prose-sm max-w-none text-gray-600">
                            {lease.notes}
                        </div>
                    ),
                }] : []),
            ] : []}

            relatedItems={lease ? [
                {
                    id: "property",
                    title: lease.property?.name || "Propriété",
                    subtitle: "Voir la propriété",
                    icon: Building2,
                    href: `/dashboard/properties/${lease.property_id}`,
                },
                {
                    id: "tenant",
                    title: lease.tenant
                        ? (lease.tenant.company_name || `${lease.tenant.first_name} ${lease.tenant.last_name}`)
                        : "Locataire",
                    subtitle: "Voir le locataire",
                    icon: Users,
                    href: `/dashboard/tenants/${lease.tenant_id}`,
                },
            ] : []}

            timeline={payments.length > 0 ? buildTimeline(payments) : undefined}

            documents={[]}
            onAddDocument={() => router.push(`/dashboard/documents?lease_id=${leaseId}`)}
        >
            {/* Payment status summary */}
            {lease && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-semibold text-gray-900">Statut des paiements</h3>
                        <button
                            onClick={() => router.push(`/dashboard/leases/${lease.id}/payments`)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Voir tous les paiements
                        </button>
                    </div>
                    <div className="p-6">
                        {loadingPayments ? (
                            <div className="text-center py-4 text-gray-500">
                                Chargement des paiements...
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>Aucun paiement enregistré</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {payments.slice(0, 5).map(payment => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                                    >
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Échéance: {formatDate(payment.due_date)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(payment.paid_amount)} / {formatCurrency(payment.total_amount)}
                                            </div>
                                            <Badge variant={getPaymentStatusInfo(payment.status).variant}>
                                                {getPaymentStatusInfo(payment.status).label}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </EntityDetail>
    )
}
