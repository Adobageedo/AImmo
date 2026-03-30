"use client";

import * as React from "react";
import { type SerializableCitation } from "./schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Globe,
  FileText,
  Newspaper,
  Code2,
  Server,
  ExternalLink,
  Quote,
} from "lucide-react";

interface CitationProps extends SerializableCitation {
  onNavigate?: (href: string, citation: SerializableCitation) => void;
  className?: string;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "document":
      return FileText;
    case "article":
      return Newspaper;
    case "code":
      return Code2;
    case "api":
      return Server;
    default:
      return Globe;
  }
}

function extractDomain(href: string, domain?: string): string {
  if (domain) return domain;
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}

function getFaviconUrl(href: string, favicon?: string): string {
  if (favicon) return favicon;
  try {
    const domain = new URL(href).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
}

// ─── Default variant ───
const CitationDefault = ({
  id,
  href,
  title,
  snippet,
  domain,
  favicon,
  author,
  publishedAt,
  type = "webpage",
  onNavigate,
  className,
  ...rest
}: CitationProps) => {
  const Icon = getTypeIcon(type);
  const displayDomain = extractDomain(href, domain);
  const faviconUrl = getFaviconUrl(href, favicon);

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(href, { id, href, title, snippet, domain, favicon, author, publishedAt, type });
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30",
        "p-4 space-y-3",
        className
      )}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Header: favicon + domain + type badge */}
      <div className="flex items-center gap-2">
        {faviconUrl && (
          <img
            src={faviconUrl}
            alt=""
            className="h-4 w-4 rounded-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span className="text-xs text-muted-foreground truncate">{displayDomain}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto capitalize">
          <Icon className="h-3 w-3 mr-1" />
          {type}
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
        {title}
      </p>

      {/* Snippet */}
      {snippet && (
        <div className="flex gap-2 items-start">
          <Quote className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground line-clamp-3 italic">{snippet}</p>
        </div>
      )}

      {/* Footer: author + date */}
      {(author || publishedAt) && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {author && <span>{author}</span>}
          {author && publishedAt && <span>·</span>}
          {publishedAt && (
            <span>{new Date(publishedAt).toLocaleDateString("fr-FR")}</span>
          )}
        </div>
      )}
    </Card>
  );
};

// ─── Inline variant ───
const CitationInline = ({
  id,
  href,
  title,
  domain,
  favicon,
  type = "webpage",
  onNavigate,
  className,
  ...rest
}: CitationProps) => {
  const displayDomain = extractDomain(href, domain);
  const faviconUrl = getFaviconUrl(href, favicon);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(href, { id, href, title, domain, favicon, type });
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
        "bg-muted/50 hover:bg-muted text-xs transition-colors",
        "border border-border/50 hover:border-border",
        className
      )}
    >
      {faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          className="h-3 w-3 rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className="truncate max-w-[200px] font-medium">{title}</span>
      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
    </button>
  );
};

// ─── Stacked variant (favicon list) ───
const CitationStacked = ({
  id,
  href,
  title,
  domain,
  favicon,
  type = "webpage",
  onNavigate,
  className,
  ...rest
}: CitationProps) => {
  const faviconUrl = getFaviconUrl(href, favicon);
  const displayDomain = extractDomain(href, domain);

  const handleClick = () => {
    if (onNavigate) {
      onNavigate(href, { id, href, title, domain, favicon, type });
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md w-full text-left",
        "hover:bg-muted/80 transition-colors",
        className
      )}
      title={title}
    >
      {faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          className="h-4 w-4 rounded-sm shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className="text-xs font-medium truncate flex-1">{title}</span>
      <span className="text-[10px] text-muted-foreground truncate shrink-0">{displayDomain}</span>
    </button>
  );
};

// ─── Main export ───
export const Citation = ({
  variant = "default",
  ...props
}: CitationProps) => {
  switch (variant) {
    case "inline":
      return <CitationInline {...props} variant={variant} />;
    case "stacked":
      return <CitationStacked {...props} variant={variant} />;
    default:
      return <CitationDefault {...props} variant={variant} />;
  }
};
