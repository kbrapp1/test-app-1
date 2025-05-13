"use client"

import type { NavItem } from "@/lib/config/navigation";
import { MailIcon, PlusCircleIcon, type LucideIcon } from "lucide-react"
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

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const { setOpenMobile } = useSidebar()

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
            {items.map((item) => (
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
                    {item.items.map((subItem) => (
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
