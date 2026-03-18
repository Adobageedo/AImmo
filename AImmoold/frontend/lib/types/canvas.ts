/**
 * Canvas Types
 * Types pour le canvas de visualisation (tableaux, documents, graphiques)
 */

export enum CanvasBlockType {
  MARKDOWN = "markdown",
  TABLE = "table",
  DOCUMENT = "document",
  CHART = "chart",
  KPI = "kpi",
}

export interface CanvasBlock {
  id: string;
  type: CanvasBlockType;
  title?: string;
  content: unknown;
  metadata?: Record<string, unknown>;
}

export interface CanvasMarkdownBlock extends CanvasBlock {
  type: CanvasBlockType.MARKDOWN;
  content: string;
}

export interface CanvasTableBlock extends CanvasBlock {
  type: CanvasBlockType.TABLE;
  content: {
    headers: string[];
    rows: (string | number)[][];
    footer?: string;
  };
}

export interface CanvasDocumentBlock extends CanvasBlock {
  type: CanvasBlockType.DOCUMENT;
  content: {
    document_id: string;
    document_title: string;
    summary: string;
    url?: string;
  };
}

export interface CanvasChartBlock extends CanvasBlock {
  type: CanvasBlockType.CHART;
  content: {
    chart_type: "line" | "bar" | "pie" | "area";
    data: Array<Record<string, unknown>>;
    x_axis: string;
    y_axis: string;
  };
}

export interface CanvasKPIBlock extends CanvasBlock {
  type: CanvasBlockType.KPI;
  content: {
    label: string;
    value: string | number;
    change?: number;
    trend?: "up" | "down" | "neutral";
  };
}

export interface CanvasState {
  blocks: CanvasBlock[];
  activeBlockId?: string;
  isEditing: boolean;
}
