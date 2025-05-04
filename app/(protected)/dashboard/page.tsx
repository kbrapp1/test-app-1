/**
 * Next.js Server Component that renders the main dashboard page.
 * It includes various data visualization components:
 * - SectionCards for summary metrics
 * - ChartAreaInteractive for graphical data representation
 * - DataTable for displaying tabular data
 * 
 * The layout is responsive with different spacing for mobile and desktop views.
 */


// Adjust relative paths for other components if needed (likely not if using aliases)
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "./data.json"

export default function DashboardPage() {
  return (
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
