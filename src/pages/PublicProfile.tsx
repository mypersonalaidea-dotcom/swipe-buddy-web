import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Briefcase, BookOpen, Loader2, Home, Search, Users, CheckCircle2, MapPin, Activity, Heart, Info, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePublicProfile } from "@/hooks/useProfile";
import { Separator } from "@/components/ui/separator";

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
  const habits = (profile.my_habits || profile.user_habits || []) as any[];
  const lookingForHabits = (profile.looking_for_habits || []) as any[];
  const searchPrefs = profile.search_preferences;
  const flats = profile.flats || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="border-none shadow-md bg-gradient-to-br from-rose-50/50 to-background overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4">
             <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="capitalize">
               {profile.status || 'Active'}
             </Badge>
          </div>
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden bg-accent/30 relative z-10">
                  {profile.profile_picture_url ? (
                    <img src={profile.profile_picture_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                {profile.email_verified && (
                  <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-md z-20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{profile.name}</h1>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-muted-foreground">
                  {profile.city && (
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {profile.city}{profile.state ? `, ${profile.state}` : ""}
                    </p>
                  )}
                  {profile.age && (
                    <p className="flex items-center gap-1.5 font-medium">
                      <Activity className="w-4 h-4 text-rose-500" />
                      {profile.age} years · {profile.gender}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                  <Badge variant="secondary" className="bg-white/80 border-rose-100 text-rose-700 font-semibold px-3 py-1">
                    {profile.search_type === 'both' ? 'Looking for Flat & Flatmate' : 
                     profile.search_type === 'flat' ? 'Looking for Flat' : 'Looking for Flatmate'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Flats Section */}
            {flats.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 px-1">
                  <Home className="w-5 h-5 text-rose-500" /> Flat Listings
                </h2>
                {flats.map((flat) => (
                  <Card key={flat.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-5 h-full">
                      <div className="sm:col-span-2 bg-muted relative aspect-[4/3] sm:aspect-auto">
                        {flat.photos?.[0] ? (
                          <img src={flat.photos[0]} alt={flat.address} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Home className="w-12 h-12 text-muted-foreground/30" /></div>
                        )}
                        <div className="absolute bottom-2 right-2 flex gap-1">
                           <Badge variant="secondary" className="bg-black/60 text-white border-none backdrop-blur-md">
                             {flat.rooms?.length || 0} Rooms
                           </Badge>
                        </div>
                      </div>
                      <div className="sm:col-span-3 p-4 flex flex-col justify-between space-y-3">
                        <div>
                          <p className="text-sm font-bold text-rose-600 uppercase tracking-wider">{flat.flat_type || 'Residential'}</p>
                          <h3 className="text-lg font-bold leading-tight mt-1 line-clamp-1">{flat.address}</h3>
                          <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {flat.city}, {flat.state}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {flat.common_amenities?.slice(0, 3).map(a => (
                            <Badge key={a} variant="outline" className="text-[10px] font-medium px-2 py-0">{a}</Badge>
                          ))}
                          {(flat.common_amenities?.length || 0) > 3 && (
                            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0">+{flat.common_amenities!.length - 3}</Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <p className="text-sm font-medium">Starts from</p>
                          <p className="text-lg font-black text-foreground">₹{Math.min(...(flat.rooms?.map(r => r.rent) || [0])).toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Work Experience */}
            {jobs.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-rose-500" /> Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobs.map((j: any, idx) => (
                    <div key={j.id || idx} className="flex gap-4 items-start group">
                      <div className="w-12 h-12 rounded-lg bg-accent/20 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {(j.company?.logo_url) ? (
                          <img src={j.company.logo_url} alt={j.company_name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-bold text-foreground leading-none">{typeof j === 'string' ? j : (j.position_name || j.position?.full_name)}</p>
                        {typeof j !== 'string' && (
                          <>
                            <p className="text-sm text-muted-foreground font-medium">
                              {j.company_name || j.company?.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" /> {j.from_year} – {j.currently_working ? "Present" : j.till_year}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {educations.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-rose-500" /> Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {educations.map((e: any, idx) => (
                    <div key={e.id || idx} className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-lg bg-accent/20 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                         {(e.institution?.logo_url) ? (
                           <img src={e.institution.logo_url} alt={e.institution_name} className="w-full h-full object-contain p-1" />
                         ) : (
                           <BookOpen className="w-6 h-6 text-muted-foreground/60" />
                         )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-bold text-foreground leading-none">{typeof e === 'string' ? e : (e.degree_name || e.degree?.common_name)}</p>
                        {typeof e !== 'string' && (
                          <>
                            <p className="text-sm text-muted-foreground font-medium">
                              {e.institution_name || e.institution?.name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" /> {e.start_year} – {e.end_year}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {/* Search Preferences */}
            {searchPrefs && (
              <Card className="border-none shadow-sm bg-rose-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Search className="w-5 h-5 text-rose-500" /> Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" /> Rent Range
                      </span>
                      <span className="font-bold">₹{searchPrefs.min_rent.toLocaleString()} - ₹{searchPrefs.max_rent.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                         <Activity className="w-4 h-4" /> Age Group
                      </span>
                      <span className="font-bold">{searchPrefs.age_min} - {searchPrefs.age_max} years</span>
                    </div>
                    {searchPrefs.location_search && (
                      <div className="flex items-start justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" /> Near
                        </span>
                        <span className="font-bold text-right leading-tight">{searchPrefs.location_search}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-rose-100" />
                  
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest">Property Types</p>
                    <div className="flex flex-wrap gap-1.5">
                       {(searchPrefs.flat_types || []).map(t => (
                         <Badge key={t} variant="secondary" className="bg-white text-rose-700 text-[11px] border border-rose-100">{t}</Badge>
                       ))}
                       {(searchPrefs.furnishing_types || []).map(t => (
                         <Badge key={t} variant="secondary" className="bg-white text-rose-700 text-[11px] border border-rose-100">{t.replace('_', ' ')}</Badge>
                       ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lifestyle & Habits */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" /> Lifestyle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {habits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Their Habits</p>
                    <div className="flex flex-wrap gap-2">
                      {habits.map((h, idx) => (
                        (typeof h !== 'string' && h?.habit) ? (
                          <Badge key={h.id || idx} variant="secondary" className="bg-accent/50 hover:bg-accent border-none">{h.habit.label}</Badge>
                        ) : typeof h === 'string' ? (
                          <Badge key={idx} variant="secondary" className="bg-accent/50 hover:bg-accent border-none">{h}</Badge>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
                
                {lookingForHabits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Looking for in Flatmate</p>
                    <div className="flex flex-wrap gap-2">
                      {lookingForHabits.map((h, idx) => (
                        (typeof h !== 'string' && h?.habit) ? (
                          <Badge key={h.id || idx} variant="outline" className="border-rose-200 text-rose-700 bg-rose-50/50">{h.habit.label}</Badge>
                        ) : typeof h === 'string' ? (
                          <Badge key={idx} variant="outline" className="border-rose-200 text-rose-700 bg-rose-50/50">{h}</Badge>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden">
               <CardContent className="p-0">
                  <Button className="w-full h-12 rounded-none bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2">
                    <Heart className="w-4 h-4 fill-white" /> Save Profile
                  </Button>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
