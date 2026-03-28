import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { HomePage } from "@/components/dashboard/HomePage";
import { MessagePage } from "@/components/dashboard/MessagePage";
import { ProfilePage } from "@/components/dashboard/ProfilePage";
import { HelpPage } from "@/components/dashboard/HelpPage";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { mockProfiles } from "@/data/mockProfiles";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical, Heart, Flag, Copy, Check } from "lucide-react";
import { useSavedProfiles, useSaveProfile } from "@/hooks/useSocial";
import { usePublicProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export type DashboardView = "home" | "messages" | "profile" | "help";

const Dashboard = () => {
  const [activeView, setActiveView] = useState<DashboardView>("home");
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCopied, setIsCopied] = useState(false);
  const { data: savedProfiles = [] } = useSavedProfiles();
  const { mutate: toggleSaveMutation } = useSaveProfile();
  const { toast } = useToast();
  
  const profileId = searchParams.get("profile");
  const fromSource = searchParams.get("from");

  // Fetch profile if selected, but fall back to mock if needed for now
  const { data: apiProfile } = usePublicProfile(profileId || undefined);
  const selectedProfile = apiProfile || (profileId ? mockProfiles.find(p => p.id === profileId) : null);

  const isProfileSaved = profileId ? savedProfiles.some(p => p.id === profileId) : false;

  const handleSaveProfile = () => {
    if (!profileId) return;
    toggleSaveMutation(profileId);
  };

  const handleReportProfile = () => {
    toast({ title: "Report submitted", description: "Thank you for your feedback." });
  };

  const handleCopyProfile = () => {
    const shareUrl = `${window.location.origin}/profile/${profileId}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast({ title: "Profile link copied!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleBack = () => {
    setSearchParams({});
    if (fromSource === "saved") {
      setActiveView("profile");
    } else {
      setActiveView("messages");
    }
  };

  const getBackLabel = () => {
    if (fromSource === "saved") {
      return "Back to Saved Profiles";
    }
    return "Back to Messages";
  };

  const renderContent = () => {
    // If a profile is selected via query param, show that profile
    if (selectedProfile) {
      return (
        <div className="h-screen flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getBackLabel()}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={handleSaveProfile}>
                  <Heart className={`h-4 w-4 mr-2 ${isProfileSaved ? "fill-rose-500 text-rose-500" : ""}`} />
                  {isProfileSaved ? "Unsave Profile" : "Save Profile"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReportProfile}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyProfile}>
                  {isCopied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {isCopied ? "Copied!" : "Copy Profile"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <ProfileCard profile={selectedProfile as any} isSaved={isProfileSaved} />
          </div>
        </div>
      );
    }

    switch (activeView) {
      case "home":
        return <HomePage />;
      case "messages":
        return <MessagePage />;
      case "profile":
        return <ProfilePage />;
      case "help":
        return <HelpPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
