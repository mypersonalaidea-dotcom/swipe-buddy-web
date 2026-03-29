import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Briefcase, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePublicProfile } from "@/hooks/useProfile";

const PublicProfile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { data: profile, isLoading, isError } = usePublicProfile(profileId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {isError ? "There was an error loading this profile. It might be private or the link may have expired." : "The profile you're looking for doesn't exist."}
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const jobs = profile.workExperience || profile.job_experiences || [];
  const educations = profile.education || profile.education_experiences || [];
  const habits = profile.my_habits || profile.user_habits || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full border-2 border-border flex items-center justify-center overflow-hidden bg-accent/30">
                {profile.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                {profile.city && (
                  <p className="text-muted-foreground">{profile.city}{profile.state ? `, ${profile.state}` : ""}</p>
                )}
                {profile.age && (
                  <p className="text-sm text-muted-foreground">{profile.age} years old · {profile.gender}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Experience */}
        {jobs.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Work Experience
              </h2>
              {jobs.map((j, idx) => (
                typeof j === 'string' ? (
                  <div key={idx} className="pl-2 border-l-2 border-primary/30">
                    <p className="font-medium">{j}</p>
                  </div>
                ) : (
                  <div key={j.id} className="pl-2 border-l-2 border-primary/30">
                    <p className="font-medium">{j.position_name || j.position?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {j.company_name || j.company?.name} · {j.from_year} – {j.currently_working ? "Present" : j.till_year}
                    </p>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {educations.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Education
              </h2>
              {educations.map((e, idx) => (
                typeof e === 'string' ? (
                  <div key={idx} className="pl-2 border-l-2 border-primary/30">
                    <p className="font-medium">{e}</p>
                  </div>
                ) : (
                  <div key={e.id} className="pl-2 border-l-2 border-primary/30">
                    <p className="font-medium">{e.degree_name || e.degree?.common_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.institution_name || e.institution?.name} · {e.start_year} – {e.end_year}
                    </p>
                  </div>
                )
              ))}
            </CardContent>
          </Card>
        )}

        {/* Habits */}
        {habits.length > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="font-semibold text-foreground">Lifestyle</h2>
              <div className="flex flex-wrap gap-2">
                {habits.map((h, idx) => (
                  (typeof h !== 'string' && h?.habit) ? (
                    <Badge key={h.id || idx} variant="secondary">{h.habit.label}</Badge>
                  ) : typeof h === 'string' ? (
                    <Badge key={idx} variant="secondary">{h}</Badge>
                  ) : null
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
