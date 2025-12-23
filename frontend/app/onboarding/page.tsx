"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useParsing } from "@/lib/hooks/use-parsing"
import { ParsingValidation } from "@/components/processing/parsing-validation"
import { UploadDialog } from "@/components/documents/upload-dialog"
import { DocumentType } from "@/lib/types/document"
import { Building2, FileText, CheckCircle2, ArrowRight } from "lucide-react"

import { DocumentProvider } from "@/lib/contexts/document-context"
import { useEffect } from "react"

type OnboardingStep = "welcome" | "upload" | "validate" | "complete"

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState<OnboardingStep>("welcome")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Reuse existing parsing logic
    const {
        result: parsingResult,
        status: parsingStatus,
        loading: parsingLoading,
        startParsing,
        updateField,
        updateParty,
        validateAndComplete,
        reset: resetParsing
    } = useParsing()

    const handleLeaseUploadSuccess = async (documentId: string) => {
        setStep("validate") // Move to validation view
        await startParsing(documentId)
    }

    const handleValidation = async (createEntities: boolean) => {
        const success = await validateAndComplete(createEntities)
        if (success) {
            setStep("complete")
        }
    }

    const handleFinish = () => {
        router.push("/dashboard")
    }

    // --- Views ---

    const renderWelcome = () => (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="h-8 w-8 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Bienvenue sur AImmo Asset Manager
                </h1>
                <p className="text-lg text-gray-600 max-w-lg mx-auto">
                    Votre solution de gestion locative intelligente. Commençons par configurer votre premier mandat.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:border-indigo-400 transition-colors cursor-pointer" onClick={() => setStep("upload")}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-700">
                            <FileText className="h-5 w-5" />
                            Importer un Bail
                        </CardTitle>
                        <CardDescription className="text-indigo-600/80">
                            Recommandé
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Notre IA va extraire automatiquement les données du bien, du propriétaire et du locataire.
                        </p>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Commençer l'analyse</Button>
                    </CardContent>
                </Card>

                <Card className="hover:border-gray-400 transition-colors cursor-pointer bg-white" onClick={handleFinish}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-700">
                            <ArrowRight className="h-5 w-5" />
                            Accéder au Dashboard
                        </CardTitle>
                        <CardDescription>
                            Mode Expert
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">
                            Configurer manuellement votre espace de travail ou explorer les fonctionnalités.
                        </p>
                        <Button variant="outline" className="w-full">Passer cette étape</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )

    const renderUpload = () => (
        <div className="max-w-md mx-auto text-center space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">Importez votre premier contrat</h2>
                <p className="text-gray-500">
                    Uploadez un bail (PDF) pour initialiser votre premier bien et ses parties prenantes.
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl border shadow-sm">
                <UploadDialog
                    defaultFolder="Leases"
                    defaultDocumentType={DocumentType.BAIL}
                    onUploadSuccess={handleLeaseUploadSuccess}
                    trigger={
                        <Button size="lg" className="w-full h-16 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                            <FileText className="mr-2 h-6 w-6" />
                            Sélectionner un fichier
                        </Button>
                    }
                />
                <p className="mt-4 text-xs text-muted-foreground">
                    Formats acceptés : PDF, JPG, PNG. Max 10MB.
                </p>
            </div>

            <Button variant="ghost" onClick={() => setStep("welcome")}>
                Retour
            </Button>
        </div>
    )

    const renderValidate = () => (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Vérification des données</h2>
                    <p className="text-muted-foreground">Confirmez les informations extraites pour créer vos fiches.</p>
                </div>
                <Button variant="outline" onClick={() => setStep("upload")} disabled={parsingLoading}>
                    Annuler
                </Button>
            </div>

            {parsingStatus === "ocr_processing" || parsingStatus === "parsing" || parsingLoading ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-white rounded-xl border shadow-sm">
                    <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-medium">Analyse en cours...</p>
                    <p className="text-sm text-muted-foreground">Nous extrayons les données de votre bail.</p>
                </div>
            ) : parsingResult ? (
                <ParsingValidation
                    result={parsingResult}
                    loading={parsingLoading}
                    onFieldChange={updateField}
                    onPartyChange={updateParty}
                    onValidate={handleValidation}
                    onCancel={() => setStep("upload")}
                />
            ) : (
                <div className="text-center py-12">
                    <p className="text-red-500">Une erreur est survenue lors du parsing.</p>
                    <Button onClick={() => setStep("upload")} className="mt-4">Réessayer</Button>
                </div>
            )}
        </div>
    )

    const renderComplete = () => (
        <div className="max-w-md mx-auto text-center space-y-8 animate-in zoom-in duration-300">
            <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>

            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">Configuration terminée !</h2>
                <p className="text-lg text-gray-600">
                    Votre bien, le propriétaire et le locataire ont été créés avec succès.
                </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg text-left text-sm space-y-2 border">
                <p>✅ <strong>Bien immobilier</strong> créé</p>
                <p>✅ <strong>Fiche Propriétaire</strong> renseignée</p>
                <p>✅ <strong>Fiche Locataire</strong> liée</p>
                <p>✅ <strong>Données financières</strong> à jour</p>
            </div>

            <Button size="lg" className="w-full" onClick={handleFinish}>
                Accéder à mon Dashboard
            </Button>
        </div>
    )

    if (!mounted) return null

    return (
        <DocumentProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                {step === "welcome" && renderWelcome()}
                {step === "upload" && renderUpload()}
                {step === "validate" && renderValidate()}
                {step === "complete" && renderComplete()}
            </div>
        </DocumentProvider>
    )
}
