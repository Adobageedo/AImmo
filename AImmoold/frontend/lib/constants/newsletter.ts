export const NEWSLETTER_THEMES = {
  marche: "Marché & Tendances",
  fiscalite: "Fiscalité",
  gestion: "Gestion Locative",
  reglementation: "Réglementation",
  commercial: "Immobilier Commercial",
  residentiel: "Immobilier Résidentiel",
  actualites: "Actualités",
} as const

export type NewsletterTheme = keyof typeof NEWSLETTER_THEMES

export const NEWSLETTER_FREQUENCIES = {
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  biweekly: "Bi-hebdomadaire",
  monthly: "Mensuelle",
  quarterly: "Trimestrielle",
} as const

export type NewsletterFrequency = keyof typeof NEWSLETTER_FREQUENCIES

export const NEWSLETTER_STATUS = {
  subscribed: "Abonné",
  unsubscribed: "Non abonné",
} as const
