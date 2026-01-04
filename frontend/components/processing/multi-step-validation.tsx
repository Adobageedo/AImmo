"use client"

import { useState } from "react"
import {
    Building,
    Users,
    FileText,
    Check,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    AlertCircle,
    Calendar,
    Euro,
    MapPin,
    Maximize2,
    Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import type { ParsingResult, ExtractedParty } from "@/lib/types/parsing"
import { formatFieldValue } from "@/lib/llm-parser"

interface MultiStepValidationProps {
    isOpen: boolean
    onClose: () => void
    result: ParsingResult
    onFieldChange: (fieldName: string, value: any) => void
    onPartyChange: (index: number, party: any) => void
    onAddParty: (type: "landlord" | "tenant") => void
    onRemoveParty: (index: number) => void
    onValidate: (createEntities: boolean) => void
    loading?: boolean
}

const PROPERTY_TYPES = [
    { label: "Appartement", value: "apartment" },
    { label: "Maison", value: "house" },
    { label: "Studio", value: "studio" },
    { label: "Commercial", value: "commercial" },
    { label: "Parking", value: "parking" },
    { label: "Stockage", value: "storage" },
    { label: "Terrain", value: "land" },
    { label: "Autre", value: "other" },
]

type Step = "property" | "landlords" | "tenants" | "clauses"

export function MultiStepValidation({
    isOpen,
    onClose,
    result,
    onFieldChange,
    onPartyChange,
    onAddParty,
    onRemoveParty,
    onValidate,
    loading = false
}: MultiStepValidationProps) {
    const [currentStep, setCurrentStep] = useState<Step>("property")
    const [createEntities, setCreateEntities] = useState(true)

    const steps: { id: Step; label: string; icon: any }[] = [
        { id: "property", label: "Infos Bien", icon: Building },
        { id: "landlords", label: "Bailleurs", icon: Users },
        { id: "tenants", label: "Locataires", icon: Users },
        { id: "clauses", label: "Clauses", icon: FileText }
    ]

    const stepIndex = steps.findIndex(s => s.id === currentStep)
    const progress = ((stepIndex + 1) / steps.length) * 100

    const handleNext = () => {
        if (currentStep === "property") setCurrentStep("landlords")
        else if (currentStep === "landlords") setCurrentStep("tenants")
        else if (currentStep === "tenants") setCurrentStep("clauses")
    }

    const handleBack = () => {
        if (currentStep === "clauses") setCurrentStep("tenants")
        else if (currentStep === "tenants") setCurrentStep("landlords")
        else if (currentStep === "landlords") setCurrentStep("property")
    }

    const handleNumericChange = (fieldName: string, value: string) => {
        // Enforce numeric only + parseFloat
        const cleanValue = value.replace(/[^-0-9.]/g, '')
        if (cleanValue === '') {
            onFieldChange(fieldName, null)
        } else {
            onFieldChange(fieldName, parseFloat(cleanValue))
        }
    }

    const landlords = result.lease_data?.parties.filter(p => p.type === "landlord") || []
    const tenants = result.lease_data?.parties.filter(p => p.type === "tenant") || []

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50">
                <div className="flex flex-col h-full">
                    {/* Header with Stepper */}
                    <div className="bg-white border-b p-6 pb-4">
                        <DialogHeader className="mb-6 text-left">
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        Validation du Bail
                                    </DialogTitle>
                                    <DialogDescription>
                                        Vérifiez les données extraites par l'IA avant l'importation.
                                    </DialogDescription>
                                </div>
                                <Badge variant="outline" className="h-fit">
                                    {Math.round(result.overall_confidence * 100)}% de confiance
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="relative flex justify-between items-center w-full max-w-2xl mx-auto px-4">
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 -z-10" />
                            <div
                                className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 -z-10 transition-all duration-300"
                                style={{ width: `${((stepIndex) / (steps.length - 1)) * 100}%` }}
                            />

                            {steps.map((step, idx) => {
                                const Icon = step.icon
                                const isActive = currentStep === step.id
                                const isCompleted = stepIndex > idx

                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => (idx <= stepIndex || isCompleted) && setCurrentStep(step.id)}>
                                        <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-100 scale-110' :
                                                isCompleted ? 'bg-indigo-100 text-indigo-600' : 'bg-white border-2 border-slate-200 text-slate-400'}
                    `}>
                                            {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                        </div>
                                        <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-2xl mx-auto space-y-6">

                            {/* Step 1: Property Info */}
                            {currentStep === "property" && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                        <Building className="h-5 w-5 text-indigo-500" />
                                        Informations du bien et contrat
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <InputGroup label="Adresse du bien" icon={MapPin}>
                                                <Input
                                                    value={result.lease_data?.property_address || ""}
                                                    onChange={(e) => onFieldChange("property_address", e.target.value)}
                                                    placeholder="N°, rue, avenue..."
                                                    className="bg-white"
                                                />
                                            </InputGroup>
                                        </div>
                                        <InputGroup label="Code Postal" icon={MapPin}>
                                            <Input
                                                value={result.lease_data?.property_zip || ""}
                                                onChange={(e) => onFieldChange("property_zip", e.target.value)}
                                                placeholder="75000"
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Ville" icon={MapPin}>
                                            <Input
                                                value={result.lease_data?.property_city || ""}
                                                onChange={(e) => onFieldChange("property_city", e.target.value)}
                                                placeholder="Paris"
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Loyer mensuel (HC)" icon={Euro}>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={result.lease_data?.monthly_rent ?? ""}
                                                onChange={(e) => handleNumericChange("monthly_rent", e.target.value)}
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Effectif Charges" icon={Euro}>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={result.lease_data?.charges ?? ""}
                                                onChange={(e) => handleNumericChange("charges", e.target.value)}
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Dépôt de garantie" icon={Euro}>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={result.lease_data?.deposit ?? ""}
                                                onChange={(e) => handleNumericChange("deposit", e.target.value)}
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Surface (m²)" icon={Maximize2}>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                value={result.lease_data?.surface_area ?? ""}
                                                onChange={(e) => handleNumericChange("surface_area", e.target.value)}
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Type de bien" icon={Building}>
                                            <Select
                                                value={result.lease_data?.property_type || "apartment"}
                                                onValueChange={(val) => onFieldChange("property_type", val)}
                                            >
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Choisir un type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PROPERTY_TYPES.map((type) => (
                                                        <SelectItem key={type.value} value={type.value}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </InputGroup>
                                        <InputGroup label="Date d'effet" icon={Calendar}>
                                            <Input
                                                type="date"
                                                value={result.lease_data?.start_date || ""}
                                                onChange={(e) => onFieldChange("start_date", e.target.value)}
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        <InputGroup label="Date de fin" icon={Calendar}>
                                            <Input
                                                type="date"
                                                value={result.lease_data?.end_date || ""}
                                                onChange={(e) => onFieldChange("end_date", e.target.value)}
                                                className="bg-white"
                                            />
                                        </InputGroup>
                                        
                                        {/* Informations supplémentaires du bien */}
                                        <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-200">
                                            <h4 className="text-md font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                                <Info className="h-4 w-4 text-indigo-500" />
                                                Informations complémentaires
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputGroup label="Année de construction" icon={Building}>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={result.lease_data?.construction_year ?? ""}
                                                        onChange={(e) => handleNumericChange("construction_year", e.target.value)}
                                                        placeholder="1990"
                                                        className="bg-white"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Dernière rénovation" icon={Building}>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={result.lease_data?.last_renovation_year ?? ""}
                                                        onChange={(e) => handleNumericChange("last_renovation_year", e.target.value)}
                                                        placeholder="2020"
                                                        className="bg-white"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Classe énergie (DPE)" icon={Info}>
                                                    <Input
                                                        value={result.lease_data?.energy_class || ""}
                                                        onChange={(e) => onFieldChange("energy_class", e.target.value.toUpperCase())}
                                                        placeholder="A, B, C, D, E, F, G"
                                                        maxLength={1}
                                                        className="bg-white uppercase"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Classe GES" icon={Info}>
                                                    <Input
                                                        value={result.lease_data?.ges_class || ""}
                                                        onChange={(e) => onFieldChange("ges_class", e.target.value.toUpperCase())}
                                                        placeholder="A, B, C, D, E, F, G"
                                                        maxLength={1}
                                                        className="bg-white uppercase"
                                                    />
                                                </InputGroup>
                                            </div>
                                        </div>

                                        {/* Données financières */}
                                        <div className="md:col-span-2 mt-6 pt-6 border-t border-slate-200">
                                            <h4 className="text-md font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                                <Euro className="h-4 w-4 text-indigo-500" />
                                                Données financières
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <InputGroup label="Prix d'achat" icon={Euro}>
                                                    <Input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={result.lease_data?.purchase_price ?? ""}
                                                        onChange={(e) => handleNumericChange("purchase_price", e.target.value)}
                                                        placeholder="250000"
                                                        className="bg-white"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Date d'achat" icon={Calendar}>
                                                    <Input
                                                        type="date"
                                                        value={result.lease_data?.purchase_date || ""}
                                                        onChange={(e) => onFieldChange("purchase_date", e.target.value)}
                                                        className="bg-white"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Valeur actuelle" icon={Euro}>
                                                    <Input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={result.lease_data?.current_value ?? ""}
                                                        onChange={(e) => handleNumericChange("current_value", e.target.value)}
                                                        placeholder="280000"
                                                        className="bg-white"
                                                    />
                                                </InputGroup>
                                                <InputGroup label="Taxe foncière annuelle" icon={Euro}>
                                                    <Input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={result.lease_data?.property_tax ?? ""}
                                                        onChange={(e) => handleNumericChange("property_tax", e.target.value)}
                                                        placeholder="1200"
                                                        className="bg-white"
                                                    />
                                                </InputGroup>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Landlords */}
                            {currentStep === "landlords" && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Users className="h-5 w-5 text-indigo-500" />
                                            Bailleurs (Propriétaires)
                                        </h3>
                                        <Button size="sm" variant="outline" onClick={() => onAddParty("landlord")}>
                                            <Plus className="h-4 w-4 mr-1" /> Ajouter
                                        </Button>
                                    </div>

                                    {landlords.length === 0 && (
                                        <div className="bg-white border-2 border-dashed rounded-lg p-8 text-center">
                                            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-500">Aucun bailleur trouvé. Ajoutez-en un manuellement.</p>
                                        </div>
                                    )}

                                    {landlords.map((landlord, idx) => {
                                        // Find actual index in original parties array
                                        const originalIndex = result.lease_data?.parties.findIndex(p => p === landlord) ?? -1
                                        return (
                                            <PartyCard
                                                key={idx}
                                                party={landlord}
                                                onUpdate={(p) => onPartyChange(originalIndex, p)}
                                                onRemove={() => onRemoveParty(originalIndex)}
                                            />
                                        )
                                    })}
                                </div>
                            )}

                            {/* Step 3: Tenants */}
                            {currentStep === "tenants" && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Users className="h-5 w-5 text-purple-500" />
                                            Locataires
                                        </h3>
                                        <Button size="sm" variant="outline" onClick={() => onAddParty("tenant")}>
                                            <Plus className="h-4 w-4 mr-1" /> Ajouter
                                        </Button>
                                    </div>

                                    {tenants.length === 0 && (
                                        <div className="bg-white border-2 border-dashed rounded-lg p-8 text-center">
                                            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-500">Aucun locataire trouvé. Ajoutez-en un manuellement.</p>
                                        </div>
                                    )}

                                    {tenants.map((tenant, idx) => {
                                        const originalIndex = result.lease_data?.parties.findIndex(p => p === tenant) ?? -1
                                        return (
                                            <PartyCard
                                                key={idx}
                                                party={tenant}
                                                onUpdate={(p) => onPartyChange(originalIndex, p)}
                                                onRemove={() => onRemoveParty(originalIndex)}
                                            />
                                        )
                                    })}
                                </div>
                            )}

                            {/* Step 4: Clauses (Disabled) */}
                            {currentStep === "clauses" && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Clauses Particulières</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">
                                        Cette fonctionnalité est en cours de développement. Les clauses seront bientôt validables séparément.
                                    </p>
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg flex items-start gap-3 text-left max-w-md mx-auto">
                                        <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-indigo-700">
                                            Vous pouvez valider le reste des informations maintenant. Les clauses extraites seront tout de même conservées dans l'historique.
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white border-t p-6">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="createSync"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={createEntities}
                                    onChange={(e) => setCreateEntities(e.target.checked)}
                                />
                                <label htmlFor="createSync" className="text-sm font-medium text-slate-600 cursor-pointer">
                                    Créer automatiquement les entités
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={handleBack} disabled={currentStep === "property"}>
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                                </Button>

                                {currentStep !== "clauses" ? (
                                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleNext}>
                                        Suivant <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white min-w-[140px]"
                                        onClick={() => onValidate(createEntities)}
                                        disabled={loading}
                                    >
                                        {loading ? "Chargement..." : "Terminer"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function InputGroup({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 px-1">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 ml-1">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                {label}
            </label>
            {children}
        </div>
    )
}

function PartyCard({ party, onUpdate, onRemove }: { party: ExtractedParty; onUpdate: (p: any) => void; onRemove: () => void }) {
    return (
        <Card className="bg-white border-slate-200 overflow-hidden group hover:border-indigo-200 transition-colors">
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nom Complet</label>
                                <Input
                                    value={party.name}
                                    onChange={(e) => onUpdate({ ...party, name: e.target.value })}
                                    placeholder="Nom du bailleur/locataire"
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email</label>
                                <Input
                                    value={party.email || ""}
                                    onChange={(e) => onUpdate({ ...party, email: e.target.value })}
                                    placeholder="Email de contact"
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Adresse</label>
                                <Input
                                    value={party.address || ""}
                                    onChange={(e) => onUpdate({ ...party, address: e.target.value })}
                                    placeholder="Adresse postale"
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 -mt-1 -mr-1"
                        onClick={onRemove}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
