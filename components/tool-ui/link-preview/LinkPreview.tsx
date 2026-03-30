"use client";

import * as React from "react";
import { type SerializableLinkPreview } from "./schema";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Globe, ExternalLink } from "lucide-react";

interface LinkPreviewProps extends SerializableLinkPreview {
  className?: string;
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

function getAspectRatioClass(ratio?: string): string {
  switch (ratio) {
    case "1:1":
      return "aspect-square";
    case "4:3":
      return "aspect-[4/3]";
    case "16:9":
      return "aspect-video";
    case "9:16":
      return "aspect-[9/16]";
    default:
      return "aspect-video";
  }
}

export const LinkPreview = ({
  id,
  href,
  title,
  description,
  image,
  domain,
  favicon,
  ratio = "16:9",
  fit = "cover",
  createdAt,
  className,
}: LinkPreviewProps) => {
  const displayDomain = extractDomain(href, domain);
  const faviconUrl = getFaviconUrl(href, favicon);
  const [imgError, setImgError] = React.useState(false);

  const handleClick = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
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
      {/* Image */}
      {image && !imgError && (
        <div className={cn("w-full overflow-hidden bg-muted", getAspectRatioClass(ratio))}>
          <img
            src={image}
            alt={title || ""}
            className={cn(
              "h-full w-full transition-transform duration-300 group-hover:scale-105",
              fit === "cover" ? "object-cover" : "object-contain"
            )}
            onError={() => setImgError(true)}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Domain bar */}
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
          <span className="text-xs text-muted-foreground truncate flex-1">
            {displayDomain}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        {/* Title */}
        {title && (
          <p className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Date */}
        {createdAt && (
          <p className="text-[11px] text-muted-foreground">
            {new Date(createdAt).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>
    </Card>
  );
};
