"use client"

import Link from "next/link"
import type * as React from "react"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {/* Revert to legacyBehavior */}
              <Link href={item.url} legacyBehavior={undefined} passHref={undefined}>
                {/* <a> REMOVED */} { /* Required child for legacyBehavior */}
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => setOpenMobile(false)}
                  >
                  <item.icon />
                  <span>{item.title}</span>
                  </SidebarMenuButton>
                {/* </a> REMOVED */}
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
