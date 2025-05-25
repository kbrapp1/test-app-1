'use client';

import React from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define the structure for a breadcrumb item (domain interface)
export interface BreadcrumbItemData {
  id: string | null; // null for root
  name: string;
  href: string;
}

export interface DamBreadcrumbsProps {
  path: BreadcrumbItemData[]; // Array representing the path from root
}

/**
 * Domain Navigation Component: DamBreadcrumbs
 * 
 * Displays navigation breadcrumbs for the DAM system showing the current folder path.
 * Follows domain-driven design patterns for presentation layer components.
 * 
 * @param path - Array of breadcrumb items representing the folder hierarchy
 */
export const DamBreadcrumbs: React.FC<DamBreadcrumbsProps> = ({ path }) => {
  if (!path || path.length === 0) {
    // Default to showing just Root if path is empty or invalid
    path = [{ id: null, name: 'Root', href: '/dam' }];
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {path.map((item, index) => (
          <React.Fragment key={item.id ?? 'root'}>
            <BreadcrumbItem>
              {index === path.length - 1 ? (
                // Last item is the current page (not a link)
                (<BreadcrumbPage>{item.name}</BreadcrumbPage>)
              ) : (
                // Intermediate items are links
                (<BreadcrumbLink asChild>
                  <Link href={item.href} legacyBehavior={undefined}>{item.name}</Link>
                </BreadcrumbLink>)
              )}
            </BreadcrumbItem>
            {index < path.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}; 
