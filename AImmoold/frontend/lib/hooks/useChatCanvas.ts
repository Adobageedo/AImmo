/**
 * useChatCanvas Hook
 * Gère le canvas (tableaux, documents, graphiques)
 */

import { useState, useCallback } from "react";
import { CanvasBlock, CanvasBlockType, CanvasState } from "../types/canvas";

export function useChatCanvas() {
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);

  const addBlock = useCallback((block: CanvasBlock) => {
    setBlocks((prev) => [...prev, block]);
    setActiveBlockId(block.id);
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (activeBlockId === blockId) {
      setActiveBlockId(undefined);
    }
  }, [activeBlockId]);

  const updateBlock = useCallback((blockId: string, updates: Partial<CanvasBlock>) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === blockId ? { ...block, ...updates } : block))
    );
  }, []);

  const clearCanvas = useCallback(() => {
    setBlocks([]);
    setActiveBlockId(undefined);
    setIsEditing(false);
  }, []);

  const selectBlock = useCallback((blockId: string | undefined) => {
    setActiveBlockId(blockId);
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  // Helper pour créer des blocks depuis du contenu markdown
  const parseMarkdownToBlocks = useCallback((markdown: string): CanvasBlock[] => {
    const blocks: CanvasBlock[] = [];
    const lines = markdown.split("\n");
    let currentBlock: string[] = [];
    let inTable = false;

    for (const line of lines) {
      // Détection de tableau markdown
      if (line.trim().startsWith("|")) {
        if (!inTable) {
          // Sauvegarder le block précédent
          if (currentBlock.length > 0) {
            blocks.push({
              id: `block-${Date.now()}-${blocks.length}`,
              type: CanvasBlockType.MARKDOWN,
              content: currentBlock.join("\n"),
            });
            currentBlock = [];
          }
          inTable = true;
        }
        currentBlock.push(line);
      } else {
        if (inTable) {
          // Fin du tableau
          const tableLines = currentBlock;
          const headers = tableLines[0]
            .split("|")
            .filter((h) => h.trim())
            .map((h) => h.trim());
          const rows = tableLines
            .slice(2) // Skip header and separator
            .map((row) =>
              row
                .split("|")
                .filter((c) => c.trim())
                .map((c) => c.trim())
            );

          blocks.push({
            id: `block-${Date.now()}-${blocks.length}`,
            type: CanvasBlockType.TABLE,
            content: { headers, rows },
          });

          currentBlock = [];
          inTable = false;
        }
        currentBlock.push(line);
      }
    }

    // Sauvegarder le dernier block
    if (currentBlock.length > 0) {
      if (inTable) {
        // C'est un tableau
        const tableLines = currentBlock;
        const headers = tableLines[0]
          .split("|")
          .filter((h) => h.trim())
          .map((h) => h.trim());
        const rows = tableLines
          .slice(2)
          .map((row) =>
            row
              .split("|")
              .filter((c) => c.trim())
              .map((c) => c.trim())
          );

        blocks.push({
          id: `block-${Date.now()}-${blocks.length}`,
          type: CanvasBlockType.TABLE,
          content: { headers, rows },
        });
      } else {
        blocks.push({
          id: `block-${Date.now()}-${blocks.length}`,
          type: CanvasBlockType.MARKDOWN,
          content: currentBlock.join("\n"),
        });
      }
    }

    return blocks;
  }, []);

  return {
    blocks,
    activeBlockId,
    isEditing,
    addBlock,
    removeBlock,
    updateBlock,
    clearCanvas,
    selectBlock,
    toggleEditing,
    parseMarkdownToBlocks,
  };
}
