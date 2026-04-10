import { Home, MessageCircle, User, HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardView } from "@/pages/Dashboard";

interface AppSidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

import { useConversations } from "@/hooks/useMessaging";
import { ConversationPayload } from "@/lib/types/messaging";

const menuItems = [
  { id: "home" as DashboardView, label: "Home", icon: Home },
  { id: "messages" as DashboardView, label: "Messages", icon: MessageCircle },
  { id: "profile" as DashboardView, label: "Profile", icon: User },
  { id: "help" as DashboardView, label: "Help", icon: HelpCircle },
];

export const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { data: conversations } = useConversations();

  const unreadCount = conversations?.reduce((acc: number, conv: ConversationPayload) => {
    // Only count unread if the last message was NOT sent by me
    const isReceivedMessage = conv.last_message && conv.last_message.sender_id !== user?.id;
    return acc + (isReceivedMessage ? conv.unread_count : 0);
  }, 0) || 0;

  const handleLogout = () => {
    logout(); // clears swipebuddy_token + swipebuddy_user from localStorage
    navigate("/");
  };

  return (
    <>
      <Sidebar className="w-20 border-r border-sidebar-border">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="pt-8">
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onViewChange(item.id)}
                      isActive={activeView === item.id}
                      className="!h-14 flex flex-col items-center justify-center gap-1 !overflow-visible hover:bg-sidebar-accent"
                    >
                      <div className="relative">
                        <item.icon className="h-5 w-5" />
                        {item.id === "messages" && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full border border-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setShowLogoutDialog(true)}
                className="!h-14 flex flex-col items-center justify-center gap-1 !overflow-visible hover:bg-sidebar-accent"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-xs">Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout from your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
