// Remove imports for layout components now provided by layout.tsx
// import { AppSidebar } from "../../components/app-sidebar"
// import { SiteHeader } from "../../components/site-header"
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Adjust relative paths for other components if needed (likely not if using aliases)
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

export default function DashboardPage() {
  return (
    // Remove the layout wrappers (SidebarProvider, AppSidebar, SidebarInset, SiteHeader)
    // The parent layout.tsx now handles these.
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
  )
}
