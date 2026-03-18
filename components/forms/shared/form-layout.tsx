"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface FormLayoutProps {
  title: string
  description?: string
  children: ReactNode
  currentStep?: number
  totalSteps?: number
  status?: 'draft' | 'in_progress' | 'completed'
  className?: string
  stepWidths?: string[]
}

export function FormLayout({
  title,
  description,
  children,
  currentStep,
  totalSteps,
  status = 'in_progress',
  className,
  stepWidths
}: FormLayoutProps) {
  const progressPercentage = currentStep && totalSteps 
    ? (currentStep / totalSteps) * 100 
    : 0

  const getStatusColor = () => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'in_progress': return 'bg-blue-500'
      case 'completed': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'draft': return 'Brouillon'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminé'
      default: return 'Brouillon'
    }
  }

  // Calculer la largeur de l'étape actuelle
  const getStepWidth = () => {
    if (!stepWidths || !currentStep) return 'max-w-4xl'
    
    // Utiliser directement la largeur de l'étape actuelle
    return stepWidths[currentStep - 1] || 'max-w-4xl'
  }

  return (
    <div className={`${getStepWidth()} mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>

      {/* Progress */}
      {currentStep && totalSteps && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Étape {currentStep} sur {totalSteps}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
