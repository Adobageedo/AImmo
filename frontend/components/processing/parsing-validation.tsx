"use client"

import { useState } from "react"
import { Check, X, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import type {
    ParsingResult,
    FieldExtraction,
    ExtractedParty
} from "@/lib/types/parsing"
import {
    formatFieldValue,
    validateField,
    PARTY_TYPE_LABELS
} from "@/lib/llm-parser"
import {
    getConfidenceColor,
    getConfidenceLabel
} from "@/lib/ocr"
import styles from "@/styles/parsing.module.css"

interface ParsingValidationProps {
    result: ParsingResult
    onFieldChange: (fieldName: string, value: any) => void
    onPartyChange?: (index: number, party: ExtractedParty) => void
    onValidate: (createEntities: boolean) => void
    onCancel: () => void
    loading?: boolean
}

export function ParsingValidation({
    result,
    onFieldChange,
    onPartyChange,
    onValidate,
    onCancel,
    loading = false,
}: ParsingValidationProps) {
    const [expandedSections, setExpandedSections] = useState<string[]>(["fields", "parties"])
    const [createEntities, setCreateEntities] = useState(true)

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        )
    }

    return (
        <div className={styles["parsing-validation"]}>
            {/* Header */}
            <div className={styles["parsing-validation__header"]}>
                <h2 className={styles["parsing-validation__title"]}>
                    Validation des données extraites
                </h2>
                <div className={styles["parsing-validation__confidence"]}>
                    <span className={styles["parsing-validation__confidence-label"]}>
                        Confiance globale:
                    </span>
                    <Badge variant={result.overall_confidence > 0.7 ? "success" : "warning"}>
                        {Math.round(result.overall_confidence * 100)}%
                    </Badge>
                </div>
            </div>

            {/* Warning if low confidence */}
            {result.requires_review && (
                <Alert variant="warning" title="Vérification requise">
                    Certains champs ont une faible confiance. Veuillez vérifier les valeurs avant de valider.
                </Alert>
            )}

            {/* Fields Section */}
            <div className={styles["parsing-validation__section"]}>
                <button
                    className={styles["parsing-validation__section-header"]}
                    onClick={() => toggleSection("fields")}
                >
                    <span>Informations du bail</span>
                    {expandedSections.includes("fields") ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </button>

                {expandedSections.includes("fields") && (
                    <div className={styles["parsing-validation__fields"]}>
                        {result.fields.map((field) => (
                            <FieldRow
                                key={field.name}
                                field={field}
                                onChange={(value) => onFieldChange(field.name, value)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Parties Section */}
            {result.lease_data?.parties && result.lease_data.parties.length > 0 && (
                <div className={styles["parsing-validation__section"]}>
                    <button
                        className={styles["parsing-validation__section-header"]}
                        onClick={() => toggleSection("parties")}
                    >
                        <span>Parties ({result.lease_data.parties.length})</span>
                        {expandedSections.includes("parties") ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>

                    {expandedSections.includes("parties") && (
                        <div className={styles["parsing-validation__parties"]}>
                            {result.lease_data.parties.map((party, index) => (
                                <PartyCard
                                    key={index}
                                    party={party}
                                    onChange={onPartyChange ? (updatedParty) => onPartyChange(index, updatedParty) : undefined}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Special Clauses */}
            {result.lease_data?.special_clauses && result.lease_data.special_clauses.length > 0 && (
                <div className={styles["parsing-validation__section"]}>
                    <button
                        className={styles["parsing-validation__section-header"]}
                        onClick={() => toggleSection("clauses")}
                    >
                        <span>Clauses particulières ({result.lease_data.special_clauses.length})</span>
                        {expandedSections.includes("clauses") ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>

                    {expandedSections.includes("clauses") && (
                        <div className={styles["parsing-validation__clauses"]}>
                            {result.lease_data.special_clauses.map((clause, index) => (
                                <div key={index} className={styles["parsing-validation__clause"]}>
                                    {clause}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className={styles["parsing-validation__actions"]}>
                <label className={styles["parsing-validation__checkbox"]}>
                    <input
                        type="checkbox"
                        checked={createEntities}
                        onChange={(e) => setCreateEntities(e.target.checked)}
                    />
                    <span>Créer automatiquement les entités (propriété, locataire, bail)</span>
                </label>

                <div className={styles["parsing-validation__buttons"]}>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={() => onValidate(createEntities)}
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Validation...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Valider et enregistrer
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Individual field row component
function FieldRow({
    field,
    onChange
}: {
    field: FieldExtraction
    onChange: (value: any) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState(String(field.value ?? ""))
    const validationError = validateField(field)

    const handleSave = () => {
        onChange(editValue)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditValue(String(field.value ?? ""))
        setIsEditing(false)
    }

    return (
        <div className={styles["parsing-validation__field"]}>
            <div className={styles["parsing-validation__field-header"]}>
                <label className={styles["parsing-validation__field-label"]}>
                    {field.label}
                </label>
                <span className={`${styles["parsing-validation__field-confidence"]} ${getConfidenceColor(field.confidence_level)}`}>
                    {getConfidenceLabel(field.confidence_level)}
                </span>
            </div>

            {isEditing ? (
                <div className={styles["parsing-validation__field-edit"]}>
                    <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSave}>
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className={styles["parsing-validation__field-value"]}>
                    <span
                        className={field.is_validated ? styles["parsing-validation__field-value--validated"] : ""}
                    >
                        {formatFieldValue(field)}
                    </span>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(true)}
                    >
                        Modifier
                    </Button>
                </div>
            )}

            {validationError && (
                <p className={styles["parsing-validation__field-error"]}>
                    <AlertTriangle className="h-3 w-3" />
                    {validationError}
                </p>
            )}
        </div>
    )
}

// Party card component
// Party card component
function PartyCard({
    party,
    onChange
}: {
    party: ExtractedParty
    onChange?: (party: ExtractedParty) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState(party)

    const handleSave = () => {
        if (onChange) {
            onChange(editData)
        }
        setIsEditing(false)
    }

    const handleChange = (field: keyof ExtractedParty, value: string) => {
        setEditData(prev => ({ ...prev, [field]: value }))
    }

    if (isEditing) {
        return (
            <div className={styles["parsing-validation__party"]}>
                <div className="flex justify-between items-center mb-2">
                    <Badge variant={party.type === "landlord" ? "default" : "secondary"}>
                        {PARTY_TYPE_LABELS[party.type]}
                    </Badge>
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Input
                        value={editData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Nom"
                    />
                    <Input
                        value={editData.address || ""}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="Adresse"
                    />
                    <Input
                        value={editData.email || ""}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Email"
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={styles["parsing-validation__party"]}>
            <div className={styles["parsing-validation__party-header"]}>
                <Badge variant={party.type === "landlord" ? "default" : "secondary"}>
                    {PARTY_TYPE_LABELS[party.type]}
                </Badge>
                <div className="flex items-center gap-2">
                    <span className={styles["parsing-validation__party-confidence"]}>
                        {Math.round(party.confidence * 100)}%
                    </span>
                    {onChange && (
                        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setIsEditing(true)}>
                            Modifier
                        </Button>
                    )}
                </div>
            </div>
            <div className={styles["parsing-validation__party-name"]}>
                {party.name}
            </div>
            {party.address && (
                <p className={styles["parsing-validation__party-address"]}>{party.address}</p>
            )}
            <div className={styles["parsing-validation__party-contact"]}>
                {party.email && <span>{party.email}</span>}
            </div>
        </div>
    )
}
