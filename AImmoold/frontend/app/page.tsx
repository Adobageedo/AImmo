import Link from "next/link"
import { Building2, FileText, MessageSquare, Sparkles, Shield, Zap, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-8">
              <Sparkles className="mr-2 h-4 w-4" />
              Intelligence artificielle au service de l'immobilier
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Gérez votre patrimoine
              <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                en toute simplicité
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
              AImmo révolutionne la gestion immobilière avec une plateforme intelligente qui automatise vos tâches, 
              analyse vos documents et vous accompagne au quotidien.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-base px-8">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-base px-8">
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
            
            <p className="mt-6 text-sm text-gray-500">
              Aucune carte bancaire requise • Essai gratuit de 14 jours
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une suite complète d'outils pour gérer votre activité immobilière
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Gestion de propriétés
              </h3>
              <p className="mt-2 text-gray-600">
                Centralisez toutes vos propriétés, baux et locataires en un seul endroit. 
                Suivez les paiements et les échéances en temps réel.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                OCR intelligent
              </h3>
              <p className="mt-2 text-gray-600">
                Numérisez et analysez automatiquement vos documents. L'IA extrait les données 
                importantes et les organise pour vous.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Assistant IA
              </h3>
              <p className="mt-2 text-gray-600">
                Posez vos questions en langage naturel. L'assistant analyse vos données 
                et vous fournit des réponses précises instantanément.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Automatisation
              </h3>
              <p className="mt-2 text-gray-600">
                Automatisez les tâches répétitives : rappels de loyers, génération de documents, 
                notifications importantes.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Sécurité maximale
              </h3>
              <p className="mt-2 text-gray-600">
                Vos données sont chiffrées et sécurisées. Conformité RGPD garantie. 
                Hébergement en Europe.
              </p>
            </div>

            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900">
                Analytics avancés
              </h3>
              <p className="mt-2 text-gray-600">
                Tableaux de bord personnalisables, rapports détaillés et insights 
                pour optimiser votre rentabilité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tarifs simples et transparents
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Starter */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
              <p className="mt-2 text-sm text-gray-600">Pour les particuliers</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">Gratuit</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">Jusqu'à 3 propriétés</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">OCR basique</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">1 Go de stockage</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="mt-8 block">
                <Button variant="outline" className="w-full">
                  Commencer
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-lg">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                  Populaire
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Pro</h3>
              <p className="mt-2 text-sm text-gray-600">Pour les professionnels</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">49€</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">Propriétés illimitées</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">OCR avancé + IA</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">100 Go de stockage</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">Support prioritaire</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="mt-8 block">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Essayer gratuitement
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
              <p className="mt-2 text-sm text-gray-600">Pour les grandes structures</p>
              <div className="mt-6">
                <span className="text-4xl font-bold text-gray-900">Sur mesure</span>
              </div>
              <ul className="mt-8 space-y-4">
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">Tout du plan Pro</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">API dédiée</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">Support 24/7</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <span className="text-sm text-gray-600">Formation personnalisée</span>
                </li>
              </ul>
              <Link href="#" className="mt-8 block">
                <Button variant="outline" className="w-full">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Prêt à transformer votre gestion immobilière ?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Rejoignez des centaines de professionnels qui font confiance à AImmo
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100 px-8">
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
