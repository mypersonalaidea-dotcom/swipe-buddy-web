import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, GraduationCap, Home, Send, Bookmark, MoreVertical, Flag, ShieldOff, ExternalLink } from "lucide-react";
import { MAPBOX_TOKEN, GOOGLE_MAPS_API_KEY, MAP_PROVIDER } from "@/lib/maps/config";
import { getHabitIcon } from "@/constants/habits";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobExperience {
  id: string;
  company: string;
  position: string;
  fromYear: string;
  tillYear: string;
  currentlyWorking: boolean;
}

interface EducationExperience {
  id: string;
  institution: string;
  degree: string;
  startYear: string;
  endYear: string;
}

interface Room {
  id: string;
  type: string;
  rent: string;
  available: number;
  brokerage?: string;
  securityDeposit: string;
  availableFrom: string;
  furnishingType: string;
  amenities: string[];
  photos: string[];
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  state: string;
  profilePicture: string;
  searchType: "flat" | "flatmate";
  myHabits: string[];
  lookingForHabits: string[];
  jobExperiences: JobExperience[];
  educationExperiences: EducationExperience[];
  flatDetails?: {
    address: string;
    /** [longitude, latitude] — populated from AddressAutocomplete */
    coordinates?: [number, number];
    furnishingType: string;
    commonAmenities: string[];
    commonPhotos: string[];
    rooms: Room[];
  };
}

interface ProfileCardProps {
  profile: Profile;
  alreadyInConversation?: boolean;
  onSaveProfile?: (profileId: string, saved: boolean) => void;
  isSaved?: boolean;
}

// Mock list of profile IDs the user has already messaged
const conversationProfileIds = ["1", "3"];

export const ProfileCard = ({ profile, alreadyInConversation, onSaveProfile, isSaved = false }: ProfileCardProps) => {
  const isLookingForFlatmate = profile.searchType === "flatmate";
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);

  // Check if already in conversation (either passed as prop or from mock data)
  const hasExistingConversation = alreadyInConversation ?? conversationProfileIds.includes(profile.id);

  const [message, setMessage] = useState(
    isLookingForFlatmate
      ? `Hey! ${profile.name}, I'm looking for a place and your listing looks great. Can we talk?`
      : `Hey! ${profile.name}, I've got a flat vacancy. Want to know the details?`
  );

  const handleSendMessage = () => {
    console.log("Sending message:", message);
    // TODO: Implement actual message sending
  };

  const handleSaveProfile = () => {
    const newSavedState = !saved;
    setSaved(newSavedState);
    onSaveProfile?.(profile.id, newSavedState);
    toast({
      title: newSavedState ? "Profile Saved" : "Profile Removed",
      description: newSavedState
        ? `${profile.name}'s profile has been saved.`
        : `${profile.name}'s profile has been removed from saved.`,
    });
  };

  return (
    <Card className="shadow-card bg-gradient-card overflow-hidden">
      {/* ── Top Section: Pink gradient header ── */}
      <div className="bg-gradient-to-b from-rose-100/80 to-background px-6 pt-6 pb-4 space-y-4">
        {/* Row 1: Avatar + Info + Actions */}
        <div className="flex items-start justify-between gap-4">
          {/* Avatar with online indicator */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-[3px] border-white shadow-md"
              />
              <span className="absolute bottom-1 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {/* Name, location, tags */}
            <div className="min-w-0 space-y-1.5 pt-0.5">
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {profile.name}<span className="font-normal text-muted-foreground">, {profile.age}</span>
              </h2>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                {profile.city}, {profile.state}
              </p>
              {/* Profession & Education tags */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {profile.jobExperiences.length > 0 && (
                  <Badge variant="outline" className="text-xs font-normal bg-white/70 border-border/60 gap-1">
                    <Briefcase className="w-3 h-3" />
                    {profile.jobExperiences[0].position}
                  </Badge>
                )}
                {profile.educationExperiences.length > 0 && (
                  <Badge variant="outline" className="text-xs font-normal bg-white/70 border-border/60 gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {profile.educationExperiences[0].institution}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right side: bookmark, menu, badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveProfile}
              className="h-9 w-9 rounded-full hover:bg-white/60"
            >
              <Bookmark className={`h-5 w-5 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/60">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border/50">
                <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge
              className={`h-7 px-3 text-xs font-semibold rounded-full border-0 ${
                isLookingForFlatmate
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isLookingForFlatmate ? "Has Flat" : "Looking for Flat"}
            </Badge>
          </div>
        </div>

        {/* Row 2: Conversation bar or Message box */}
        {hasExistingConversation ? (
          <div className="bg-gradient-to-r from-rose-50 to-rose-100/60 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
            <p className="text-sm text-foreground/80">
              In conversation with <span className="font-semibold text-foreground">{profile.name}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px] resize-none bg-white/70 border-border/40"
              placeholder="Type your message..."
            />
            <Button onClick={handleSendMessage} className="w-full" size="lg">
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <CardContent className="space-y-6 pt-6 max-h-[calc(100vh-400px)] overflow-y-auto">
        {/* Flat Details (for flatmate search) */}
        {isLookingForFlatmate && profile.flatDetails && (
          <div className="space-y-6">
            {/* Flat Details - Address & Map */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Home className="h-5 w-5 text-primary" />
                Flat Details
              </h3>

              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-5">
                  {/* Address & Furnishing */}
                  <div className="p-4 md:col-span-3 space-y-2">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                      <span className="text-sm">{profile.flatDetails.address}</span>
                    </p>
                    <div>
                      <span className="font-medium text-foreground text-sm">Furnishing: </span>
                      <Badge variant="outline">{profile.flatDetails.furnishingType}</Badge>
                    </div>
                  </div>

                  {/* Location Map — Static Image */}
                  <div className="relative h-32 bg-muted border-t md:border-t-0 md:border-l border-border md:col-span-2 overflow-hidden">
                    {(() => {
                      const coords = profile.flatDetails.coordinates;
                      if (!coords) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center gap-1.5">
                            <MapPin className="w-5 h-5 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-xs">No location found</p>
                          </div>
                        );
                      }

                      const [lng, lat] = coords;
                      let staticMapUrl = '';

                      if (MAP_PROVIDER === 'google' && GOOGLE_MAPS_API_KEY) {
                        staticMapUrl =
                          `https://maps.googleapis.com/maps/api/staticmap?` +
                          `center=${lat},${lng}&zoom=14&size=400x128&scale=2&maptype=roadmap` +
                          `&markers=color:0x6366f1%7C${lat},${lng}` +
                          `&key=${GOOGLE_MAPS_API_KEY}`;
                      } else if (MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.')) {
                        staticMapUrl =
                          `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
                          `pin-s+6366f1(${lng},${lat})/` +
                          `${lng},${lat},14/400x128@2x?access_token=${MAPBOX_TOKEN}`;
                      }

                      if (!staticMapUrl) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center gap-1.5">
                            <MapPin className="w-5 h-5 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-xs">No map token configured</p>
                          </div>
                        );
                      }

                      return (
                        <>
                          <img
                            src={staticMapUrl}
                            alt="Flat location map"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Open in Maps <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Rooms Available */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Available Rooms</h4>
              {profile.flatDetails.rooms.map((room) => (
                <div key={room.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <h5 className="font-semibold text-foreground">{room.type}</h5>
                    <Badge variant="default">{room.available} Available</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Rent:</span>
                      <p className="text-muted-foreground">{room.rent}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Security Deposit:</span>
                      <p className="text-muted-foreground">{room.securityDeposit}</p>
                    </div>
                    {room.brokerage && (
                      <div>
                        <span className="font-medium text-foreground">Brokerage:</span>
                        <p className="text-muted-foreground">{room.brokerage}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-foreground">Available From:</span>
                      <p className="text-muted-foreground">{room.availableFrom}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Furnishing Type:</span>
                      <p className="text-muted-foreground">{room.furnishingType}</p>
                    </div>
                  </div>

                  {/* Room Amenities */}
                  <div className="space-y-2">
                    <h6 className="text-sm font-medium text-foreground">Room Amenities</h6>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Room Photos */}
                  {room.photos.length > 0 && (
                    <div className="space-y-2">
                      <h6 className="text-sm font-medium text-foreground">Room Photos</h6>
                      <div className="grid grid-cols-3 gap-2">
                        {room.photos.map((photo, idx) => (
                          <div key={idx} className="bg-muted aspect-video rounded-lg" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Common Amenities & Photos */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Common/Flat Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {profile.flatDetails.commonAmenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>

              {/* Common Photos */}
              {profile.flatDetails.commonPhotos.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-foreground">Common Area Photos</h6>
                  <div className="grid grid-cols-3 gap-2">
                    {profile.flatDetails.commonPhotos.map((photo, idx) => (
                      <div key={idx} className="bg-muted aspect-video rounded-lg" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Habits & Looking For - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Habits */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">My Habits</h3>
            <div className="flex flex-wrap gap-2">
              {profile.myHabits.map((habit) => {
                const Icon = getHabitIcon(habit);
                return (
                  <Badge key={habit} variant="secondary" className="flex items-center gap-1.5">
                    {Icon && <Icon className="w-3 h-3" />}
                    {habit}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Looking For Habits */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Looking For in Flatmate</h3>
            <div className="flex flex-wrap gap-2">
              {profile.lookingForHabits.map((habit) => {
                const Icon = getHabitIcon(habit);
                return (
                  <Badge key={habit} variant="default" className="flex items-center gap-1.5">
                    {Icon && <Icon className="w-3 h-3" />}
                    {habit}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>

        {/* Work Experience */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Briefcase className="h-5 w-5 text-primary" />
            Work Experience
          </h3>
          {profile.jobExperiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No work experience added</p>
          ) : (
            <div className="space-y-3">
              {profile.jobExperiences.map((experience) => (
                <div key={experience.id} className="border rounded-lg p-4 space-y-2 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground">{experience.position}</h4>
                      <p className="text-sm text-muted-foreground">{experience.company}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {experience.fromYear} - {experience.currentlyWorking ? 'Present' : experience.tillYear}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            Education
          </h3>
          {profile.educationExperiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No education added</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.educationExperiences.map((education) => (
                <div key={education.id} className="border rounded-lg p-4 space-y-2 bg-muted/30">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{education.degree}</h4>
                    <p className="text-sm text-muted-foreground">{education.institution}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {education.startYear} - {education.endYear}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
