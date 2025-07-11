"use client"

import type { NavItem, NavSubItem } from "@/lib/config/navigation";
import { MailIcon, PlusCircleIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useAuthWithSuperAdmin } from "@/lib/auth/super-admin"
import { useOrganization } from "@/lib/organization/application/providers/OrganizationProvider"
import { useMemo } from "react"

// Custom hook to get all feature flags at once
function useAllFeatureFlags(items: NavItem[]) {
  const { currentContext } = useOrganization();
  const flags = currentContext?.feature_flags as Record<string, boolean> | undefined;
  
  return useMemo(() => {
    const getFeatureFlagValue = (featureName: string): boolean => {
      // Default to true if flag is missing, but respect explicit false values
      return flags ? (flags.hasOwnProperty(featureName) ? flags[featureName] : true) : true;
    };
    
    // Create a lookup object for all feature flags used in navigation
    const featureFlagValues: Record<string, boolean> = {};
    
    const collectAndEvaluateFlags = (navItems: NavItem[]) => {
      navItems.forEach(item => {
        if (item.featureFlag) {
          featureFlagValues[item.featureFlag] = getFeatureFlagValue(item.featureFlag);
        }
        if (item.items) {
          item.items.forEach(subItem => {
            if (subItem.featureFlag) {
              featureFlagValues[subItem.featureFlag] = getFeatureFlagValue(subItem.featureFlag);
            }
          });
        }
      });
    };
    
    collectAndEvaluateFlags(items);
    return featureFlagValues;
  }, [items, flags]);
}

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const { setOpenMobile } = useSidebar()
  const { isSuperAdmin } = useAuthWithSuperAdmin()
  const featureFlagValues = useAllFeatureFlags(items)
  
  // Helper functions that use pre-computed values (no hooks inside)
  const isItemVisible = (item: NavItem) => {
    const isVisibleByAdmin = !item.superAdminOnly || isSuperAdmin;
    const isVisibleByFeature = !item.featureFlag || featureFlagValues[item.featureFlag] === true;
    return isVisibleByAdmin && isVisibleByFeature;
  };
  
  const isSubItemVisible = (subItem: NavSubItem) => {
    const isVisibleByFeature = !subItem.featureFlag || featureFlagValues[subItem.featureFlag] === true;
    return isVisibleByFeature;
  };
  
  // Filter items using the helper functions (no hooks called here)
  const visibleItems = items.filter(isItemVisible);
  
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              onClick={() => setOpenMobile(false)}
            >
              <PlusCircleIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button size="icon" className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0" variant="outline">
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <Accordion type="multiple" className="w-full">
            {visibleItems.map((item) => (
              item.collapsible && item.items ? (
                <AccordionItem key={item.title} value={item.title} className="border-none">
                  <AccordionTrigger
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm font-normal hover:bg-muted hover:no-underline focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                    <span className="flex-1 truncate">{item.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pl-5">
                    {item.items?.filter(isSubItemVisible).map((subItem) => (
                      <SidebarMenuItem key={subItem.title} className="my-0.5">
                        <Link href={subItem.url}>
                          <SidebarMenuButton
                            tooltip={subItem.title}
                            onClick={() => setOpenMobile(false)}
                            className="flex h-8 items-center justify-start gap-2 px-2 text-sm group-data-[collapsible=icon]:justify-center"
                          >
                            {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                            <span className="group-data-[collapsible=icon]:opacity-0">{subItem.title}</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <Link href={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            ))}
          </Accordion>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
