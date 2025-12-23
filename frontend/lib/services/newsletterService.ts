import { Newsletter, NewsletterEdition, NewsletterSubscription } from "@/lib/types/newsletter"
import { useAuthStore } from "@/lib/store/auth-store"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

function getAuthHeader(): HeadersInit {
  const token = useAuthStore.getState().accessToken
  if (!token) {
    throw new Error("Not authenticated")
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export const newsletterService = {
  async getNewsletters(): Promise<Newsletter[]> {
    const response = await fetch(`${API_URL}/newsletters/`, {
      headers: getAuthHeader(),
    })
    if (!response.ok) {
      throw new Error("Failed to fetch newsletters")
    }
    return response.json()
  },

  async getNewsletterById(id: string): Promise<Newsletter> {
    const response = await fetch(`${API_URL}/newsletters/${id}/`, {
      headers: getAuthHeader(),
    })
    if (!response.ok) {
      throw new Error("Failed to fetch newsletter")
    }
    return response.json()
  },

  async getLastEdition(newsletterId: string): Promise<NewsletterEdition> {
    const response = await fetch(
      `${API_URL}/newsletters/${newsletterId}/last-edition/`,
      {
        headers: getAuthHeader(),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch last edition")
    }
    return response.json()
  },

  async getEditions(newsletterId: string, limit: number = 10): Promise<NewsletterEdition[]> {
    const response = await fetch(
      `${API_URL}/newsletters/${newsletterId}/editions/?limit=${limit}`,
      {
        headers: getAuthHeader(),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to fetch editions")
    }
    return response.json()
  },

  async subscribe(newsletterId: string): Promise<NewsletterSubscription> {
    const response = await fetch(
      `${API_URL}/newsletters/${newsletterId}/subscribe/`,
      {
        method: "POST",
        headers: getAuthHeader(),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to subscribe")
    }
    return response.json()
  },

  async unsubscribe(newsletterId: string): Promise<NewsletterSubscription> {
    const response = await fetch(
      `${API_URL}/newsletters/${newsletterId}/unsubscribe/`,
      {
        method: "POST",
        headers: getAuthHeader(),
      }
    )
    if (!response.ok) {
      throw new Error("Failed to unsubscribe")
    }
    return response.json()
  },
}
