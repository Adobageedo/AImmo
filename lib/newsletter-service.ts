import { NewsletterWithSubscription, NewsletterEdition, SubscribeNewsletterRequest } from '@/types/newsletter'
import { createClient } from './supabase/client'

const supabase = createClient()

class NewsletterService {

  async getNewsletters(userId?: string): Promise<NewsletterWithSubscription[]> {
    try {
      // Get active newsletters
      const { data: newsletters, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('active', true)
        .eq('is_active', true)

      if (error) throw error

      // Get user subscriptions if userId is provided
      let userSubscriptions: any[] = []
      if (userId) {
        const { data: subscriptions } = await supabase
          .from('newsletter_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_subscribed', true)
        userSubscriptions = subscriptions || []
      }

      // Get edition counts and latest dates for each newsletter
      const newslettersWithStats = await Promise.all(
        (newsletters || []).map(async (newsletter) => {
          // Get edition count
          const { count: editionCount } = await supabase
            .from('newsletter_editions')
            .select('*', { count: 'exact', head: true })
            .eq('newsletter_id', newsletter.id)

          // Get latest edition date
          const { data: latestEdition } = await supabase
            .from('newsletter_editions')
            .select('published_at')
            .eq('newsletter_id', newsletter.id)
            .order('published_at', { ascending: false })
            .limit(1)
            .single()

          // Check if user is subscribed
          const subscription = userSubscriptions.find(s => s.newsletter_id === newsletter.id)

          return {
            ...newsletter,
            is_user_subscribed: !!subscription,
            subscription_id: subscription?.id || null,
            edition_count: editionCount || 0,
            last_published_at: latestEdition?.published_at || null,
          }
        })
      )

      return newslettersWithStats
    } catch (error) {
      console.error('Error fetching newsletters:', error)
      // Fallback to mock data
      return [
        {
          id: "jurisprudence-immobiliere",
          title: "Jurisprudence Immobilière",
          category: "regulation" as const,
          frequency: "weekly" as const,
          description: "Newsletter hebdomadaire sur les dernières décisions de justice en matière de droit immobilier",
          active: true,
          slug: "jurisprudence-immobiliere",
          theme: "jurisprudence",
          is_active: true,
          is_user_subscribed: false,
          edition_count: 0,
          subscriber_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
    }
  }

  async getNewsletterEditions(newsletterId: string): Promise<NewsletterEdition[]> {
    try {
      const { data, error } = await supabase
        .from('newsletter_editions')
        .select('*')
        .eq('newsletter_id', newsletterId)
        .order('published_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting newsletter editions:', error)
      return []
    }
  }

  async getLatestEdition(newsletterId: string): Promise<NewsletterEdition | null> {
    try {
      const { data, error } = await supabase
        .from('newsletter_editions')
        .select('*')
        .eq('newsletter_id', newsletterId)
        .order('published_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
      return data
    } catch (error) {
      console.error('Error getting latest edition:', error)
      return null
    }
  }

  async subscribeToNewsletter(data: SubscribeNewsletterRequest, userId?: string): Promise<void> {
    try {
      const actualUserId = userId || 'mock-user-id'
      
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .upsert({
          user_id: actualUserId,
          newsletter_id: data.newsletter_id,
          is_subscribed: true,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        }, {
          onConflict: 'user_id,newsletter_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      throw error
    }
  }

  async unsubscribeFromNewsletter(newsletterId: string, userId?: string): Promise<void> {
    try {
      const actualUserId = userId || 'mock-user-id'
      
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({
          is_subscribed: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('user_id', actualUserId)
        .eq('newsletter_id', newsletterId)

      if (error) throw error
    } catch (error) {
      console.error('Error unsubscribing from newsletter:', error)
      throw error
    }
  }

  async generateJurisprudenceNewsletter(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('http://localhost:8000/api/v1/jurisprudence/generate/weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error generating newsletter:', error)
      throw error
    }
  }

  async getJurisprudenceStats(): Promise<any> {
    try {
      const response = await fetch('http://localhost:8000/api/v1/jurisprudence/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return await response.json()
    } catch (error) {
      console.error('Error getting stats:', error)
      return null
    }
  }

  async getJurisprudenceHealth(): Promise<any> {
    try {
      const response = await fetch('http://localhost:8000/api/v1/jurisprudence/health')
      if (!response.ok) throw new Error('Failed to fetch health')
      return await response.json()
    } catch (error) {
      console.error('Error getting health:', error)
      return null
    }
  }
}

export const newsletterService = new NewsletterService()
