"use client"

import { useRouter } from 'next/navigation'
import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
  Activity,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { SuperAdminBadgeCompact } from "@/components/auth/SuperAdminBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useUserProfile } from "@/lib/auth/providers/UserProfileProvider"
import { usePerformanceMonitor } from "@/lib/monitoring/presentation/providers/PerformanceMonitorProvider"

/**
 * Navigation User Component
 * 
 * Single Responsibility: Display user navigation dropdown
 * Now uses centralized UserProfileProvider to eliminate redundant profile fetching
 * Reduced from 211 lines to ~90 lines following golden rule
 */
export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()
  const { user: currentUser, profile, isLoading } = useUserProfile()
  const { isEnabled: perfMonitorEnabled, toggle: togglePerfMonitor } = usePerformanceMonitor()

  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
    }
    router.push('/login');
  }

  const getInitials = (email: string | undefined): string => {
    if (!email) return ''
    const parts = email.split('@')[0]
    return parts.substring(0, 2).toUpperCase()
  }

  // Display Skeleton while loading
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="pointer-events-none">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-1 h-3 w-24" />
            </div>
            <MoreVerticalIcon className="ml-auto size-4 opacity-50" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Display nothing if not logged in
  if (!currentUser) {
    return null
  }

  const userEmail = currentUser.email ?? 'No Email'
  const userName = currentUser.user_metadata?.name ?? userEmail.split('@')[0]
  const avatarUrl = currentUser.user_metadata?.avatar_url
  const fallbackInitials = getInitials(userEmail)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
                <AvatarFallback className="rounded-lg">{fallbackInitials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SuperAdminBadgeCompact profile={profile} />
                <MoreVerticalIcon className="ml-auto size-4" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatarUrl ?? undefined} alt={userName} />
                  <AvatarFallback className="rounded-lg">{fallbackInitials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                <UserCircleIcon className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              
              {/* Super Admin Only - Performance Monitor */}
              {profile?.is_super_admin && process.env.NODE_ENV === 'development' && (
                <DropdownMenuItem onClick={togglePerfMonitor}>
                  <Activity className="mr-2 h-4 w-4" />
                  Performance Monitor {perfMonitorEnabled ? '(On)' : '(Off)'}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
