/**
 * Enhanced Parsing Service
 * Service pour communiquer avec le backend de parsing avec matching d'entités
 */

// API_BASE_URL sera défini directement dans le constructeur
import { chatSDKService } from './chat-sdk-service'

export interface EnhancedParsingRequest {
  text: string
  include_entity_matching?: boolean
  annex_documents?: string[]
}

export interface EnhancedParsingResponse {
  success: boolean
  data: {
    parsed_lease?: any
    matched_entities?: {
      property?: { id: string; name: string; confidence: number; entity_type: string }
      landlord?: { id: string; name: string; confidence: number; entity_type: string }
      tenant?: { id: string; name: string; confidence: number; entity_type: string }
    }
    form_data?: {
      property: any
      landlord: any
      tenant: any
      lease: any
    }
    debug_info?: any
    overall_confidence?: number
  }
  message: string
  debug_info?: any
}

export interface EntityDebugInfo {
  success: boolean
  data: {
    properties: Array<{
      id: string
      address: string
      postal_code: string
      city: string
      type: string
    }>
    tenants: Array<{
      id: string
      name: string
      email: string
      phone: string
      address: string
    }>
    landlords: Array<{
      id: string
      name: string
      email: string
      phone: string
      address: string
    }>
    counts: {
      properties: number
      tenants: number
      landlords: number
    }
  }
  message: string
}

export class EnhancedParsingService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  }

  /**
   * Parser un bail avec matching d'entités
   */
  async parseLeaseWithMatching(request: EnhancedParsingRequest): Promise<EnhancedParsingResponse> {
    const headers = this.getAuthHeader()
    
    try {
      console.log('🚀 [FRONTEND] Starting enhanced lease parsing request')
      console.log('🔍 [FRONTEND] Request data:', {
        textLength: request.text.length,
        include_entity_matching: request.include_entity_matching,
        annex_documents_count: request.annex_documents?.length || 0
      })

      const response = await fetch(`${this.baseUrl}/api/v1/lease-parsing/parse`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to parse lease: ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('✅ [FRONTEND] Parsing completed successfully')
      console.log('✅ [FRONTEND] Matched entities:', result.data.matched_entities)
      console.log('✅ [FRONTEND] Form data keys:', Object.keys(result.data.form_data || {}))
      
      if (result.debug_info) {
        console.log('🔍 [FRONTEND] Debug info:', result.debug_info)
      }

      return result
    } catch (error) {
      console.error('❌ [FRONTEND] Error in enhanced parsing:', error)
      throw error
    }
  }

  /**
   * Récupérer les entités existantes pour le debug
   */
  async getDebugEntities(): Promise<EntityDebugInfo> {
    const headers = this.getAuthHeader()
    
    try {
      console.log('🔍 [FRONTEND] Fetching debug entities')

      const response = await fetch(`${this.baseUrl}/api/v1/lease-parsing/debug/entities`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch debug entities: ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('✅ [FRONTEND] Debug entities fetched:', {
        properties: result.data.counts.properties,
        tenants: result.data.counts.tenants,
        landlords: result.data.counts.landlords
      })

      return result
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching debug entities:', error)
      throw error
    }
  }

  /**
   * Tester le matching d'entités
   */
  async testEntityMatching(testData: any): Promise<any> {
    const headers = this.getAuthHeader()
    
    try {
      console.log('🧪 [FRONTEND] Testing entity matching with data:', testData)

      const response = await fetch(`${this.baseUrl}/api/v1/lease-parsing/test-matching`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testData),
      })

      if (!response.ok) {
        throw new Error(`Failed to test entity matching: ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('✅ [FRONTEND] Entity matching test completed')
      console.log('✅ [FRONTEND] Test results:', result.data)

      return result
    } catch (error) {
      console.error('❌ [FRONTEND] Error in entity matching test:', error)
      throw error
    }
  }

  /**
   * Obtenir les headers d'authentification
   */
  private getAuthHeader(): HeadersInit {
    const headers = chatSDKService.getAuthHeaders()
    return {
      ...headers,
      'Content-Type': 'application/json'
    }
  }
}

// Export du service
export const enhancedParsingService = new EnhancedParsingService()
