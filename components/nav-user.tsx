"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import type { User } from "@supabase/supabase-js"
import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/auth"
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

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true); 

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Event and session logs removed for cleanup
      if (!isMounted) return;
      const newUser = session?.user ?? null;
      setCurrentUser(newUser);

      // Fetch profile data if user exists
      if (newUser) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newUser.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
          } else {
            setProfile(profileData);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false); 
    });

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [supabase]);

  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
        // Still attempt to clear state and redirect even if signOut fails
    }
    setCurrentUser(null); // Clear user state locally
    router.push('/login');
    // router.refresh(); // Optional: Force refresh if needed
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

  // Display nothing or a login link if not logged in (or adapt as needed)
  if (!currentUser) {
    // console.log('[NavUser Render] Rendering Null (No User)'); // REMOVED
    return null // Or potentially a Login button
  }

  // --- User is logged in --- 
  // console.log('[NavUser Render] Rendering User Info'); // REMOVED
  const userEmail = currentUser.email ?? 'No Email'
  const userName = currentUser.user_metadata?.name ?? userEmail.split('@')[0] // Fallback to email prefix
  const avatarUrl = currentUser.user_metadata?.avatar_url // Check for avatar_url in metadata
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
                 {/* Use avatarUrl from metadata if available */}
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
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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
                <SuperAdminBadgeCompact profile={profile} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* TODO: Link these items to actual pages */}
              <DropdownMenuItem>
                <UserCircleIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}> {/* Add onClick handler */}
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
