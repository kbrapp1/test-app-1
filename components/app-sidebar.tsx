"use client"

import type * as React from "react"
import Image from "next/image"

import {
  navMainItems,
  navSecondaryItems
} from "@/lib/config/navigation"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="px-4 py-2">
        <a href="/dashboard">
          <Image
            src="/ironmark-logo.png"
            alt="Ironmark Logo"
            width={120}
            height={47}
            priority
            style={{ width: '120px', height: '47px' }}
          />
        </a>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
