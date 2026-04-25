import { useState, useEffect, useCallback, useMemo } from "react";
import { habitCategories, getCategoryForHabit } from "@/constants/habits";
import { ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Home, Users, Heart, Building2, Briefcase, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { AdCard } from "@/components/ads/AdCard";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useFlats } from "@/hooks/useFlats";
import { useUpdateSearchPreferences } from "@/hooks/useProfile";
import { useSavedProfiles } from "@/hooks/useSocial";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, DoorOpen, Camera, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MediaUpload } from "@/components/ui/media-upload";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { BrandMultiSelect, BrandOption } from "@/components/ui/brand-multi-select";
import { AddressAutocomplete } from "@/components/map/AddressAutocomplete";
import { GoogleMapRenderer } from "@/components/map/GoogleMapRenderer";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/config";
import type { GeocodeResult, LngLat } from "@/lib/maps/types";

// ---- Google Ads configuration ----
// TODO: Replace these with your real AdSense publisher ID and ad slot ID
const AD_CLIENT = "ca-pub-2938555455040927"; // Your AdSense publisher ID
const AD_SLOT = "6643881699";                // Your AdSense ad slot ID
const AD_INTERVAL = 5;                        // Show an ad card after every N profile cards

// ---- Types for flat details ----
interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface RoomDetails {
  id: string;
  roomType: "private" | "shared" | "studio";
  quantity: string;
  rent: string;
  securityDeposit: string;
  brokerage: string;
  availableFrom: string;
  amenities: string[];
  media: MediaFile[];
}

const roomAmenitiesList = [
  "Attached Bathroom", "AC", "WiFi", "Wardrobe", "Bed with Mattress",
  "Study Table", "Balcony", "Geyser", "TV", "Window"
];

const commonAmenitiesList = [
  "WiFi", "Parking", "Washing Machine", "Refrigerator", "Kitchen",
  "Gym", "Power Backup", "Security", "Lift", "Swimming Pool", "Balcony"
];
const roomTypeLabels: Record<string, string> = {
  "private": "Private Room",
  "shared": "Shared Room",
  "studio": "Studio"
};

export const HomePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"left" | "right" | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { toast } = useToast();
  const { mutate: updateSearchPreferences } = useUpdateSearchPreferences();

  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  
  // --- Real flat profiles from API ---
  const { data: flatsData, isLoading: flatsLoading } = useFlats(appliedFilters);
  const { data: savedProfilesData = [] } = useSavedProfiles();

  const profiles = (flatsData ?? []).map(flat => {
    const profileId = flat.user_id;
    const isSaved = savedProfilesData.some(p => p.id === profileId);

    return {
      id: profileId, // Keep profile ID for saving/chatting
      name: flat.user?.name ?? "Unknown",
      age: flat.user?.age ?? 0,
      city: flat.city ?? "Unknown",
      state: flat.state ?? "",
      gender: flat.user?.gender ?? "",
      profilePicture: flat.user?.profile_picture_url ?? "",
      searchType: "flatmate" as const,
      isSaved: isSaved,
      myHabits: flat.user?.user_habits ?? [],
      lookingForHabits: [] as string[],
      jobExperiences: (flat.user?.jobExperiencesDetailed?.length ? flat.user.jobExperiencesDetailed : flat.user?.workExperience) ?? [],
      educationExperiences: (flat.user?.educationDetailed?.length ? flat.user.educationDetailed : flat.user?.education) ?? [],
      flatDetails: {
        id: flat.id, // For flat-specific operations
        address: flat.address ?? "",
        coordinates: flat.latitude && flat.longitude
          ? [parseFloat(flat.longitude), parseFloat(flat.latitude)] as [number, number]
          : undefined,
        flatType: flat.flat_type ?? "",
        furnishingType: flat.furnishing_type ?? "",
        description: flat.description ?? "",
        commonAmenities: flat.common_amenities ?? [],
        commonPhotos: flat.media?.filter(m => m.media_type === "image").map(m => m.media_url) ?? [],
        rooms: (flat.rooms ?? []).map(r => ({
          id: r.id,
          name: r.room_name || undefined,
          type: r.room_type,
          rent: `₹${Number(r.rent || 0).toLocaleString()}/mo`,
          available: r.available_count,
          securityDeposit: r.security_deposit ? `${r.security_deposit} Month` : '',
          brokerage: r.brokerage ? `${r.brokerage} days` : '',
          availableFrom: r.available_from ?? "",
          furnishingType: r.furnishing_type ?? flat.furnishing_type ?? "",
          description: r.description ?? "",
          amenities: r.room_amenities ?? [],
          photos: r.media?.filter(m => m.media_type === "image").map(m => m.media_url) ?? [],
        })),
      },
    };
  });

  // ---- Build a mixed swipe stack: profiles interleaved with ad cards ----
  type SwipeItem =
    | { type: "profile"; data: (typeof profiles)[number] }
    | { type: "ad"; key: string };

  const swipeItems: SwipeItem[] = useMemo(() => {
    const items: SwipeItem[] = [];
    profiles.forEach((profile, idx) => {
      items.push({ type: "profile", data: profile });
      // Insert an ad card after every AD_INTERVAL profiles
      if ((idx + 1) % AD_INTERVAL === 0) {
        items.push({ type: "ad", key: `ad-after-${idx}` });
      }
    });
    // Also add an ad card at the very end if the last item isn't already an ad
    if (profiles.length > 0 && profiles.length % AD_INTERVAL !== 0) {
      items.push({ type: "ad", key: "ad-end" });
    }
    return items;
  }, [profiles]);

  const [userSearchType] = useState<"flat" | "flatmate" | "both">("both");
  const [hasFlatDetails, setHasFlatDetails] = useState(
    () => userSearchType === "flatmate" || userSearchType === "both"
  );

  // --- Checkbox states for filter sections ---
  const [flatFilterEnabled, setFlatFilterEnabled] = useState(
    userSearchType === "flat" || userSearchType === "both"
  );
  const [flatmateFilterEnabled, setFlatmateFilterEnabled] = useState(
    userSearchType === "flatmate" || userSearchType === "both"
  );

  // --- Collapsible states ---
  const [flatExpanded, setFlatExpanded] = useState(false);
  const [flatmateExpanded, setFlatmateExpanded] = useState(false);

  // --- Flat details inline collapsible ---
  const [flatDetailsExpanded, setFlatDetailsExpanded] = useState(false);
  const [flatDetailsDirty, setFlatDetailsDirty] = useState(false);
  const [savedFlatDetails, setSavedFlatDetails] = useState({
    address: "", description: "", commonAmenities: [] as string[],
    commonMedia: [] as MediaFile[], rooms: [] as RoomDetails[]
  });

  // --- Flatmate filters ---
  const [flatmateAgeRange, setFlatmateAgeRange] = useState([18, 60]);
  const [flatmateHabits, setFlatmateHabits] = useState<string[]>([]);
  const [flatmateMoveInDate, setFlatmateMoveInDate] = useState<Date>();

  const handleHabitToggle = (habit: string) => {
    setFlatmateHabits(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]);
  };

  // --- Flat filters ---
  const [locationSearch, setLocationSearch] = useState("");
  const [filterMapCenter, setFilterMapCenter] = useState<LngLat>(DEFAULT_MAP_CENTER);
  const [filterCoordinates, setFilterCoordinates] = useState<LngLat | null>(null);
  const [locationRange, setLocationRange] = useState([5]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [flatTypes, setFlatTypes] = useState<string[]>([]);
  const [furnishingTypes, setFurnishingTypes] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState<Date>();
  const [brokerage, setBrokerage] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const [commonAreaAmenities, setCommonAreaAmenities] = useState<string[]>([]);

  const handleFilterLocationSelect = useCallback((result: GeocodeResult) => {
    setLocationSearch(result.fullAddress);
    setFilterMapCenter(result.coordinates);
    setFilterCoordinates(result.coordinates);
  }, []);
  const [flatFilterHabits, setFlatFilterHabits] = useState<string[]>([]);
  const handleFlatHabitToggle = (habit: string) => {
    setFlatFilterHabits(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]);
  };
  // --- Flatmate profile filters ---
  const [flatmateProfileEnabled, setFlatmateProfileEnabled] = useState(false);
  const [flatmateProfileExpanded, setFlatmateProfileExpanded] = useState(false);
  const [flatmateProfileHabits, setFlatmateProfileHabits] = useState<string[]>([]);
  const [flatmateCompanies, setFlatmateCompanies] = useState<string[]>([]);
  const [flatmateSchools, setFlatmateSchools] = useState<string[]>([]);
  const [companiesDb, setCompaniesDb] = useState<BrandOption[]>([
    { id: "c1", name: "Google", aliases: ["Alphabet"], logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" },
    { id: "c2", name: "TCS", aliases: ["Tata Consultancy Services"], logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg" },
    { id: "c3", name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  ]);
  const [schoolsDb, setSchoolsDb] = useState<BrandOption[]>([
    { id: "s1", name: "IIT Delhi", aliases: ["Indian Institute of Technology Delhi"], logo: "https://upload.wikimedia.org/wikipedia/en/1/1d/Indian_Institute_of_Technology_Delhi_Logo.svg" },
    { id: "s2", name: "NIT Trichy", aliases: ["National Institute of Technology"], logo: "https://upload.wikimedia.org/wikipedia/en/c/c4/National_Institute_of_Technology%2C_Tiruchirappalli_Logo.png" },
  ]);
  const handleFlatmateProfileHabitToggle = (habit: string) => {
    setFlatmateProfileHabits(prev => prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]);
  };
  const handleFlatmateProfileCheckbox = (checked: boolean | "indeterminate") => {
    const val = checked === true;
    setFlatmateProfileEnabled(val);
    if (val) setFlatmateProfileExpanded(true);
    else setFlatmateProfileExpanded(false);
  };

  // --- User profile habits (source of truth) ---
  const [userProfileHabits, setUserProfileHabits] = useState<string[]>([]);
  const [flatHabitsExpanded, setFlatHabitsExpanded] = useState(false);
  const [flatmateHabitsExpanded, setFlatmateHabitsExpanded] = useState(false);
  const [habitsPopupOpen, setHabitsPopupOpen] = useState(false);
  const [popupHabits, setPopupHabits] = useState<string[]>([]);
  const hasProfileHabits = userProfileHabits.length > 0;
  const [flatAmenitiesExpanded, setFlatAmenitiesExpanded] = useState(false);

  const openHabitsPopup = () => {
    setPopupHabits([...userProfileHabits]);
    setHabitsPopupOpen(true);
  };

  const togglePopupHabit = (habit: string) => {
    const category = getCategoryForHabit(habit);
    if (!category) return;
    const categoryLabels = category.options.map(o => o.label);
    const filtered = popupHabits.filter(h => !categoryLabels.includes(h));
    if (popupHabits.includes(habit)) {
      setPopupHabits(filtered);
    } else {
      setPopupHabits([...filtered, habit]);
    }
  };

  const savePopupHabits = () => {
    setUserProfileHabits(popupHabits);
    setHabitsPopupOpen(false);
    toast({
      title: "Habits Updated",
      description: "Your habits have been saved to your profile.",
    });
  };

  const handleRoomAmenityToggle = (amenity: string) => {
    setRoomAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };
  const handleCommonAmenityToggle = (amenity: string) => {
    setCommonAreaAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  // --- Flat details form state ---
  const [onboardAddress, setOnboardAddress] = useState("");
  const [onboardFlatType, setOnboardFlatType] = useState("");
  const [onboardFlatFurnishing, setOnboardFlatFurnishing] = useState("");
  const [onboardDescription, setOnboardDescription] = useState("");
  const [onboardCommonAmenities, setOnboardCommonAmenities] = useState<string[]>([]);
  const [onboardCommonMedia, setOnboardCommonMedia] = useState<MediaFile[]>([]);
  const [onboardRooms, setOnboardRooms] = useState<RoomDetails[]>([]);

  const addOnboardRoom = () => {
    setFlatDetailsDirty(true);
    setOnboardRooms(prev => [...prev, {
      id: Date.now().toString(), roomType: "private", quantity: "", rent: "",
      securityDeposit: "2 Month", brokerage: "15 Day", availableFrom: "", amenities: [], media: []
    }]);
  };
  const removeOnboardRoom = (id: string) => { setFlatDetailsDirty(true); setOnboardRooms(prev => prev.filter(r => r.id !== id)); };
  const updateOnboardRoom = (id: string, field: keyof RoomDetails, value: any) => {
    setFlatDetailsDirty(true);
    setOnboardRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const toggleOnboardRoomAmenity = (roomId: string, amenity: string) => {
    setFlatDetailsDirty(true);
    setOnboardRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const amenities = r.amenities.includes(amenity) ? r.amenities.filter(a => a !== amenity) : [...r.amenities, amenity];
      return { ...r, amenities };
    }));
  };
  const toggleOnboardCommonAmenity = (amenity: string) => {
    setFlatDetailsDirty(true);
    setOnboardCommonAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  // --- Checkbox handlers ---
  const handleFlatCheckbox = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setFlatFilterEnabled(isChecked);
    if (!isChecked) setFlatExpanded(false);
  };

  const handleFlatmateCheckbox = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    if (isChecked) {
      setFlatmateFilterEnabled(true);
      setFlatmateExpanded(true);
      setFlatDetailsExpanded(true);
    } else {
      if (flatDetailsDirty) {
        toast({ title: "Unsaved changes", description: "Please save or cancel your flat details first.", variant: "destructive" });
        return;
      }
      setFlatmateFilterEnabled(false);
      setFlatmateExpanded(false);
    }
  };

  const handleFlatDetailsSave = () => {
    if (!onboardAddress) {
      toast({ title: "Error", description: "Please enter your flat address", variant: "destructive" });
      return;
    }
    setSavedFlatDetails({
      address: onboardAddress, description: onboardDescription,
      commonAmenities: [...onboardCommonAmenities], commonMedia: [...onboardCommonMedia],
      rooms: JSON.parse(JSON.stringify(onboardRooms))
    });
    setHasFlatDetails(true);
    setFlatDetailsDirty(false);
    toast({ title: "Flat details saved! 🏠", description: "Your flat details have been updated." });
  };

  const handleFlatDetailsCancel = () => {
    setOnboardAddress(savedFlatDetails.address);
    setOnboardDescription(savedFlatDetails.description);
    setOnboardCommonAmenities([...savedFlatDetails.commonAmenities]);
    setOnboardCommonMedia([...savedFlatDetails.commonMedia]);
    setOnboardRooms(JSON.parse(JSON.stringify(savedFlatDetails.rooms)));
    setFlatDetailsDirty(false);
  };

  const handleFlatDetailsToggle = () => {
    if (flatDetailsExpanded && flatDetailsDirty) {
      toast({ title: "Unsaved changes", description: "Please save or cancel your changes before closing.", variant: "destructive" });
      return;
    }
    setFlatDetailsExpanded(prev => !prev);
  };

  // --- Navigation (uses swipeItems length instead of profiles) ---
  const handleNext = () => {
    if (isAnimating || currentIndex >= swipeItems.length - 1) return;
    setIsAnimating(true);
    setAnimationDirection("left");
    setTimeout(() => { setCurrentIndex(prev => prev + 1); setIsAnimating(false); setAnimationDirection(null); }, 300);
  };
  const handlePrevious = () => {
    if (isAnimating || currentIndex <= 0) return;
    setIsAnimating(true);
    setAnimationDirection("right");
    setTimeout(() => { setCurrentIndex(prev => prev - 1); setIsAnimating(false); setAnimationDirection(null); }, 300);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrevious();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex, isAnimating]);

  return (
    <div className="h-screen flex flex-col relative">
      {/* Floating Filter Button */}
      <Button onClick={() => setIsFilterOpen(true)} className="absolute top-4 right-4 md:left-4 md:right-auto z-20 shadow-lg" variant="default">
        <SlidersHorizontal className="w-4 h-4 mr-2" />
        Filters
      </Button>

      {/* ===================== FILTER DIALOG ===================== */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pt-4">
            <div className="space-y-4">
              {/* ===== LOOKING FOR FLAT — Checkbox + Collapsible ===== */}
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => flatFilterEnabled && setFlatExpanded(prev => !prev)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="filter-flat"
                      checked={flatFilterEnabled}
                      onCheckedChange={handleFlatCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor="filter-flat" className="font-medium text-base cursor-pointer flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Home className="w-4 h-4" />
                      Looking for Flat
                    </Label>
                  </div>
                  {flatFilterEnabled && (
                    <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", flatExpanded && "rotate-180")} />
                  )}
                </div>

                {flatFilterEnabled && flatExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <AddressAutocomplete
                        value={locationSearch}
                        placeholder="Search location..."
                        onSelect={handleFilterLocationSelect}
                        onChange={setLocationSearch}
                        countryCode="in"
                      />
                      <div className="rounded-lg overflow-hidden border border-border">
                        <GoogleMapRenderer
                          center={filterMapCenter}
                          zoom={12}
                          radius={locationRange[0]}
                          onMarkerDragEnd={handleFilterLocationSelect}
                          height="160px"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Search Range: {locationRange[0]} km</Label>
                      <Slider value={locationRange} onValueChange={setLocationRange} min={1} max={50} step={1} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Flat Type</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between text-left font-normal">
                              {flatTypes.length > 0 ? `${flatTypes.length} selected` : "Select flat type"}
                              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-2" align="start">
                            {[
                              { value: "1rk", label: "1 RK" },
                              { value: "1bhk", label: "1 BHK" },
                              { value: "2bhk", label: "2 BHK" },
                              { value: "3bhk", label: "3 BHK" },
                              { value: "4bhk", label: "4 BHK" },
                              { value: "4+bhk", label: "4+ BHK" },
                            ].map((type) => (
                              <div key={type.value} className="flex items-center space-x-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer" onClick={() => setFlatTypes(prev => prev.includes(type.value) ? prev.filter(t => t !== type.value) : [...prev, type.value])}>
                                <Checkbox checked={flatTypes.includes(type.value)} />
                                <Label className="text-sm font-normal cursor-pointer">{type.label}</Label>
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Furnishing</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between text-left font-normal">
                              {furnishingTypes.length > 0 ? `${furnishingTypes.length} selected` : "Select furnishing"}
                              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-2" align="start">
                            {[
                              { value: "non-furnished", label: "Non Furnished" },
                              { value: "semi-furnished", label: "Semi-Furnished" },
                              { value: "fully-furnished", label: "Fully Furnished" },
                            ].map((type) => (
                              <div key={type.value} className="flex items-center space-x-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer" onClick={() => setFurnishingTypes(prev => prev.includes(type.value) ? prev.filter(t => t !== type.value) : [...prev, type.value])}>
                                <Checkbox checked={furnishingTypes.includes(type.value)} />
                                <Label className="text-sm font-normal cursor-pointer">{type.label}</Label>
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Room Type</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between text-left font-normal">
                              {roomTypes.length > 0 ? `${roomTypes.length} selected` : "Select room type"}
                              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-2" align="start">
                            {[
                              { value: "private", label: "Private" },
                              { value: "shared", label: "Shared" },
                              { value: "studio", label: "Studio" },
                            ].map((type) => (
                              <div key={type.value} className="flex items-center space-x-2 p-1.5 rounded hover:bg-accent/50 cursor-pointer" onClick={() => setRoomTypes(prev => prev.includes(type.value) ? prev.filter(t => t !== type.value) : [...prev, type.value])}>
                                <Checkbox checked={roomTypes.includes(type.value)} />
                                <Label className="text-sm font-normal cursor-pointer">{type.label}</Label>
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Available From</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !availableFrom && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {availableFrom ? format(availableFrom, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={availableFrom} onSelect={setAvailableFrom} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Rent Range: ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}{priceRange[1] >= 100000 ? '+' : ''}</Label>
                      <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={100000} step={1000} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Brokerage</Label>
                        <Select value={brokerage} onValueChange={setBrokerage}>
                          <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">No Brokerage</SelectItem>
                            <SelectItem value="upto15days">Upto 15 Days</SelectItem>
                            <SelectItem value="upto1month">Upto 1 Month</SelectItem>
                            <SelectItem value="upto2months">Upto 2 Months</SelectItem>
                            <SelectItem value="upto3months">Upto 3 Months</SelectItem>
                            <SelectItem value="morethan3months">More than 3 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Security Deposit</Label>
                        <Select value={securityDeposit} onValueChange={setSecurityDeposit}>
                          <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Deposit</SelectItem>
                            <SelectItem value="upto15days">Upto 15 Days</SelectItem>
                            <SelectItem value="upto1month">Upto 1 Month</SelectItem>
                            <SelectItem value="upto2months">Upto 2 Months</SelectItem>
                            <SelectItem value="upto3months">Upto 3 Months</SelectItem>
                            <SelectItem value="morethan3months">More than 3 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-accent/40 cursor-pointer select-none hover:bg-accent/60 transition-colors"
                        onClick={() => setFlatAmenitiesExpanded(prev => !prev)}
                      >
                        <div className="flex items-center gap-2">
                          <DoorOpen className="w-4 h-4" />
                          <span className="font-medium text-sm">Amenities</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", flatAmenitiesExpanded && "rotate-180")} />
                      </div>
                      {flatAmenitiesExpanded && (
                        <div className="p-4 space-y-4 border-t">
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Room Amenities</span>
                            <div className="flex flex-wrap gap-2">
                              {roomAmenitiesList.map((amenity) => {
                                const isSelected = roomAmenities.includes(amenity);
                                return (
                                  <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => handleRoomAmenityToggle(amenity)}
                                    className={`px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${isSelected
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                                      }`}
                                  >
                                    {amenity}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Common Amenities</span>
                            <div className="flex flex-wrap gap-2">
                              {commonAmenitiesList.map((amenity) => {
                                const isSelected = commonAreaAmenities.includes(amenity);
                                return (
                                  <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => handleCommonAmenityToggle(amenity)}
                                    className={`px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${isSelected
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                                      }`}
                                  >
                                    {amenity}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                )}
              </Card>

              {/* ===== LOOKING FOR FLATMATE — Checkbox + Collapsible ===== */}
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => flatmateFilterEnabled && setFlatmateExpanded(prev => !prev)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="filter-flatmate"
                      checked={flatmateFilterEnabled}
                      onCheckedChange={handleFlatmateCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor="filter-flatmate" className="font-medium text-base cursor-pointer flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Users className="w-4 h-4" />
                      Looking for Flatmate
                    </Label>
                  </div>
                  {flatmateFilterEnabled && (
                    <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", flatmateExpanded && "rotate-180")} />
                  )}
                </div>

                {flatmateFilterEnabled && flatmateExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-4">

                    {/* ---- YOUR FLAT DETAILS — Inline Collapsible Sub-section ---- */}
                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 bg-accent/40 cursor-pointer select-none hover:bg-accent/60 transition-colors"
                        onClick={handleFlatDetailsToggle}
                      >
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          <span className="font-medium text-sm">Your Flat Details</span>
                          {flatDetailsDirty && (
                            <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Unsaved</span>
                          )}
                          {hasFlatDetails && !flatDetailsDirty && (
                            <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Saved</span>
                          )}
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", flatDetailsExpanded && "rotate-180")} />
                      </div>

                      {flatDetailsExpanded && (
                        <div className="p-4 space-y-4 border-t">
                          {/* Address */}
                          <div className="space-y-2">
                            <Label htmlFor="onboard-address">Flat Address</Label>
                            <Input id="onboard-address" placeholder="123 Main St, City" value={onboardAddress} onChange={(e) => { setFlatDetailsDirty(true); setOnboardAddress(e.target.value); }} />
                          </div>

                          {/* Flat Type */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                Flat Type
                              </Label>
                              <Select value={onboardFlatType} onValueChange={(v) => { setFlatDetailsDirty(true); setOnboardFlatType(v); }}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select flat type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1rk">1 RK</SelectItem>
                                  <SelectItem value="1bhk">1 BHK</SelectItem>
                                  <SelectItem value="2bhk">2 BHK</SelectItem>
                                  <SelectItem value="3bhk">3 BHK</SelectItem>
                                  <SelectItem value="4bhk">4 BHK</SelectItem>
                                  <SelectItem value="4+bhk">4+ BHK</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                Furnishing
                              </Label>
                              <Select value={onboardFlatFurnishing} onValueChange={(v) => { setFlatDetailsDirty(true); setOnboardFlatFurnishing(v); }}>
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select furnishing" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="non-furnished">Non Furnished</SelectItem>
                                  <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                                  <SelectItem value="fully-furnished">Fully Furnished</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Rooms */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <DoorOpen className="w-4 h-4" /> Available Rooms
                              </h4>
                              <Button type="button" onClick={addOnboardRoom} variant="outline" size="sm" className="h-7 text-xs flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Room
                              </Button>
                            </div>

                            {onboardRooms.length === 0 ? (
                              <div className="text-center py-6 text-muted-foreground border rounded-lg bg-accent/20 text-sm">
                                <DoorOpen className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                <p>No rooms added yet. Click "Add Room" to get started.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {onboardRooms.map((room, index) => (
                                  <div key={room.id} className="border rounded-lg p-3 space-y-3 bg-accent/20">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium text-sm">Room #{index + 1}</h5>
                                      <Button type="button" onClick={() => removeOnboardRoom(room.id)} variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Room Type</Label>
                                      <RadioGroup value={room.roomType} onValueChange={(value) => updateOnboardRoom(room.id, 'roomType', value)} className="grid grid-cols-2 gap-1.5">
                                        {Object.entries(roomTypeLabels).map(([value, label]) => (
                                          <div key={value} className="flex items-center space-x-2 border rounded-md p-2 hover:bg-accent/50 transition-colors">
                                            <RadioGroupItem value={value} id={`ob-${room.id}-${value}`} />
                                            <Label htmlFor={`ob-${room.id}-${value}`} className="text-xs cursor-pointer">{label}</Label>
                                          </div>
                                        ))}
                                      </RadioGroup>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Quantity</Label>
                                        <Input type="number" min={1} placeholder="1" value={room.quantity} onChange={(e) => updateOnboardRoom(room.id, 'quantity', e.target.value)} className="h-8 text-sm" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Rent (₹/month)</Label>
                                        <Input type="number" placeholder="Ex: 15000" value={room.rent} onChange={(e) => updateOnboardRoom(room.id, 'rent', e.target.value)} className="h-8 text-sm" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs">Security Deposit</Label>
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <span className="text-[10px] text-muted-foreground">None</span>
                                            <Checkbox
                                              checked={room.securityDeposit.startsWith('none|')}
                                              onCheckedChange={(checked) => { setFlatDetailsDirty(true); if (checked) { updateOnboardRoom(room.id, 'securityDeposit', `none|${room.securityDeposit || '2 Month'}`); } else { updateOnboardRoom(room.id, 'securityDeposit', room.securityDeposit.replace('none|', '')); } }}
                                              className="h-3.5 w-3.5"
                                            />
                                          </label>
                                        </div>
                                        <div className={`flex gap-1.5 transition-opacity ${room.securityDeposit.startsWith('none|') ? 'opacity-40 pointer-events-none' : ''}`}>
                                          <Input type="number" min={1} placeholder="Ex: 2" value={(room.securityDeposit.replace('none|', ''))?.split(' ')[0] || ''} onChange={(e) => { setFlatDetailsDirty(true); const raw = room.securityDeposit.replace('none|', ''); const unit = raw?.split(' ')[1] || 'Month'; updateOnboardRoom(room.id, 'securityDeposit', e.target.value ? `${e.target.value} ${unit}` : ''); }} className="h-8 text-sm flex-1" />
                                          <Select value={(room.securityDeposit.replace('none|', ''))?.split(' ')[1] || 'Month'} onValueChange={(unit) => { setFlatDetailsDirty(true); const raw = room.securityDeposit.replace('none|', ''); const count = raw?.split(' ')[0] || ''; updateOnboardRoom(room.id, 'securityDeposit', count ? `${count} ${unit}` : ''); }}>
                                            <SelectTrigger className="h-8 text-sm w-[80px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Day">Day</SelectItem>
                                              <SelectItem value="Month">Month</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs">Brokerage</Label>
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <span className="text-[10px] text-muted-foreground">None</span>
                                            <Checkbox
                                              checked={room.brokerage.startsWith('none|')}
                                              onCheckedChange={(checked) => { setFlatDetailsDirty(true); if (checked) { updateOnboardRoom(room.id, 'brokerage', `none|${room.brokerage || '15 Day'}`); } else { updateOnboardRoom(room.id, 'brokerage', room.brokerage.replace('none|', '')); } }}
                                              className="h-3.5 w-3.5"
                                            />
                                          </label>
                                        </div>
                                        <div className={`flex gap-1.5 transition-opacity ${room.brokerage.startsWith('none|') ? 'opacity-40 pointer-events-none' : ''}`}>
                                          <Input type="number" min={1} placeholder="Ex: 1" value={(room.brokerage.replace('none|', ''))?.split(' ')[0] || ''} onChange={(e) => { setFlatDetailsDirty(true); const raw = room.brokerage.replace('none|', ''); const unit = raw?.split(' ')[1] || 'Month'; updateOnboardRoom(room.id, 'brokerage', e.target.value ? `${e.target.value} ${unit}` : ''); }} className="h-8 text-sm flex-1" />
                                          <Select value={(room.brokerage.replace('none|', ''))?.split(' ')[1] || 'Month'} onValueChange={(unit) => { setFlatDetailsDirty(true); const raw = room.brokerage.replace('none|', ''); const count = raw?.split(' ')[0] || ''; updateOnboardRoom(room.id, 'brokerage', count ? `${count} ${unit}` : ''); }}>
                                            <SelectTrigger className="h-8 text-sm w-[80px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="Day">Day</SelectItem>
                                              <SelectItem value="Month">Month</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Available From</Label>
                                      <Input type="date" value={room.availableFrom} onChange={(e) => updateOnboardRoom(room.id, 'availableFrom', e.target.value)} className="h-8 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Room Amenities</Label>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {roomAmenitiesList.map((amenity) => (
                                          <div key={amenity} className="flex items-center space-x-2">
                                            <Checkbox id={`ob-rm-${room.id}-${amenity}`} checked={room.amenities.includes(amenity)} onCheckedChange={() => toggleOnboardRoomAmenity(room.id, amenity)} />
                                            <Label htmlFor={`ob-rm-${room.id}-${amenity}`} className="text-xs">{amenity}</Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs flex items-center gap-1"><Camera className="w-3 h-3" /> Room Photos</Label>
                                      <MediaUpload value={room.media || []} onChange={(mediaFiles) => updateOnboardRoom(room.id, 'media', mediaFiles)} maxFiles={5} acceptedTypes={['image/*', 'video/*']} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Common Amenities */}
                          <div className="space-y-2 pt-2 border-t">
                            <Label className="text-sm font-semibold">Common Amenities</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {commonAmenitiesList.map((amenity) => (
                                <div key={amenity} className="flex items-center space-x-2">
                                  <Checkbox id={`ob-common-${amenity}`} checked={onboardCommonAmenities.includes(amenity)} onCheckedChange={() => toggleOnboardCommonAmenity(amenity)} />
                                  <Label htmlFor={`ob-common-${amenity}`} className="text-xs">{amenity}</Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label htmlFor="onboard-description" className="text-sm">Flat Description</Label>
                            <Textarea id="onboard-description" placeholder="Tell potential flatmates about your place..." value={onboardDescription} onChange={(e) => { setFlatDetailsDirty(true); setOnboardDescription(e.target.value); }} rows={2} className="text-sm" maxLength={800} />
                            <p className="text-xs text-muted-foreground text-right">{onboardDescription.length}/800</p>
                          </div>

                          {/* Common Photos */}
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1"><Camera className="w-3 h-3" /> Common Area Photos</Label>
                            <MediaUpload value={onboardCommonMedia} onChange={(v) => { setFlatDetailsDirty(true); setOnboardCommonMedia(v); }} maxFiles={10} acceptedTypes={['image/*', 'video/*']} />
                          </div>

                          {/* Save / Cancel buttons */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm" className="flex-1 flex items-center gap-1" onClick={handleFlatDetailsCancel} disabled={!flatDetailsDirty}>
                              <X className="w-3 h-3" /> Cancel Changes
                            </Button>
                            <Button variant="gradient" size="sm" className="flex-1 flex items-center gap-1" onClick={handleFlatDetailsSave} disabled={!flatDetailsDirty}>
                              <Save className="w-3 h-3" /> Save Details
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ---- FLATMATE FILTERS (below flat details) ---- */}

                    <div className="space-y-2">
                      <Label>Move-in Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !flatmateMoveInDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {flatmateMoveInDate ? format(flatmateMoveInDate, "PPP") : <span>Select move-in date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={flatmateMoveInDate} onSelect={setFlatmateMoveInDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </Card>

              {/* ===== FLATMATE PROFILE — Checkbox + Collapsible ===== */}
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-accent/50 transition-colors"
                  onClick={() => flatmateProfileEnabled && setFlatmateProfileExpanded(prev => !prev)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="filter-flatmate-profile"
                      checked={flatmateProfileEnabled}
                      onCheckedChange={handleFlatmateProfileCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Label htmlFor="filter-flatmate-profile" className="font-medium text-base cursor-pointer flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Users className="w-4 h-4" />
                      Flatmate Profile
                    </Label>
                  </div>
                  {flatmateProfileEnabled && (
                    <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", flatmateProfileExpanded && "rotate-180")} />
                  )}
                </div>
                {flatmateProfileEnabled && flatmateProfileExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {/* Age Range */}
                    <div className="space-y-2">
                      <Label>Age Range: {flatmateAgeRange[0]} - {flatmateAgeRange[1]}{flatmateAgeRange[1] >= 60 ? '+' : ''} years</Label>
                      <Slider value={flatmateAgeRange} onValueChange={setFlatmateAgeRange} min={18} max={60} step={1} />
                    </div>
                    {/* Company & School */}
                    <div className="grid grid-cols-2 gap-4">
                      <BrandMultiSelect
                        label="Company"
                        icon={<Briefcase className="w-4 h-4" />}
                        placeholder="Search companies..."
                        options={companiesDb}
                        selectedValues={flatmateCompanies}
                        onSelectedValuesChange={setFlatmateCompanies}
                        onAddNewBrand={(brand) => {
                          const newBrand = { ...brand, id: `c-new-${Date.now()}` };
                          setCompaniesDb((prev) => [...prev, newBrand]);
                          setFlatmateCompanies((prev) => [...prev, newBrand.id]);
                        }}
                      />
                      <BrandMultiSelect
                        label="School / College"
                        icon={<GraduationCap className="w-4 h-4" />}
                        placeholder="Search schools..."
                        options={schoolsDb}
                        selectedValues={flatmateSchools}
                        onSelectedValuesChange={setFlatmateSchools}
                        onAddNewBrand={(brand) => {
                          const newBrand = { ...brand, id: `s-new-${Date.now()}` };
                          setSchoolsDb((prev) => [...prev, newBrand]);
                          setFlatmateSchools((prev) => [...prev, newBrand.id]);
                        }}
                      />
                    </div>
                    {/* Flatmate Habits */}
                    <div className="space-y-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flatmate Habits</span>
                      {!hasProfileHabits ? (
                        <div className="p-4 border rounded-lg text-center space-y-2 bg-accent/20">
                          <p className="text-sm text-muted-foreground">Add habits to your profile first to filter by habits</p>
                          <Button variant="outline" size="sm" onClick={openHabitsPopup} className="gap-2">
                            <Heart className="w-3.5 h-3.5" />
                            Add Habits to Profile
                          </Button>
                        </div>
                      ) : (
                        habitCategories.map((category) => (
                          <div key={category.key} className="space-y-1.5">
                            <span className="text-xs font-medium text-muted-foreground">{category.name}</span>
                            <div className="flex flex-wrap gap-2">
                              {category.options.map((option) => {
                                const isSelected = flatmateProfileHabits.includes(option.label);
                                const Icon = option.icon;
                                return (
                                  <button
                                    key={option.label}
                                    type="button"
                                    onClick={() => handleFlatmateProfileHabitToggle(option.label)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${isSelected
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                                      }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </Card>

            </div>
          </div>

          {/* Apply / Cancel — fixed footer */}
          <div className="border-t px-6 pt-3 pb-4">
            {flatDetailsDirty && (
              <p className="text-xs text-destructive text-right mb-2 animate-in fade-in slide-in-from-bottom-1">
                ⚠️ Save or cancel your flat detail changes first
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={flatDetailsDirty}
                title={flatDetailsDirty ? "Save or cancel your flat detail changes first" : undefined}
                onClick={() => setIsFilterOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={flatDetailsDirty}
                title={flatDetailsDirty ? "Save or cancel your flat detail changes first" : undefined}
                onClick={() => {
                  setIsFilterOpen(false);
                  
                  const filters: Record<string, any> = {};
                  
                  if (flatFilterEnabled) {
                    if (filterCoordinates && locationRange[0]) {
                      filters.latitude = filterCoordinates[1];
                      filters.longitude = filterCoordinates[0];
                      filters.radius_km = locationRange[0];
                    }
                    if (priceRange[0] !== 0) filters.min_rent = priceRange[0];
                    if (priceRange[1] !== 100000) filters.max_rent = priceRange[1];
                    if (flatTypes.length > 0) filters.flat_types = flatTypes.join(",");
                    if (furnishingTypes.length > 0) filters.furnishing_types = furnishingTypes.join(",");
                    if (roomTypes.length > 0) filters.room_types = roomTypes.join(",");
                    if (availableFrom) filters.available_from = availableFrom.toISOString();
                    if (brokerage) filters.brokerage = brokerage;
                    if (securityDeposit) filters.security_deposit = securityDeposit;
                    if (roomAmenities.length > 0) filters.room_amenities = roomAmenities.join(",");
                    if (commonAreaAmenities.length > 0) filters.common_amenities = commonAreaAmenities.join(",");
                  }

                  if (flatmateFilterEnabled && flatmateProfileEnabled) {
                     filters.age_min = flatmateAgeRange[0];
                     if (flatmateAgeRange[1] < 60) filters.age_max = flatmateAgeRange[1];
                     if (flatmateCompanies.length > 0) filters.companies = flatmateCompanies.join(",");
                     if (flatmateSchools.length > 0) filters.schools = flatmateSchools.join(",");
                     if (flatmateProfileHabits.length > 0) filters.habits = flatmateProfileHabits.join(",");
                  }

                  setAppliedFilters(filters);
                  updateSearchPreferences(filters);
                  
                  toast({
                    title: "Filters Applied",
                    description: "Your filters have been successfully applied.",
                  });
                }}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ===================== HABITS POPUP DIALOG ===================== */}
      <Dialog open={habitsPopupOpen} onOpenChange={setHabitsPopupOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Add Your Habits
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Select one option per category. This will be saved to your profile.</p>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {habitCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {category.options.map((option) => {
                    const isSelected = popupHabits.includes(option.label);
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => togglePopupHabit(option.label)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all text-sm font-medium ${isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-accent/50'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setHabitsPopupOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={savePopupHabits} className="flex-1" disabled={popupHabits.length === 0}>
              Save Habits
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================== PROFILE CARDS ===================== */}
      <div className="flex-1 flex items-center relative">
        <div className="flex-shrink-0 w-12 flex items-center justify-center">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-card" onClick={handlePrevious} disabled={currentIndex === 0 || isAnimating}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex-1 h-full flex items-center justify-center py-8 px-2">
          {flatsLoading ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Finding matches...</p>
            </div>
          ) : swipeItems[currentIndex] ? (
            <div className={animationDirection === "left" ? "animate-swipe-out-left w-full" : animationDirection === "right" ? "animate-swipe-out-right w-full" : "animate-slide-in w-full"}>
              {swipeItems[currentIndex].type === "profile" ? (
                <ProfileCard 
                  profile={(swipeItems[currentIndex] as any).data} 
                  isSaved={(swipeItems[currentIndex] as any).data?.isSaved} 
                />
              ) : (
                <AdCard
                  adClient={AD_CLIENT}
                  adSlot={AD_SLOT}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <p className="text-sm">No listings found. Check back soon!</p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 w-12 flex items-center justify-center">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full shadow-card" onClick={handleNext} disabled={currentIndex >= swipeItems.length - 1 || isAnimating}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
          {currentIndex + 1} / {swipeItems.length}
        </div>
      </div>
    </div>
  );
};
