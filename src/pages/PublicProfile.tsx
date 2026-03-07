import { useParams, useNavigate } from "react-router-dom";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { mockProfiles } from "@/data/mockProfiles";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PublicProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  
  const profile = mockProfiles.find(p => p.id === profileId);

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">The profile you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <ProfileCard profile={profile} />
      </div>
    </div>
  );
};

export default PublicProfile;
