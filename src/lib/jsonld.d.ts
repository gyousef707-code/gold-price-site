export function organizationJsonLd(): Record<string, unknown>;
export function websiteJsonLd(): Record<string, unknown>;
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown>;
export function articleJsonLd(args: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
}): Record<string, unknown>;
