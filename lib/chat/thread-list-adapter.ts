import type { unstable_RemoteThreadListAdapter as RemoteThreadListAdapter } from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";

/**
 * Thread List Adapter
 * Gère la persistance des threads dans Supabase
 */
export const threadListAdapter: RemoteThreadListAdapter = {
  /**
   * Liste tous les threads de l'utilisateur
   */
  async list() {
    const response = await fetch("/api/threads");
    if (!response.ok) {
      throw new Error("Failed to fetch threads");
    }

    const { threads } = await response.json();
    
    return {
      threads: threads.map((thread: any) => ({
        remoteId: thread.id,
        externalId: thread.external_id ?? undefined,
        status: thread.is_archived ? ("archived" as const) : ("regular" as const),
        title: thread.title ?? undefined,
      })),
    };
  },

  /**
   * Initialise un nouveau thread
   */
  async initialize(localId) {
    const response = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localId }),
    });

    if (!response.ok) {
      throw new Error("Failed to create thread");
    }

    const result = await response.json();
    return {
      remoteId: result.id,
      externalId: result.external_id,
    };
  },

  /**
   * Renomme un thread
   */
  async rename(remoteId, title) {
    const response = await fetch(`/api/threads/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error("Failed to rename thread");
    }
  },

  /**
   * Archive un thread
   */
  async archive(remoteId) {
    const response = await fetch(`/api/threads/${remoteId}/archive`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to archive thread");
    }
  },

  /**
   * Désarchive un thread
   */
  async unarchive(remoteId) {
    const response = await fetch(`/api/threads/${remoteId}/unarchive`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to unarchive thread");
    }
  },

  /**
   * Supprime un thread
   */
  async delete(remoteId) {
    const response = await fetch(`/api/threads/${remoteId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete thread");
    }
  },

  /**
   * Récupère les détails d'un thread
   */
  async fetch(remoteId) {
    const response = await fetch(`/api/threads/${remoteId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch thread");
    }

    const thread = await response.json();
    return {
      status: thread.is_archived ? ("archived" as const) : ("regular" as const),
      remoteId: thread.id,
      title: thread.title,
    };
  },

  /**
   * Génère un titre pour le thread
   */
  async generateTitle(remoteId, messages) {
    return createAssistantStream(async (controller) => {
      const response = await fetch(`/api/threads/${remoteId}/title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate title");
      }

      const { title } = await response.json();
      controller.appendText(title);
    });
  },
};
