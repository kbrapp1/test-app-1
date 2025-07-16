"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month:               "space-y-4",

        /* caption bar: full-width, no horizontal padding */
        caption:             "relative pt-1 px-0 flex items-center",
        /* left-aligned month header */
        caption_label:       "text-sm font-medium text-left",

        /* nav placed top-right */
        nav:                 "absolute top-3 right-1 flex items-center space-x-1",
        nav_button:          cn(
                               buttonVariants({ variant: "outline" }),
                               "h-7 w-7 p-0 bg-transparent opacity-50 hover:opacity-100"
                             ),
        nav_button_previous: "",
        nav_button_next:     "",

        /* weekday headers */
        weekdays:            "grid grid-cols-7 text-center mb-1",
        weekday:             "w-9 text-muted-foreground font-normal text-[0.8rem]",

        /* calendar grid */
        table:               "w-full table-auto border-collapse",
        row:                 "grid grid-cols-7",
        cell:                "h-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

        /* individual days */
        day:                 cn(
                               buttonVariants({ variant: "ghost" }),
                               "h-9 w-9 p-0 font-normal text-muted-foreground aria-selected:opacity-100"
                             ),
        day_range_end:       "day-range-end",
        day_selected:        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today:           "bg-accent text-accent-foreground",
        day_outside:         "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled:        "text-muted-foreground opacity-50",
        day_range_middle:    "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden:          "invisible",

        ...classNames,
      }}
      components={{
        Chevron:  ({ orientation, ...props }) => {
          const Component = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Component className="h-4 w-4" {...props} />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };