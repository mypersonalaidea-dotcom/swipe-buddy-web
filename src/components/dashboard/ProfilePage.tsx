import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import api from "@/lib/api";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { habitCategories, getCategoryForHabit, getHabitIcon } from "@/constants/habits";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { BrandMultiSelect, BrandOption } from "@/components/ui/brand-multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User, Phone, Mail, Briefcase, BookOpen, Home, MapPin,
  Edit2, Save, X, Plus, Trash2, Camera, Heart, Bookmark, Share2, Copy, Check, DoorOpen, Building2, Loader2, Calendar, ShieldCheck
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";
import { MapPicker } from "@/components/map/MapPicker";
import { mockProfiles } from "@/data/mockProfiles";
import { Profile } from "@/components/profile/ProfileCard";
import {
  useMyProfile, useUpdateProfile,
  useMyJobs, useAddJob, useUpdateJob, useDeleteJob,
  useMyEducation, useAddEducation, useUpdateEducation, useDeleteEducation,
  useMyHabits, useUpdateHabits, useUpdateSearchPreferences
} from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useFlats, useUpdateFlat } from "@/hooks/useFlats";
import { useCompanies, usePositions, useInstitutions, useDegrees } from "@/hooks/useMasterData";
import { useSavedProfiles, useSaveProfile } from "@/hooks/useSocial";

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

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface RoomDetails {
  id: string;
  roomName: string;
  roomType: "private" | "shared" | "studio";
  quantity: string;
  rent: string;
  securityDeposit: string;
  brokerage: string;
  availableFrom: string;
  amenities: string[];
  media: MediaFile[];
}

interface UserProfile {
  // Personal Info
  name: string;
  age: string;
  dob: string;
  gender: string;
  phone: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
  city: string;
  state: string;
  profilePictureUrl: string;
  jobExperiences: JobExperience[];
  educationExperiences: EducationExperience[];
  // Housing Details
  searchType: "flat" | "flatmate" | "both";
  propertyMoveInDate?: string;
  searchLocation?: string;
  searchCoordinates?: [number, number];
  searchRadius?: number;
  flatDetails: {
    address: string;
    coordinates?: [number, number];
    city: string;
    state: string;
    flatType: string;
    flatFurnishing: string;
    rooms: RoomDetails[];
    commonAmenities: string[];
    description: string;
    commonMedia: MediaFile[];
  };
  // Habits
  myHabits: string[];
}

// API-backed profile placeholder (populated via useEffect once data loads)
const emptyProfile: UserProfile = {
  name: "", age: "", dob: "", gender: "", phone: "", phoneVerified: false, email: "", emailVerified: false,
  city: "", state: "", profilePictureUrl: "",
  jobExperiences: [], educationExperiences: [],
  searchType: "flat",
  propertyMoveInDate: new Date().toISOString().split('T')[0],
  searchLocation: "",
  searchRadius: 5,
  flatDetails: { address: "", city: "", state: "", flatType: "", flatFurnishing: "", rooms: [], commonAmenities: [], description: "", commonMedia: [] },
  myHabits: []
};



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

export const ProfilePage = () => {
  // ---- API hooks ----
  const { data: apiProfile, isLoading: profileLoading } = useMyProfile();
  const { data: apiJobs } = useMyJobs();
  const { data: apiEducation } = useMyEducation();
  const { data: apiHabits } = useMyHabits();
  const updateProfileMutation = useUpdateProfile();
  const addJobMutation = useAddJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  const addEduMutation = useAddEducation();
  const updateEduMutation = useUpdateEducation();
  const deleteEduMutation = useDeleteEducation();
  const updateHabitsMutation = useUpdateHabits();
  const updateFlatMutation = useUpdateFlat();
  const updateSearchPrefsMutation = useUpdateSearchPreferences();
  const { data: realSavedProfiles, isLoading: savedProfilesLoading } = useSavedProfiles();
  const { mutate: toggleSaveMutation } = useSaveProfile();

  // ---- Master data hooks ----
  const { data: masterCompanies = [] } = useCompanies();
  const { data: masterPositions = [] } = usePositions();
  const { data: masterInstitutions = [] } = useInstitutions();
  const { data: masterDegrees = [] } = useDegrees();

  const { user: authUser } = useAuth();

  // Helper: convert API profile → local UserProfile shape
  const apiToLocal = (): UserProfile => {
    // Map the user's first flat (if any) into the local flatDetails shape
    const apiFlat = apiProfile?.flats?.[0];

    // Reverse mapping: API furnishing_type → local flatFurnishing key
    const furnishingReverseMap: Record<string, string> = {
      furnished: "fully-furnished",
      semifurnished: "semi-furnished",
      unfurnished: "non-furnished",
    };

    const flatDetails = apiFlat
      ? {
          address: apiFlat.address ?? "",
          coordinates: (apiFlat.longitude != null && apiFlat.latitude != null) ? [Number(apiFlat.longitude), Number(apiFlat.latitude)] as [number, number] : undefined,
          city: apiFlat.city ?? "",
          state: apiFlat.state ?? "",
          flatType: apiFlat.flat_type ?? "",
          flatFurnishing: furnishingReverseMap[apiFlat.furnishing_type] ?? "",
          rooms: (apiFlat.rooms ?? []).map((r) => ({
            id: r.id,
            roomName: r.room_name ?? "",
            roomType: r.room_type,
            quantity: String(r.available_count ?? 1),
            rent: r.rent != null ? String(r.rent) : "",
            securityDeposit:
              r.security_deposit != null ? String(r.security_deposit) : "",
            brokerage: r.brokerage != null ? String(r.brokerage) : "",
            availableFrom: r.available_from ?? "",
            amenities: r.room_amenities ?? [],
            media: (r.media && r.media.length > 0) 
              ? r.media.map((m, i) => ({
                  id: `room-media-${i}`,
                  file: null as unknown as File,
                  url: m.media_url,
                  type: (m.media_type === "video" ? "video" : "image") as "image" | "video",
                }))
              : (r.photos ?? []).map((url, i) => ({
                  id: `room-photo-${i}`,
                  file: null as unknown as File,
                  url: url,
                  type: "image" as const,
                })),
          })),
          commonAmenities: apiFlat.common_amenities ?? [],
          description: apiFlat.description ?? "",
          commonMedia: (apiFlat.media && apiFlat.media.length > 0)
            ? apiFlat.media.map((m, i) => ({
                id: `common-media-${i}`,
                file: null as unknown as File,
                url: m.media_url,
                type: (m.media_type === "video" ? "video" : "image") as "image" | "video",
              }))
            : (apiFlat.photos ?? []).map((url, i) => ({
                id: `common-photo-${i}`,
                file: null as unknown as File,
                url: url,
                type: "image" as const,
              })),
        }
      : {
          address: "",
          city: "",
          state: "",
          flatType: "",
          flatFurnishing: "",
          rooms: [],
          commonAmenities: [],
          description: "",
          commonMedia: [],
        };

    return {
      name: apiProfile?.name ?? "",
      age: apiProfile?.age?.toString() ?? "",
      dob: (apiProfile as any)?.date_of_birth ?? "",
      gender: apiProfile?.gender ?? "",
      phone: apiProfile?.phone ?? "",
      phoneVerified: apiProfile?.phone_verified ?? false,
      email: apiProfile?.email ?? "",
      emailVerified: apiProfile?.email_verified ?? false,
      city: apiProfile?.city ?? "",
      state: apiProfile?.state ?? "",
      profilePictureUrl: apiProfile?.profile_picture_url ?? "",
      jobExperiences: (apiJobs ?? []).map((j) => ({
        id: j.id,
        company: j.company?.name ?? j.company_name ?? "",
        position: j.position?.full_name ?? j.position_name ?? "",
        fromYear: j.from_year ?? "",
        tillYear: j.till_year ?? "",
        currentlyWorking: j.currently_working,
      })),
      educationExperiences: (apiEducation ?? []).map((e) => ({
        id: e.id,
        institution: e.institution?.name ?? e.institution_name ?? "",
        degree: e.degree?.common_name ?? e.degree_name ?? "",
        startYear: e.start_year ?? "",
        endYear: e.end_year ?? "",
      })),
      searchType: (apiProfile?.search_type ?? "flat") as
        | "flat"
        | "flatmate"
        | "both",
      propertyMoveInDate: apiProfile?.move_in_date ?? new Date().toISOString().split('T')[0],
      searchLocation: apiProfile?.search_location ?? "",
      searchRadius: apiProfile?.search_radius ?? 5,
      flatDetails,
      myHabits: (apiHabits ?? []).map((h) => h.habit.label),
    };
  };

  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(emptyProfile);
  const [savedProfileIds, setSavedProfileIds] = useState<string[]>([]);
  const [, setSearchParams] = useSearchParams();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // ── OTP Verification State (same as signup form) ──
  const OTP_MODE = (import.meta as any).env?.VITE_OTP_MODE || "hardcoded";
  const HARDCODED_OTP = "123456";
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpType, setOtpType] = useState<"phone" | "email">("phone");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState("");
  const countryCode = "+91";

  // Track original verified phone/email to detect changes
  const [originalVerifiedPhone, setOriginalVerifiedPhone] = useState("");
  const [originalVerifiedEmail, setOriginalVerifiedEmail] = useState("");

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Sync API data into local state once loaded
  useEffect(() => {
    if (apiProfile) {
      const local = apiToLocal();
      setProfile(local);
      setEditedProfile(local);
      // Track original verified values for change detection
      if (local.phoneVerified) setOriginalVerifiedPhone(local.phone);
      if (local.emailVerified) setOriginalVerifiedEmail(local.email);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiProfile, apiJobs, apiEducation, apiHabits]);

  // Custom Degree Dialog State
  const [showAddDegreeDialog, setShowAddDegreeDialog] = useState(false);
  const [activeEducationId, setActiveEducationId] = useState<string | null>(null);
  const [newDegreeFullName, setNewDegreeFullName] = useState("");
  const [newDegreeCommonName, setNewDegreeCommonName] = useState("");
  const [newDegreeOtherNames, setNewDegreeOtherNames] = useState("");

  // Custom Position Dialog State
  const [showAddPositionDialog, setShowAddPositionDialog] = useState(false);
  const [activeJobIdForPosition, setActiveJobIdForPosition] = useState<string | null>(null);
  const [newPositionFullName, setNewPositionFullName] = useState("");
  const [newPositionCommonName, setNewPositionCommonName] = useState("");
  const [newPositionOtherNames, setNewPositionOtherNames] = useState("");

  const { toast } = useToast();

  // Derive BrandOption arrays from master API data (falls back to local state for custom entries)
  const [extraCompanies, setExtraCompanies] = useState<BrandOption[]>([]);
  const [extraSchools, setExtraSchools] = useState<BrandOption[]>([]);
  const companiesDb: BrandOption[] = [
    ...masterCompanies.map(c => ({ id: c.id, name: c.name, logo: c.logo_url ?? undefined })),
    ...extraCompanies,
  ];
  const setCompaniesDb = (updater: (prev: BrandOption[]) => BrandOption[]) =>
    setExtraCompanies(prev => updater([...masterCompanies.map(c => ({ id: c.id, name: c.name, logo: c.logo_url ?? undefined })), ...prev]).filter(c => !masterCompanies.find(m => m.id === c.id)));

  const schoolsDb: BrandOption[] = [
    ...masterInstitutions.map(i => ({ id: i.id, name: i.name, logo: i.logo_url ?? undefined })),
    ...extraSchools,
  ];
  const setSchoolsDb = (updater: (prev: BrandOption[]) => BrandOption[]) =>
    setExtraSchools(prev => updater([...masterInstitutions.map(i => ({ id: i.id, name: i.name, logo: i.logo_url ?? undefined })), ...prev]).filter(i => !masterInstitutions.find(m => m.id === i.id)));

  const positionOptions: string[] = masterPositions.length > 0
    ? [...masterPositions.map(p => p.full_name), "Other"]
    : ["Software Engineer", "Product Manager", "Designer", "Analyst", "Other"];

  const degreeOptions: string[] = masterDegrees.length > 0
    ? [...masterDegrees.map(d => d.common_name), "Other"]
    : ["B.Tech", "MBA", "M.Tech", "B.Com", "B.A.", "Ph.D.", "Other"];

  // setPositionOptions / setDegreeOptions — kept as no-ops for compatibility with dialog handlers below
  const setPositionOptions = (_: any) => {};
  const setDegreeOptions = (_: any) => {};



  // currentUserId from real auth
  const currentUserId = authUser?.id ?? "";
  const shareUrl = `${window.location.origin}/profile/${currentUserId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast({
        title: "Link Copied!",
        description: "Your profile link has been copied to clipboard.",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  // Use real saved profiles from API instead of mock
  const savedProfiles = realSavedProfiles || [];

  const handleUnsaveProfile = (profileId: string) => {
    toggleSaveMutation(profileId);
  };


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());
  const futureYears = Array.from({ length: 11 }, (_, i) => (currentYear + i).toString());

  // DOB picker state (moved to component level to avoid hooks-in-IIFE crash)
  const [dobView, setDobView] = useState<'year' | 'month' | 'day'>('day');
  const [dobNavMonth, setDobNavMonth] = useState<Date>(new Date(currentYear - 25, 0));

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // 1. Update basic profile fields
      await updateProfileMutation.mutateAsync({
        name: editedProfile.name,
        age: editedProfile.age ? parseInt(editedProfile.age) as any : undefined,
        date_of_birth: editedProfile.dob || undefined,
        gender: editedProfile.gender as any,
        city: editedProfile.city,
        state: editedProfile.state,
        search_type: editedProfile.searchType as any,
        move_in_date: editedProfile.propertyMoveInDate || undefined,
      } as any);

      // 2. Sync jobs: delete removed, update existing, add new
      const origJobIds = (apiJobs ?? []).map(j => j.id);
      const editedJobIds = editedProfile.jobExperiences.filter(j => origJobIds.includes(j.id)).map(j => j.id);
      // Delete removed jobs
      for (const origId of origJobIds) {
        if (!editedProfile.jobExperiences.find(j => j.id === origId)) {
          await deleteJobMutation.mutateAsync(origId);
        }
      }
      // Update existing jobs
      for (const j of editedProfile.jobExperiences.filter(j => origJobIds.includes(j.id))) {
        await updateJobMutation.mutateAsync({
          jobId: j.id,
          company_name: j.company || undefined,
          position_name: j.position || undefined,
          from_year: j.fromYear || undefined,
          till_year: j.currentlyWorking ? undefined : (j.tillYear || undefined),
          currently_working: j.currentlyWorking,
        });
      }
      // Add new jobs
      for (const j of editedProfile.jobExperiences.filter(j => !origJobIds.includes(j.id))) {
        if (j.company || j.position) {
          await addJobMutation.mutateAsync({
            company_name: j.company || undefined,
            position_name: j.position || undefined,
            from_year: j.fromYear || undefined,
            till_year: j.currentlyWorking ? undefined : (j.tillYear || undefined),
            currently_working: j.currentlyWorking,
          });
        }
      }

      // 3. Sync education: delete removed, update existing, add new
      const origEduIds = (apiEducation ?? []).map(e => e.id);
      for (const origId of origEduIds) {
        if (!editedProfile.educationExperiences.find(e => e.id === origId)) {
          await deleteEduMutation.mutateAsync(origId);
        }
      }
      for (const e of editedProfile.educationExperiences.filter(e => origEduIds.includes(e.id))) {
        await updateEduMutation.mutateAsync({
          eduId: e.id,
          institution_name: e.institution || undefined,
          degree_name: e.degree || undefined,
          start_year: e.startYear || undefined,
          end_year: e.endYear || undefined,
        });
      }
      for (const e of editedProfile.educationExperiences.filter(e => !origEduIds.includes(e.id))) {
        if (e.institution || e.degree) {
          await addEduMutation.mutateAsync({
            institution_name: e.institution || undefined,
            degree_name: e.degree || undefined,
            start_year: e.startYear || undefined,
            end_year: e.endYear || undefined,
          });
        }
      }

      // 4. Sync flat details
      const apiFlat = apiProfile?.flats?.[0];
      const { flatDetails } = editedProfile;
      const furnishingMap: Record<string, string> = {
        "fully-furnished": "furnished",
        "semi-furnished": "semifurnished",
        "non-furnished": "unfurnished",
      };

      if (editedProfile.searchType !== 'flatmate' && editedProfile.searchType !== 'both') {
        // Skip flat saving if user is not a flat seeker with a flat
      } else if (apiFlat) {
        // Update existing flat
        await updateFlatMutation.mutateAsync({
          id: apiFlat.id,
          address: flatDetails.address,
          city: flatDetails.city || undefined,
          state: flatDetails.state || undefined,
          flat_type: flatDetails.flatType || undefined,
          furnishing_type: furnishingMap[flatDetails.flatFurnishing] || "unfurnished",
          description: flatDetails.description || undefined,
          is_published: true,
          latitude: flatDetails.coordinates ? String(flatDetails.coordinates[1]) : undefined,
          longitude: flatDetails.coordinates ? String(flatDetails.coordinates[0]) : undefined,
          // Sync rooms
          rooms: flatDetails.rooms.map((r, idx) => ({
            id: r.id.startsWith('profile-') || isNaN(Number(r.id)) ? undefined : r.id,
            room_name: r.roomName || undefined,
            room_type: r.roomType,
            rent: r.rent ? parseFloat(r.rent) : 0,
            security_deposit: r.securityDeposit && !r.securityDeposit.startsWith('none|') ? parseInt(r.securityDeposit.replace('none|', '').split(' ')[0] || '0') : 0,
            brokerage: r.brokerage && !r.brokerage.startsWith('none|') ? parseInt(r.brokerage.replace('none|', '').split(' ')[0] || '0') : 0,
            available_count: r.quantity ? parseInt(r.quantity) : 1,
            available_from: r.availableFrom || undefined,
            display_order: idx + 1,
            room_amenities: r.amenities || [],
            media: (r.media || []).map(m => ({ media_url: m.url, media_type: m.type })),
          })),
          common_amenities: flatDetails.commonAmenities || [],
          media: (flatDetails.commonMedia || []).map(m => ({ media_url: m.url, media_type: m.type })),
        });
      }

      // 4.5 Sync search preferences (for seekers)
      if ((editedProfile.searchType === 'flat' || editedProfile.searchType === 'both') && editedProfile.searchLocation) {
        await updateSearchPrefsMutation.mutateAsync({
          location_search: editedProfile.searchLocation,
          location_range_km: editedProfile.searchRadius ?? 5,
        });
      }

      // 5. Sync habits
      const habitIds = editedProfile.myHabits.map(label => {
        // Try to find the habit object from apiHabits to get its real DB ID
        const existingHabit = apiHabits?.find(h => h.habit.label === label);
        return existingHabit?.habit?.id;
      }).filter(Boolean) as string[];

      if (habitIds.length > 0) {
        await updateHabitsMutation.mutateAsync(habitIds);
      }

      setProfile({ ...editedProfile });
      setIsEditing(false);
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    } catch (err: any) {
      console.error("Profile Save Error:", err);
      toast({
        title: "Save Failed",
        description: err?.response?.data?.message || err?.message || "Could not save profile.",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const addJobExperience = () => {
    const newExp: JobExperience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      fromYear: "",
      tillYear: "",
      currentlyWorking: false
    };
    setEditedProfile({
      ...editedProfile,
      jobExperiences: [...editedProfile.jobExperiences, newExp]
    });
  };

  const removeJobExperience = (id: string) => {
    setEditedProfile({
      ...editedProfile,
      jobExperiences: editedProfile.jobExperiences.filter(exp => exp.id !== id)
    });
  };

  const updateJobExperience = (id: string, field: keyof JobExperience, value: any) => {
    setEditedProfile({
      ...editedProfile,
      jobExperiences: editedProfile.jobExperiences.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    });
  };

  const addEducation = () => {
    const newEdu: EducationExperience = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      startYear: "",
      endYear: ""
    };
    setEditedProfile({
      ...editedProfile,
      educationExperiences: [...editedProfile.educationExperiences, newEdu]
    });
  };

  const removeEducation = (id: string) => {
    setEditedProfile({
      ...editedProfile,
      educationExperiences: editedProfile.educationExperiences.filter(edu => edu.id !== id)
    });
  };

  const updateEducation = (id: string, field: keyof EducationExperience, value: string) => {
    setEditedProfile({
      ...editedProfile,
      educationExperiences: editedProfile.educationExperiences.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    });
  };

  const toggleHabit = (habit: string) => {
    const currentHabits = editedProfile.myHabits;
    const category = getCategoryForHabit(habit);
    if (!category) return;
    // Remove any existing selection from the same category, then add the new one
    const otherCategoryLabels = category.options.map(o => o.label);
    const filteredHabits = currentHabits.filter(h => !otherCategoryLabels.includes(h));
    // If clicking the already-selected one, just deselect it
    if (currentHabits.includes(habit)) {
      updateField('myHabits', filteredHabits);
    } else {
      updateField('myHabits', [...filteredHabits, habit]);
    }
  };

  // --- Housing tab: room management (matches signup) ---
  const addRoom = () => {
    const newRoom: RoomDetails = {
      id: `profile-${Date.now()}`,
      roomName: "",
      roomType: "private",
      quantity: "",
      rent: "",
      securityDeposit: "2 Month",
      brokerage: "15 Day",
      availableFrom: "",
      amenities: [],
      media: []
    };
    setEditedProfile(prev => ({
      ...prev,
      flatDetails: {
        ...prev.flatDetails,
        rooms: [...prev.flatDetails.rooms, newRoom]
      }
    }));
  };

  const removeRoom = (id: string) => {
    setEditedProfile(prev => ({
      ...prev,
      flatDetails: {
        ...prev.flatDetails,
        rooms: prev.flatDetails.rooms.filter(r => r.id !== id)
      }
    }));
  };

  const updateRoom = (id: string, field: keyof RoomDetails, value: any) => {
    setEditedProfile(prev => ({
      ...prev,
      flatDetails: {
        ...prev.flatDetails,
        rooms: prev.flatDetails.rooms.map(r =>
          r.id === id ? { ...r, [field]: value } : r
        )
      }
    }));
  };

  const handleRoomAmenityToggle = (roomId: string, amenity: string) => {
    const room = editedProfile.flatDetails.rooms.find(r => r.id === roomId);
    if (!room) return;
    const updated = room.amenities.includes(amenity)
      ? room.amenities.filter(a => a !== amenity)
      : [...room.amenities, amenity];
    updateRoom(roomId, 'amenities', updated);
  };

  const handleCommonAmenityToggle = (amenity: string) => {
    const current = editedProfile.flatDetails.commonAmenities;
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    updateField('flatDetails', { ...editedProfile.flatDetails, commonAmenities: updated });
  };

  const data = isEditing ? editedProfile : profile;

  // ── OTP Verification Handlers (same logic as signup form) ──
  const openOtpDialog = (type: "phone" | "email") => {
    setOtpType(type);
    setOtpValue("");
    setOtpError("");
    setOtpDialogOpen(true);
    setOtpCountdown(30);
    const target = type === "phone" ? `${countryCode} ${data.phone}` : data.email;
    toast({ title: type === "phone" ? "OTP Sent! 📱" : "OTP Sent! 📧", description: `Verification code sent to ${target}` });
  };

  const handleOtpVerify = async () => {
    if (otpValue.length !== 6) { setOtpError("Please enter the complete 6-digit OTP"); return; }
    setOtpVerifying(true);
    setOtpError("");
    try {
      if (OTP_MODE === "hardcoded") {
        if (otpValue === HARDCODED_OTP) {
          if (otpType === "phone") {
            updateField('phoneVerified', true as any);
            setOriginalVerifiedPhone(data.phone);
            toast({ title: "Phone Verified! ✅", description: "Your phone number has been verified successfully." });
          } else {
            updateField('emailVerified', true as any);
            setOriginalVerifiedEmail(data.email);
            toast({ title: "Email Verified! ✅", description: "Your email has been verified successfully." });
          }
          setOtpDialogOpen(false);
        } else {
          setOtpError("Invalid OTP. Please try again.");
        }
      } else {
        if (otpType === "phone") {
          const res = await api.post("/auth/verify-otp", { phone: data.phone, otp: otpValue });
          if (res.data?.success || res.data?.data?.verified) {
            updateField('phoneVerified', true as any);
            setOriginalVerifiedPhone(data.phone);
            toast({ title: "Phone Verified! ✅", description: "Your phone number has been verified successfully." });
            setOtpDialogOpen(false);
          } else { setOtpError(res.data?.message || "Invalid OTP. Please try again."); }
        } else {
          const res = await api.post("/auth/verify-email-otp", { email: data.email, otp: otpValue });
          if (res.data?.success || res.data?.data?.verified) {
            updateField('emailVerified', true as any);
            setOriginalVerifiedEmail(data.email);
            toast({ title: "Email Verified! ✅", description: "Your email has been verified successfully." });
            setOtpDialogOpen(false);
          } else { setOtpError(res.data?.message || "Invalid OTP. Please try again."); }
        }
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.message || err?.friendlyMessage || "Verification failed. Please try again.");
    } finally { setOtpVerifying(false); }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setOtpValue(""); setOtpError("");
    if (OTP_MODE === "hardcoded") {
      setOtpCountdown(30);
      toast({ title: "OTP Resent! 🔄", description: `Use code ${HARDCODED_OTP} to verify (dev mode)` });
      return;
    }
    try {
      if (otpType === "phone") { await api.post("/auth/send-otp", { phone: data.phone }); }
      else { await api.post("/auth/check-email", { email: data.email }); }
      setOtpCountdown(30);
      toast({ title: "OTP Resent! 🔄", description: `New verification code sent to ${otpType === "phone" ? `${countryCode} ${data.phone}` : data.email}` });
    } catch (err: any) {
      toast({ title: "Resend Failed", description: err?.response?.data?.message || "Failed to resend OTP. Please try again.", variant: "destructive" });
    }
  };

  const handleVerifyPhone = async () => {
    if (!data.phone || data.phone.length !== 10) {
      toast({ title: "Error", description: "Please enter a valid 10-digit phone number", variant: "destructive" });
      return;
    }
    if (OTP_MODE === "hardcoded") { openOtpDialog("phone"); return; }
    setVerifyLoading("phone");
    try {
      await api.post("/auth/send-otp", { phone: data.phone });
      setVerifyLoading("");
    } catch (error: any) {
      setVerifyLoading("");
      console.warn("Phone OTP send failed:", error);
    }
    openOtpDialog("phone");
  };

  const handleVerifyEmail = async () => {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (OTP_MODE === "hardcoded") { openOtpDialog("email"); return; }
    setVerifyLoading("email");
    try {
      await api.post("/auth/check-email", { email: data.email });
      setVerifyLoading("");
      openOtpDialog("email");
    } catch (err: any) {
      setVerifyLoading("");
      toast({ title: "Error", description: err?.response?.data?.message || "Failed to send verification email.", variant: "destructive" });
    }
  };

  // Compute verification status: verified if API says so AND value hasn't changed
  const isPhoneVerified = data.phoneVerified && data.phone === originalVerifiedPhone;
  const isEmailVerified = data.emailVerified && data.email === originalVerifiedEmail;

  // ── Sparkle cursor trail — directional ray, background-only ──
  const sparkleCanvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; size: number;
    color: string; type: 'dot' | 'star';
  }>>([]);
  const mouseRef = useRef({ x: 0, y: 0, prevX: 0, prevY: 0, moving: false });
  const animFrameRef = useRef<number>(0);

  const isInContentArea = useCallback((x: number, canvasWidth: number) => {
    // max-w-4xl = 896px, centered. Calculate the content column bounds.
    const contentWidth = Math.min(896, canvasWidth);
    const contentLeft = (canvasWidth - contentWidth) / 2;
    const contentRight = contentLeft + contentWidth;
    return x >= contentLeft && x <= contentRight;
  }, []);

  useEffect(() => {
    const canvas = sparkleCanvasRef.current;
    if (!canvas) return;
    if (window.innerWidth < 1024) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.moving = true;
    };
    const handleMouseLeave = () => { mouseRef.current.moving = false; };

    canvas.parentElement?.addEventListener('mousemove', handleMouseMove);
    canvas.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    const colors = [
      'rgba(225, 29, 72, 0.7)',
      'rgba(244, 63, 94, 0.6)',
      'rgba(251, 113, 133, 0.5)',
      'rgba(255, 228, 230, 0.8)',
      'rgba(255, 255, 255, 0.8)',
      'rgba(253, 186, 116, 0.5)',
    ];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const m = mouseRef.current;

      // Only spawn if moving AND cursor is in the side background area
      if (m.moving && !isInContentArea(m.x, canvas.width)) {
        const dx = m.x - m.prevX;
        const dy = m.y - m.prevY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        if (speed > 1) {
          // Sparkle drops from the cursor tip (top-left hotspot)
          // Nearly stationary — just drifts gently downward to form a trail
          sparklesRef.current.push({
            x: m.x + (Math.random() - 0.5) * 3,
            y: m.y + (Math.random() - 0.5) * 3,
            vx: (Math.random() - 0.5) * 0.3,
            vy: 0.2 + Math.random() * 0.4, // gentle fall
            life: 1,
            maxLife: 0.5 + Math.random() * 0.5,
            size: 1.2 + Math.random() * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: Math.random() > 0.5 ? 'star' : 'dot',
          });
        }
      }

      // Update & draw particles
      sparklesRef.current = sparklesRef.current.filter(p => {
        p.life -= 0.016 / p.maxLife;
        if (p.life <= 0) return false;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        const alpha = p.life * p.life; // quadratic fade for softer tail
        const size = p.size * alpha;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (p.type === 'dot') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = size * 4;
          ctx.fill();
        } else {
          // Tiny 4-point star
          const s = size * 1.3;
          ctx.translate(p.x, p.y);
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const ang = (i / 4) * Math.PI * 2 - Math.PI / 4;
            ctx.lineTo(Math.cos(ang) * s, Math.sin(ang) * s);
            const mid = ang + Math.PI / 4;
            ctx.lineTo(Math.cos(mid) * s * 0.35, Math.sin(mid) * s * 0.35);
          }
          ctx.closePath();
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = s * 3;
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('mousemove', handleMouseMove);
      canvas.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isInContentArea]);

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(160deg, #fff5f5 0%, #fef2f2 25%, #fce4ec 60%, #fbe9e7 100%)' }}>
      {/* Sparkle cursor trail canvas */}
      <canvas ref={sparkleCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20 hidden lg:block" />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(225, 29, 72, 0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* ── Geometric shapes (desktop only, subtle) ── */}
      {/* Top-right: nested rotating squares */}
      <div className="absolute top-[6%] right-[6%] w-24 h-24 border-2 border-rose-400/20 rounded-xl profile-spin-slow hidden lg:block" />
      <div className="absolute top-[8%] right-[8%] w-16 h-16 border-2 border-rose-300/15 rounded-lg profile-spin-slow hidden lg:block" style={{ animationDirection: 'reverse' }} />

      {/* Bottom-left: concentric pulsing rings */}
      <div className="absolute bottom-[12%] left-[4%] w-28 h-28 border-2 border-rose-400/15 rounded-full profile-pulse-ring hidden lg:block" />
      <div className="absolute bottom-[14%] left-[6%] w-20 h-20 border-2 border-rose-300/10 rounded-full profile-pulse-ring hidden lg:block" style={{ animationDelay: '1.5s' }} />

      {/* Top-left: rotating diamond */}
      <div className="absolute top-[18%] left-[6%] w-14 h-14 border-2 border-rose-400/15 rotate-45 profile-spin-slow hidden lg:block" style={{ animationDuration: '35s' }} />

      {/* Bottom-right: small rotating square */}
      <div className="absolute bottom-[20%] right-[7%] w-10 h-10 border-2 border-rose-300/20 rounded-md profile-spin-slow hidden lg:block" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />

      {/* Floating dots */}
      <div className="absolute top-[35%] right-[5%] w-3.5 h-3.5 bg-rose-400/25 rounded-full profile-drift hidden lg:block" />
      <div className="absolute top-[15%] left-[15%] w-3 h-3 bg-rose-500/15 rounded-full profile-drift hidden lg:block" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-[25%] right-[15%] w-2.5 h-2.5 bg-rose-400/20 rounded-full profile-drift hidden lg:block" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[55%] left-[4%] w-3 h-3 bg-pink-400/20 rounded-full profile-drift hidden lg:block" style={{ animationDelay: '6s' }} />
      <div className="absolute bottom-[8%] left-[35%] w-2 h-2 bg-rose-500/15 rounded-full profile-drift hidden lg:block" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[75%] right-[3%] w-2.5 h-2.5 bg-rose-300/25 rounded-full profile-drift hidden lg:block" style={{ animationDelay: '5s' }} />

      {/* Floating diamonds */}
      <div className="absolute top-[45%] right-[4%] profile-float-anim hidden lg:block">
        <div className="w-5 h-5 border-2 border-rose-400/20 rotate-45" />
      </div>
      <div className="absolute bottom-[40%] left-[3%] profile-float-anim hidden lg:block" style={{ animationDelay: '2s' }}>
        <div className="w-4 h-4 border-2 border-rose-300/15 rotate-45" />
      </div>
      <div className="absolute top-[10%] left-[40%] profile-float-anim hidden lg:block" style={{ animationDelay: '4s' }}>
        <div className="w-3 h-3 border border-rose-400/15 rotate-45" />
      </div>

      {/* Soft glowing orbs */}
      <div className="absolute top-[10%] left-[8%] w-64 h-64 rounded-full bg-rose-200/20 profile-orb hidden lg:block" style={{ filter: 'blur(80px)' }} />
      <div className="absolute bottom-[15%] right-[5%] w-48 h-48 rounded-full bg-pink-200/15 profile-orb hidden lg:block" style={{ filter: 'blur(80px)', animationDelay: '3s' }} />

      <style dangerouslySetInnerHTML={{ __html: profileGeoStyles }} />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* ── Premium hero banner with wave edge (Restrained Width) ── */}
        <div className="relative h-[160px] overflow-hidden rounded-b-3xl" style={{ background: 'linear-gradient(135deg, hsl(346 77% 46%) 0%, hsl(346 77% 56%) 40%, hsl(330 72% 58%) 70%, hsl(320 68% 62%) 100%)' }}>
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {/* Animated orbs inside banner */}
          <div className="absolute top-4 right-[10%] w-32 h-32 rounded-full bg-white/[0.08] blur-xl profile-drift" />
          <div className="absolute -bottom-4 left-[10%] w-24 h-24 rounded-full bg-white/[0.06] blur-lg profile-drift" style={{ animationDelay: '3s' }} />
          
          {/* Banner tagline — stylish wide typography */}
          <div className="relative z-10 flex flex-col items-center justify-start h-full pt-5 md:pt-7 px-10 md:px-6">
            {/* Decorative line + main headline */}
            <div className="flex items-center gap-2 md:gap-4 w-full">
              <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-transparent via-white/50 to-white/20" />
              <h1 className="text-white text-[12.5px] sm:text-[15px] md:text-[24px] font-extrabold tracking-wide text-center leading-snug w-full" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.18)' }}>
                Find flatmates you'll <span className="italic font-light opacity-90 mx-0.5 md:mx-1">actually</span> get along with
              </h1>
              <div className="hidden sm:block flex-1 h-px bg-gradient-to-l from-transparent via-white/50 to-white/20" />
            </div>
            {/* Subtitle */}
            <p className="text-white/80 text-[10px] md:text-sm mt-1 sm:mt-2 md:mt-3 font-medium tracking-wide">
              A complete profile gets 3× more messages ✨
            </p>
          </div>
          {/* Wave bottom edge */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 50" preserveAspectRatio="none" style={{ height: '28px' }}>
            <path d="M0,20 C360,45 720,0 1080,25 C1260,37 1380,20 1440,20 L1440,50 L0,50 Z" fill="#fff5f5" />
          </svg>
        </div>
        {/* ── Profile card — overlaps banner ── */}
        <div className="relative -mt-16 mx-4 md:mx-8 mb-6 bg-white rounded-2xl border border-gray-200/60 shadow-[0_10px_40px_-10px_hsl(240_10%_15%/0.1)] p-6">
          <div className="flex flex-col md:flex-row items-center gap-5">
            {/* Avatar — rounded square matching ProfileCard */}
            <div className="relative -mt-16 md:-mt-12 flex-shrink-0">
              <div className="w-[120px] h-[120px] rounded-[28px] border-4 border-white shadow-lg overflow-hidden bg-gray-100 ring-2 ring-rose-400/30">
                {data.profilePictureUrl ? (
                  <img src={data.profilePictureUrl} alt="Profile" className="w-full h-full object-cover rounded-[24px]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100 rounded-[24px]">
                    <User className="w-12 h-12 text-rose-300" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-1 right-1 bg-rose-500 rounded-full p-2 cursor-pointer hover:bg-rose-600 transition-colors shadow-md">
                  <Camera className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              )}
            </div>

            {/* ── READ MODE ── */}
            {!isEditing && (
              <div className="flex-1 text-center md:text-left space-y-2">
                {/* Name + Age */}
                <h2 className="text-2xl font-bold text-gray-900">
                  {data.name || 'Your Name'}
                  {data.age ? <span className="text-lg font-normal text-gray-400 ml-1">, {data.age}</span> : ''}
                </h2>
                {/* DOB + Gender pills on separate lines */}
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {data.dob ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/80 border border-rose-100 text-rose-600 text-[13px] font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(data.dob), 'PPP')}
                    </span>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50/40 border border-rose-100/60 text-rose-300 text-[13px] font-medium cursor-default">
                            <Calendar className="w-3.5 h-3.5" /> –
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>Date of Birth is not set</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {data.gender ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200/80 text-gray-600 text-[13px] font-medium capitalize">
                      <User className="w-3.5 h-3.5" />
                      {data.gender}
                    </span>
                  ) : (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50/40 border border-gray-200/60 text-gray-300 text-[13px] font-medium cursor-default">
                            <User className="w-3.5 h-3.5" /> –
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p>Gender is not set</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )}

            {/* ── EDIT MODE HEADER ── */}
            {isEditing && (
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <p className="text-sm text-gray-400 mt-0.5">Update your personal details below</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}
                      className="rounded-xl border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500 transition-colors">
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} className="rounded-xl border-gray-200">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button onClick={handleSave}
                          className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white shadow-md">
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit}
                        className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white shadow-md">
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* ── Editable identity fields: Name → DOB → Gender (stacked) ── */}
          {isEditing && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="space-y-4 max-w-xl">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">Full Name <span className="text-red-500">*</span></Label>
                  <Input value={data.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Enter your full name"
                         className="h-11 rounded-xl border-gray-200 focus:border-rose-300 focus:ring-rose-200/50" />
                </div>
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">Date of Birth <span className="text-red-500">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full h-11 justify-start text-left font-normal rounded-xl border-gray-200 ${!data.dob ? 'text-muted-foreground' : ''}`}>
                        <Calendar className="mr-2 h-4 w-4 text-rose-400" />
                        {data.dob ? format(new Date(data.dob), 'PPP') : 'Select date of birth'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      {dobView === 'year' && (
                        <div className="p-3">
                          <p className="text-sm font-medium text-center mb-2">Select Year</p>
                          <div className="grid grid-cols-4 gap-1.5 max-h-[240px] overflow-y-auto">
                            {Array.from({ length: currentYear - 1945 + 1 }, (_, i) => 1945 + i).reverse().map((y) => (
                              <button key={y} onClick={() => { setDobNavMonth(new Date(y, dobNavMonth.getMonth())); setDobView('month'); }}
                                className={`px-2 py-1.5 text-sm rounded-md transition-colors ${dobNavMonth.getFullYear() === y ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent'}`}>{y}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {dobView === 'month' && (
                        <div className="p-3">
                          <button onClick={() => setDobView('year')} className="text-sm font-medium w-full text-center mb-2 hover:text-primary cursor-pointer">{dobNavMonth.getFullYear()} ▾</button>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, idx) => (
                              <button key={name} onClick={() => { setDobNavMonth(new Date(dobNavMonth.getFullYear(), idx)); setDobView('day'); }}
                                className={`px-2 py-1.5 text-sm rounded-md transition-colors ${dobNavMonth.getMonth() === idx ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent'}`}>{name}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {dobView === 'day' && (
                        <CalendarComponent mode="single" month={dobNavMonth} onMonthChange={setDobNavMonth}
                          selected={data.dob ? new Date(data.dob) : undefined}
                          onSelect={(date) => { if (date) { const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0'); updateField('dob',`${y}-${m}-${d}`); const today=new Date(); let ca=today.getFullYear()-y; const md=today.getMonth()-date.getMonth(); if(md<0||(md===0&&today.getDate()<date.getDate()))ca--; updateField('age',ca.toString()); } }}
                          disabled={(date) => date > new Date() || date < new Date('1920-01-01')} initialFocus className="rounded-md border"
                          components={{ CaptionLabel: ({displayMonth}:{displayMonth:Date}) => (<button onClick={(e)=>{e.preventDefault();setDobView('year');}} className="text-sm font-medium cursor-pointer hover:text-primary hover:underline underline-offset-2 transition-colors flex items-center gap-1">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][displayMonth.getMonth()]} {displayMonth.getFullYear()} ▾</button>) }}
                        />
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">Gender <span className="text-red-500">*</span></Label>
                  <RadioGroup value={data.gender} onValueChange={(value) => updateField('gender', value)} className="flex gap-3 pt-1">
                    {[
                      { value: 'male', label: 'Male', id: 'hero-male' },
                      { value: 'female', label: 'Female', id: 'hero-female' },
                      { value: 'other', label: 'Other', id: 'hero-other' },
                    ].map(({ value, label, id }) => (
                      <label key={value} htmlFor={id}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                          data.gender === value
                            ? 'border-rose-300 bg-rose-50/70 text-rose-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}>
                        <RadioGroupItem value={value} id={id} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          data.gender === value ? 'border-rose-500' : 'border-gray-300'
                        }`}>
                          {data.gender === value && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                        </div>
                        {label}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Share Dialog */}
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Profile</DialogTitle>
              <DialogDescription>
                Share this link with others to let them view your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground truncate">
                {shareUrl}
              </div>
              <Button onClick={handleCopyLink} size="sm" className="shrink-0">
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Content area ── */}
        <div className="px-4 md:px-8 pb-8 space-y-6">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="inline-flex w-full p-1.5 rounded-2xl border border-white/60 shadow-sm" style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
            <TabsTrigger value="personal" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-gray-500 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-rose-200/50 hover:text-rose-500">
              <User className="w-4 h-4" /> Personal
            </TabsTrigger>
            <TabsTrigger value="housing" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-gray-500 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-rose-200/50 hover:text-rose-500">
              <Home className="w-4 h-4" /> Housing
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-gray-500 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-rose-200/50 hover:text-rose-500">
              <Heart className="w-4 h-4" /> Habits
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-gray-500 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-rose-200/50 hover:text-rose-500">
              <Bookmark className="w-4 h-4" /> Saved
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-[16px] font-bold text-gray-800">Contact & Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Phone */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Phone Number <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <Select value="+91">
                          <SelectTrigger className="w-[100px] shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border max-h-60">
                            {[
                              { code: "+1", flag: "🇺🇸" }, { code: "+33", flag: "🇫🇷" },
                              { code: "+44", flag: "🇬🇧" }, { code: "+49", flag: "🇩🇪" },
                              { code: "+61", flag: "🇦🇺" }, { code: "+65", flag: "🇸🇬" },
                              { code: "+81", flag: "🇯🇵" }, { code: "+82", flag: "🇰🇷" },
                              { code: "+86", flag: "🇨🇳" }, { code: "+91", flag: "🇮🇳" },
                              { code: "+92", flag: "🇵🇰" }, { code: "+94", flag: "🇱🇰" },
                              { code: "+880", flag: "🇧🇩" }, { code: "+966", flag: "🇸🇦" },
                              { code: "+971", flag: "🇦🇪" }, { code: "+977", flag: "🇳🇵" },
                            ].map(({ code, flag }) => (
                              <SelectItem key={code} value={code}>{flag} {code}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="tel"
                          placeholder="Enter 10-digit number"
                          value={data.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            updateField('phone', value);
                            // Auto-unverify if phone changed from original verified value
                            if (data.phoneVerified && value !== originalVerifiedPhone) {
                              updateField('phoneVerified', false as any);
                            }
                          }}
                          maxLength={10}
                          className="flex-1"
                        />
                      </div>
                    ) : data.phone ? (
                      <p className="text-[15px] font-semibold text-gray-900 mt-0.5">{data.phone}</p>
                    ) : (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-[15px] font-semibold text-gray-300 mt-0.5 cursor-default">–</p>
                          </TooltipTrigger>
                          <TooltipContent><p>Phone Number is not set</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex-shrink-0 pt-4">
                    {isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVerifyPhone}
                        disabled={!data.phone || data.phone.length !== 10 || verifyLoading === "phone"}
                        className="rounded-full border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold px-4"
                      >
                        {verifyLoading === "phone" ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</span>
                        ) : "Verify"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Email Address</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => {
                          updateField('email', e.target.value);
                          // Auto-unverify if email changed from original verified value
                          if (data.emailVerified && e.target.value !== originalVerifiedEmail) {
                            updateField('emailVerified', false as any);
                          }
                        }}
                        placeholder="Enter your email"
                        className="mt-1"
                      />
                    ) : data.email ? (
                      <p className="text-[15px] font-semibold text-gray-900 mt-0.5">{data.email}</p>
                    ) : (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-[15px] font-semibold text-gray-300 mt-0.5 cursor-default">–</p>
                          </TooltipTrigger>
                          <TooltipContent><p>Email Address is not set</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="flex-shrink-0 pt-4">
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVerifyEmail}
                        disabled={!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || verifyLoading === "email"}
                        className="rounded-full border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold px-4"
                      >
                        {verifyLoading === "email" ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</span>
                        ) : "Verify"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="text-[16px] font-bold text-gray-800">Work Experience</span>
                  </span>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addJobExperience} className="rounded-xl border-gray-200 hover:border-rose-200 hover:text-rose-500">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.jobExperiences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No work experience added</p>
                ) : (
                  data.jobExperiences.map((exp, index) => (
                    <div key={exp.id} className="border-l-2 border-l-rose-300 border border-gray-100 rounded-xl p-4 space-y-3 bg-white hover:shadow-sm transition-shadow">
                      {isEditing && (
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-700">Experience #{index + 1}</h4>
                          <Button variant="ghost" size="sm" onClick={() => removeJobExperience(exp.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-3">
                          <BrandMultiSelect
                            label={<>Company <span className="text-red-500">*</span></>}
                            placeholder="Select Company..."
                            options={companiesDb}
                            selectedValues={exp.company ? [exp.company] : []}
                            mode="single"
                            onSelectedValuesChange={(vals) => {
                              const val = vals.length > 0 ? vals[0] : "";
                              updateJobExperience(exp.id, 'company', val);
                            }}
                            onAddNewBrand={(brand) => {
                              const newBrand = { ...brand, id: brand.name };
                              setCompaniesDb((prev) => [...prev, newBrand]);
                              updateJobExperience(exp.id, 'company', newBrand.id);
                            }}
                          />
                          <div className="space-y-1">
                            <Label className="text-xs font-medium flex items-center gap-1">Position <span className="text-red-500">*</span></Label>
                            <SearchableSelect
                              value={positionOptions.includes(exp.position) && exp.position !== "Other" ? exp.position : ""}
                              onValueChange={(val) => {
                                if (val !== "Other") {
                                  updateJobExperience(exp.id, 'position', val);
                                } else {
                                  setActiveJobIdForPosition(exp.id);
                                  setShowAddPositionDialog(true);
                                }
                              }}
                              options={positionOptions}
                              placeholder="Select position"
                              searchPlaceholder="Search positions..."
                              emptyText="No position found."
                              alwaysShowOther={true}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium flex items-center gap-1">From Year <span className="text-red-500">*</span></Label>
                            <Select value={exp.fromYear} onValueChange={(v) => updateJobExperience(exp.id, 'fromYear', v)}>
                              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                              <SelectContent className="bg-background border max-h-60">
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-medium flex items-center gap-1">Till Year {!exp.currentlyWorking && <span className="text-red-500">*</span>}</Label>
                            {exp.currentlyWorking ? (
                              <div className="h-10 px-3 py-2 bg-muted border rounded-md flex items-center text-muted-foreground">
                                Currently Working
                              </div>
                            ) : (
                              <Select value={exp.tillYear} onValueChange={(v) => updateJobExperience(exp.id, 'tillYear', v)}>
                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent className="bg-background border max-h-60">
                                  {futureYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 col-span-full">
                            <Checkbox
                              checked={exp.currentlyWorking}
                              onCheckedChange={(c) => updateJobExperience(exp.id, 'currentlyWorking', c)}
                            />
                            <Label>Currently working here</Label>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200/70 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{exp.position}</p>
                            <p className="text-[12px] text-gray-500">{exp.company}{exp.currentlyWorking ? ' · Full-time' : ''}</p>
                            <p className="text-[11px] text-gray-400">{exp.fromYear} – {exp.currentlyWorking ? 'Present' : exp.tillYear}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="text-[16px] font-bold text-gray-800">Education</span>
                  </span>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addEducation} className="rounded-xl border-gray-200 hover:border-rose-200 hover:text-rose-500">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.educationExperiences.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No education added</p>
                ) : (
                  data.educationExperiences.map((edu, index) => (
                    <div key={edu.id} className="border-l-2 border-l-rose-300 border border-gray-100 rounded-xl p-4 space-y-3 bg-white hover:shadow-sm transition-shadow">
                      {isEditing && (
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-700">Education #{index + 1}</h4>
                          <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <BrandMultiSelect
                              label={<>Institution <span className="text-red-500">*</span></>}
                              placeholder="Select Institution..."
                              options={schoolsDb}
                              selectedValues={edu.institution ? [edu.institution] : []}
                              mode="single"
                              onSelectedValuesChange={(vals) => {
                                const val = vals.length > 0 ? vals[0] : "";
                                updateEducation(edu.id, 'institution', val);
                              }}
                              onAddNewBrand={(brand) => {
                                const newBrand = { ...brand, id: brand.name };
                                setSchoolsDb((prev) => [...prev, newBrand]);
                                updateEducation(edu.id, 'institution', newBrand.id);
                              }}
                            />
                            <div className="space-y-1">
                              <Label className="text-xs font-medium flex items-center gap-1">Degree <span className="text-red-500">*</span></Label>
                              <SearchableSelect
                                value={degreeOptions.includes(edu.degree) && edu.degree !== "Other" ? edu.degree : ""}
                                onValueChange={(val) => {
                                  if (val !== "Other") {
                                    updateEducation(edu.id, 'degree', val);
                                  } else {
                                    setActiveEducationId(edu.id);
                                    setShowAddDegreeDialog(true);
                                  }
                                }}
                                options={degreeOptions}
                                placeholder="Select degree"
                                searchPlaceholder="Search degrees..."
                                emptyText="No degree found."
                                alwaysShowOther={true}
                              />
                            </div>
                          </div >

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="space-y-1">
                              <Label className="text-xs font-medium flex items-center gap-1">Start Year <span className="text-red-500">*</span></Label>
                              <Select value={edu.startYear} onValueChange={(v) => updateEducation(edu.id, 'startYear', v)}>
                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent className="bg-background border max-h-60">
                                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium flex items-center gap-1">End Year <span className="text-red-500">*</span></Label>
                              <Select value={edu.endYear} onValueChange={(v) => updateEducation(edu.id, 'endYear', v)}>
                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent className="bg-background border max-h-60">
                                  {futureYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200/70 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{edu.institution || edu.degree}</p>
                            {edu.institution && <p className="text-[12px] text-gray-500">{edu.degree}</p>}
                            <p className="text-[11px] text-gray-400">{edu.startYear} – {edu.endYear}</p>
                          </div>
                        </div>
                      )}
                    </div >
                  ))
                )}
              </CardContent >
            </Card >
          </TabsContent >

          {/* Housing Tab */}
          < TabsContent value="housing" className="space-y-4 mt-4" >
            {/* Search Type Card */}
            <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Home className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-[16px] font-bold text-gray-800">What are you looking for?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <RadioGroup
                    value={data.searchType}
                    onValueChange={(value) => updateField('searchType', value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="flat" id="edit-flat" />
                      <div className="flex-1">
                        <Label htmlFor="edit-flat" className="font-medium">Looking for a flat</Label>
                        <p className="text-sm text-muted-foreground">I need a place to live</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="flatmate" id="edit-flatmate" />
                      <div className="flex-1">
                        <Label htmlFor="edit-flatmate" className="font-medium">Looking for flatmates</Label>
                        <p className="text-sm text-muted-foreground">I have a flat and need roommates</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="both" id="edit-both" />
                      <div className="flex-1">
                        <Label htmlFor="edit-both" className="font-medium">Open to both</Label>
                        <p className="text-sm text-muted-foreground">I'm flexible with either option</p>
                      </div>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200/50">
                    <Home className="w-4 h-4 text-rose-500" />
                    <span className="text-[14px] font-semibold text-rose-700">
                    {data.searchType === 'flat' ? 'Looking for a flat' :
                      data.searchType === 'flatmate' ? 'Looking for flatmates' :
                        'Open to both'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card >

            {/* Looking for Flat — shown for flat seekers, same as signup */}
            {(data.searchType === "flat" || data.searchType === "both") && (
              <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Home className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="text-[16px] font-bold text-gray-800">Looking for Flat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Property Move-in Date
                    </Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        className="w-fit"
                        value={data.propertyMoveInDate || ''}
                        onChange={(e) => updateField('propertyMoveInDate', e.target.value)}
                      />
                    ) : (
                      <p className="text-[15px] font-semibold text-gray-900">
                        {data.propertyMoveInDate ? new Date(data.propertyMoveInDate).toLocaleDateString() : 'Not set'}
                      </p>
                    )}
                  </div>

                  {/* Preferred Search Area with Map */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Preferred Search Area
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isEditing ? 'Select the area where you\'re looking for a flat and adjust the search radius' : 'Selected area for search'}
                    </p>
                    {isEditing ? (
                      <MapPicker
                        showRadius
                        radius={data.searchRadius ?? 5}
                        location={data.searchLocation}
                        coordinates={data.searchCoordinates}
                        onLocationChange={(result) => {
                          setEditedProfile({
                            ...editedProfile,
                            searchLocation: result.fullAddress,
                            searchCoordinates: result.coordinates,
                          });
                        }}
                        onRadiusChange={(r) => {
                          updateField('searchRadius', r);
                        }}
                        height="280px"
                      />
                    ) : (
                      <div className="space-y-2">
                         <p className="text-[15px] font-semibold text-gray-900">
                          {data.searchLocation || 'No location selected'} (Radius: {data.searchRadius}km)
                        </p>
                        {data.searchCoordinates && (
                          <div className="h-[200px] rounded-md overflow-hidden border">
                            <MapPicker
                              disabled
                              location={data.searchLocation}
                              coordinates={data.searchCoordinates}
                              radius={data.searchRadius}
                              showRadius
                              height="200px"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flat Details — shown for flatmate seekers, same as signup */}
            {
              (data.searchType === 'flatmate' || data.searchType === 'both') && (
                <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                        <Home className="w-4 h-4 text-rose-500" />
                      </div>
                      <span className="text-[16px] font-bold text-gray-800">Your Flat Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Address & Map */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Flat Address
                      </Label>
                      {isEditing ? (
                        <div className="space-y-4">
                          <MapPicker
                            location={data.flatDetails.address}
                            coordinates={data.flatDetails.coordinates}
                            onLocationChange={(result) => {
                              setEditedProfile({
                                ...editedProfile,
                                flatDetails: {
                                  ...editedProfile.flatDetails,
                                  address: result.fullAddress,
                                  coordinates: result.coordinates,
                                  city: result.components.locality ?? editedProfile.flatDetails.city,
                                  state: result.components.state ?? editedProfile.flatDetails.state,
                                },
                                // Also update top-level city/state for overall consistency
                                city: result.components.locality ?? editedProfile.city,
                                state: result.components.state ?? editedProfile.state,
                              });
                            }}
                            height="240px"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>City</Label>
                              <Input
                                placeholder="e.g. Gurugram"
                                value={data.flatDetails.city}
                                onChange={(e) => updateField('flatDetails', { ...editedProfile.flatDetails, city: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>State</Label>
                              <Input
                                placeholder="e.g. Haryana"
                                value={data.flatDetails.state}
                                onChange={(e) => updateField('flatDetails', { ...editedProfile.flatDetails, state: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[15px] font-semibold text-gray-900">
                            {data.flatDetails.address || 'Not provided'}
                            {(data.flatDetails.city || data.flatDetails.state) && ` (${[data.flatDetails.city, data.flatDetails.state].filter(Boolean).join(', ')})`}
                          </p>
                          {data.flatDetails.coordinates && (
                            <div className="h-[200px] rounded-md overflow-hidden border">
                              <MapPicker
                                disabled
                                location={data.flatDetails.address}
                                coordinates={data.flatDetails.coordinates}
                                height="200px"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Flat Type & Furnishing */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Flat Type
                        </Label>
                        {isEditing ? (
                          <Select value={data.flatDetails.flatType || ''} onValueChange={(v) => updateField('flatDetails', { ...editedProfile.flatDetails, flatType: v })}>
                            <SelectTrigger>
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
                        ) : (
                          <p className="text-[15px] font-semibold text-gray-900">
                            {data.flatDetails.flatType ? { '1rk': '1 RK', '1bhk': '1 BHK', '2bhk': '2 BHK', '3bhk': '3 BHK', '4bhk': '4 BHK', '4+bhk': '4+ BHK' }[data.flatDetails.flatType] : 'Not provided'}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" /> Furnishing
                        </Label>
                        {isEditing ? (
                          <Select value={data.flatDetails.flatFurnishing || ''} onValueChange={(v) => updateField('flatDetails', { ...editedProfile.flatDetails, flatFurnishing: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select furnishing" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="non-furnished">Non Furnished</SelectItem>
                              <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                              <SelectItem value="fully-furnished">Fully Furnished</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[15px] font-semibold text-gray-900">
                            {data.flatDetails.flatFurnishing ? { 'non-furnished': 'Non Furnished', 'semi-furnished': 'Semi-Furnished', 'fully-furnished': 'Fully Furnished' }[data.flatDetails.flatFurnishing] : 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Room Details Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <DoorOpen className="w-5 h-5" />
                          Available Rooms
                        </h3>
                        {isEditing && (
                          <Button type="button" onClick={addRoom} variant="outline" size="sm" className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Room
                          </Button>
                        )}
                      </div>

                      {data.flatDetails.rooms.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-accent/30">
                          <DoorOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No rooms added yet</p>
                          <p className="text-sm">Click "Add Room" to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {data.flatDetails.rooms.map((room, index) => (
                            <div key={room.id} className="border rounded-lg p-4 space-y-4 bg-accent/30">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-foreground">Room #{index + 1} — {roomTypeLabels[room.roomType]}</h4>
                                {isEditing && (
                                  <Button type="button" onClick={() => removeRoom(room.id)} variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>

                              {isEditing ? (
                                <>
                                  {/* Room Type */}
                                  <div className="space-y-2">
                                    <Label>Room Type</Label>
                                    <RadioGroup
                                      value={room.roomType}
                                      onValueChange={(value) => updateRoom(room.id, 'roomType', value)}
                                      className="grid grid-cols-2 gap-2"
                                    >
                                      {Object.entries(roomTypeLabels).map(([value, label]) => (
                                        <div key={value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                                          <RadioGroupItem value={value} id={`profile-${room.id}-${value}`} />
                                          <Label htmlFor={`profile-${room.id}-${value}`} className="text-sm cursor-pointer">{label}</Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </div>

                                  {/* Quantity & Rent */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label>Available Quantity</Label>
                                      <Input type="number" min={1} placeholder="1" value={room.quantity} onChange={(e) => updateRoom(room.id, 'quantity', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Rent (₹/month)</Label>
                                      <Input type="number" placeholder="Ex: 15000" value={room.rent} onChange={(e) => updateRoom(room.id, 'rent', e.target.value)} />
                                    </div>
                                  </div>

                                  {/* Deposit & Brokerage */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label>Security Deposit</Label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <span className="text-xs text-muted-foreground">No Deposit</span>
                                          <Checkbox
                                            checked={room.securityDeposit.startsWith('none|')}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateRoom(room.id, 'securityDeposit', `none|${room.securityDeposit || '2 Month'}`);
                                              } else {
                                                updateRoom(room.id, 'securityDeposit', room.securityDeposit.replace('none|', ''));
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <div className={`flex gap-2 transition-opacity ${room.securityDeposit.startsWith('none|') ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <Input type="number" min={1} placeholder="Ex: 2" value={(room.securityDeposit.replace('none|', ''))?.split(' ')[0] || ''} onChange={(e) => { const raw = room.securityDeposit.replace('none|', ''); const unit = raw?.split(' ')[1] || 'Month'; updateRoom(room.id, 'securityDeposit', e.target.value ? `${e.target.value} ${unit}` : ''); }} className="flex-1" />
                                        <Select value={(room.securityDeposit.replace('none|', ''))?.split(' ')[1] || 'Month'} onValueChange={(unit) => { const raw = room.securityDeposit.replace('none|', ''); const count = raw?.split(' ')[0] || ''; updateRoom(room.id, 'securityDeposit', count ? `${count} ${unit}` : ''); }}>
                                          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Day">Day</SelectItem>
                                            <SelectItem value="Month">Month</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label>Brokerage</Label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                          <span className="text-xs text-muted-foreground">No Brokerage</span>
                                          <Checkbox
                                            checked={room.brokerage.startsWith('none|')}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                updateRoom(room.id, 'brokerage', `none|${room.brokerage || '15 Day'}`);
                                              } else {
                                                updateRoom(room.id, 'brokerage', room.brokerage.replace('none|', ''));
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <div className={`flex gap-2 transition-opacity ${room.brokerage.startsWith('none|') ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <Input type="number" min={1} placeholder="Ex: 1" value={(room.brokerage.replace('none|', ''))?.split(' ')[0] || ''} onChange={(e) => { const raw = room.brokerage.replace('none|', ''); const unit = raw?.split(' ')[1] || 'Month'; updateRoom(room.id, 'brokerage', e.target.value ? `${e.target.value} ${unit}` : ''); }} className="flex-1" />
                                        <Select value={(room.brokerage.replace('none|', ''))?.split(' ')[1] || 'Month'} onValueChange={(unit) => { const raw = room.brokerage.replace('none|', ''); const count = raw?.split(' ')[0] || ''; updateRoom(room.id, 'brokerage', count ? `${count} ${unit}` : ''); }}>
                                          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Day">Day</SelectItem>
                                            <SelectItem value="Month">Month</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Available From */}
                                  <div className="space-y-2">
                                    <Label>Available From</Label>
                                    <Input type="date" value={room.availableFrom} onChange={(e) => updateRoom(room.id, 'availableFrom', e.target.value)} />
                                  </div>

                                  {/* Room Amenities */}
                                  <div className="space-y-3">
                                    <Label>Room Amenities</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {roomAmenitiesList.map((amenity) => (
                                        <div key={amenity} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`profile-room-${room.id}-${amenity}`}
                                            checked={room.amenities?.includes(amenity) || false}
                                            onCheckedChange={() => handleRoomAmenityToggle(room.id, amenity)}
                                          />
                                          <Label htmlFor={`profile-room-${room.id}-${amenity}`} className="text-sm">{amenity}</Label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Room Photos */}
                                  <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                      <Camera className="w-4 h-4" />
                                      Room Photos & Videos
                                    </Label>
                                    <MediaUpload
                                      value={room.media || []}
                                      onChange={(mediaFiles) => updateRoom(room.id, 'media', mediaFiles)}
                                      maxFiles={5}
                                      acceptedTypes={['image/*', 'video/*']}
                                    />
                                  </div>
                                </>
                              ) : (
                                /* View mode */
                                <>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Qty:</span>
                                      <p className="font-medium">{room.quantity}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Rent:</span>
                                      <p className="font-medium">₹{parseInt(room.rent || '0').toLocaleString()}/mo</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Deposit:</span>
                                      <p className="font-medium">{room.securityDeposit.startsWith('none|') ? 'No Deposit' : (room.securityDeposit || 'Not set')}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Brokerage:</span>
                                      <p className="font-medium">{room.brokerage.startsWith('none|') ? 'No Brokerage' : (room.brokerage || 'Not set')}</p>
                                    </div>
                                  </div>
                                  {room.availableFrom && (
                                    <p className="text-sm">
                                      <span className="text-muted-foreground">Available from:</span>{' '}
                                      <span className="font-medium">{new Date(room.availableFrom).toLocaleDateString()}</span>
                                    </p>
                                  )}
                                  {room.amenities.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {room.amenities.map(amenity => (
                                        <span key={amenity} className="px-2 py-0.5 bg-secondary/50 text-secondary-foreground rounded text-xs">{amenity}</span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Room Media in view mode */}
                                  {room.media && room.media.length > 0 && (
                                    <div className="space-y-2 pt-2">
                                      <Label className="flex items-center gap-2 text-sm">
                                        <Camera className="w-4 h-4" />
                                        Room Photos & Videos
                                      </Label>
                                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                        {room.media.map((media: MediaFile, mediaIndex: number) => (
                                          <div key={mediaIndex} className="relative rounded-lg overflow-hidden border aspect-square">
                                            {media.type === 'video' ? (
                                              <video
                                                src={media.url}
                                                className="w-full h-full object-cover"
                                                controls
                                              />
                                            ) : (
                                              <img
                                                src={media.url}
                                                alt={`Room photo ${mediaIndex + 1}`}
                                                className="w-full h-full object-cover"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Common Amenities */}
                    <div className="space-y-3 pt-4 border-t">
                      <h3 className="text-lg font-semibold text-foreground">Common Amenities</h3>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          {commonAmenitiesList.map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                              <Checkbox
                                id={`profile-common-${amenity}`}
                                checked={data.flatDetails.commonAmenities?.includes(amenity) || false}
                                onCheckedChange={() => handleCommonAmenityToggle(amenity)}
                              />
                              <Label htmlFor={`profile-common-${amenity}`} className="text-sm">{amenity}</Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {data.flatDetails.commonAmenities.length > 0 ? data.flatDetails.commonAmenities.map(amenity => (
                            <span key={amenity} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{amenity}</span>
                          )) : (
                            <p className="text-muted-foreground">No amenities listed</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Flat Description</Label>
                      {isEditing ? (
                        <div>
                          <Textarea
                            placeholder="Tell potential flatmates about your place..."
                            value={data.flatDetails.description}
                            onChange={(e) => updateField('flatDetails', { ...editedProfile.flatDetails, description: e.target.value })}
                            rows={3}
                            maxLength={800}
                          />
                          <p className="text-xs text-muted-foreground text-right mt-1">{(data.flatDetails.description || '').length}/800</p>
                        </div>
                      ) : (
                        <p className="text-[15px] font-semibold text-gray-900">{data.flatDetails.description || 'No description'}</p>
                      )}
                    </div>

                    {/* Common Photos & Videos */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Common Area Photos & Videos
                      </Label>
                      {isEditing ? (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Add photos and videos of common areas (living room, kitchen, etc.)
                          </p>
                          <MediaUpload
                            value={data.flatDetails.commonMedia || []}
                            onChange={(v) => updateField('flatDetails', { ...editedProfile.flatDetails, commonMedia: v })}
                            maxFiles={10}
                            acceptedTypes={['image/*', 'video/*']}
                          />
                        </>
                      ) : (
                        data.flatDetails.commonMedia && data.flatDetails.commonMedia.length > 0 ? (
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {data.flatDetails.commonMedia.map((media: MediaFile, index: number) => (
                              <div key={index} className="relative rounded-lg overflow-hidden border aspect-square">
                                {media.type === 'video' ? (
                                  <video
                                    src={media.url}
                                    className="w-full h-full object-cover"
                                    controls
                                  />
                                ) : (
                                  <img
                                    src={media.url}
                                    alt={`Common area photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No common area media uploaded</p>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            }
          </TabsContent >

          {/* Habits Tab */}
          < TabsContent value="habits" className="space-y-4 mt-4" >
            <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-[16px] font-bold text-gray-800">My Habits</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    {habitCategories.map((category) => (
                      <div key={category.key} className="space-y-2">
                        <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</Label>
                        <div className="flex flex-wrap gap-2">
                          {category.options.map((option) => {
                            const isSelected = data.myHabits.includes(option.label);
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.label}
                                type="button"
                                onClick={() => toggleHabit(option.label)}
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
                ) : (
                  <div className="space-y-3">
                    {data.myHabits.length > 0 ? (
                      habitCategories.map((category) => {
                        const selectedHabit = data.myHabits.find(h => category.options.some(o => o.label === h));
                        if (!selectedHabit) return null;
                        const Icon = getHabitIcon(selectedHabit);
                        return (
                          <div key={category.key} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-muted-foreground uppercase w-24">{category.name}</span>
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                              {Icon && <Icon className="w-3.5 h-3.5" />}
                              {selectedHabit}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">No habits specified</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent >

          {/* Saved Profiles Tab */}
          < TabsContent value="saved" className="space-y-4 mt-4" >
            <Card className="rounded-2xl border-gray-200/60 shadow-[0_2px_12px_hsl(220_13%_91%/0.4)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-[16px] font-bold text-gray-800">Saved Profiles ({savedProfiles.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedProfilesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Loading saved profiles...</p>
                  </div>
                ) : savedProfiles.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-lg font-medium text-foreground">No saved profiles yet</p>
                      <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                        Found someone interesting? Click the heart icon on their card to save them here!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedProfiles.map((savedProfile: any) => (
                      <div
                        key={savedProfile.id}
                        className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-rose-200/60 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => {
                          setSearchParams({ profile: savedProfile.id, from: 'saved' });
                        }}
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
                          <img
                            src={savedProfile.profile_picture_url || "/placeholder.svg"}
                            alt={savedProfile.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gray-900 truncate">{savedProfile.name}, {savedProfile.age}</p>
                          <p className="text-[12px] text-gray-500 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {savedProfile.city}, {savedProfile.state}
                          </p>
                          <Badge
                            variant={savedProfile.search_type === "flatmate" ? "default" : "secondary"}
                            className="text-xs mt-1"
                          >
                            {savedProfile.search_type === "flatmate" ? "Has Flat" : "Looking for Flat"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnsaveProfile(savedProfile.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-wrap gap-1">
                          {savedProfile.user_habits && Array.isArray(savedProfile.user_habits) && (
                            <>
                              {savedProfile.user_habits.slice(0, 3).map((habit: any) => (
                                <Badge key={habit.habit.label} variant="outline" className="text-xs">
                                  {habit.habit.label}
                                </Badge>
                              ))}
                              {savedProfile.user_habits.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{savedProfile.user_habits.length - 3} more
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div> {/* Close px-4 content wrapper */}
      </div> {/* Close max-w-4xl */}
      {/* Add Custom Degree Dialog */}
      <Dialog open={showAddDegreeDialog} onOpenChange={setShowAddDegreeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Degree</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="degreeFullName">Degree Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="degreeFullName"
                placeholder="e.g. Bachelor of Technology"
                value={newDegreeFullName}
                onChange={(e) => setNewDegreeFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degreeCommonName">Most commonly known as <span className="text-red-500">*</span></Label>
              <Input
                id="degreeCommonName"
                placeholder="e.g. B.Tech"
                value={newDegreeCommonName}
                onChange={(e) => setNewDegreeCommonName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degreeOtherNames">Other common names</Label>
              <Input
                id="degreeOtherNames"
                placeholder="e.g. BTech, B.E."
                value={newDegreeOtherNames}
                onChange={(e) => setNewDegreeOtherNames(e.target.value)}
              />
            </div>
            <Button
              className="mt-2 w-full"
              disabled={!newDegreeFullName.trim() || !newDegreeCommonName.trim()}
              onClick={() => {
                if (!newDegreeCommonName.trim() || !activeEducationId) return;

                // Add to options at the end, before "Other"
                setDegreeOptions(prev => {
                  const withoutOther = prev.filter(d => d !== "Other");
                  return [...withoutOther, newDegreeCommonName, "Other"];
                });

                // Auto-select the newly added degree
                updateEducation(activeEducationId, 'degree', newDegreeCommonName);

                // Clean up modal state
                toast({
                  title: "Degree Added",
                  description: "Thanks for expanding our list!"
                });
                setNewDegreeFullName("");
                setNewDegreeCommonName("");
                setNewDegreeOtherNames("");
                setShowAddDegreeDialog(false);
                setActiveEducationId(null);
              }}
            >
              Add to DB
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Custom Position Dialog */}
      <Dialog open={showAddPositionDialog} onOpenChange={setShowAddPositionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Position</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="positionFullName">Position Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="positionFullName"
                placeholder="e.g. Software Development Engineer"
                value={newPositionFullName}
                onChange={(e) => setNewPositionFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="positionCommonName">Most commonly known as <span className="text-red-500">*</span></Label>
              <Input
                id="positionCommonName"
                placeholder="e.g. SDE"
                value={newPositionCommonName}
                onChange={(e) => setNewPositionCommonName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="positionOtherNames">Other common names</Label>
              <Input
                id="positionOtherNames"
                placeholder="e.g. Developer, Dev"
                value={newPositionOtherNames}
                onChange={(e) => setNewPositionOtherNames(e.target.value)}
              />
            </div>
            <Button
              className="mt-2 w-full"
              disabled={!newPositionFullName.trim() || !newPositionCommonName.trim()}
              onClick={() => {
                if (!newPositionCommonName.trim() || !activeJobIdForPosition) return;

                setPositionOptions(prev => {
                  const withoutOther = prev.filter(d => d !== "Other");
                  return [...withoutOther, newPositionCommonName, "Other"];
                });

                updateJobExperience(activeJobIdForPosition, 'position', newPositionCommonName);

                toast({
                  title: "Position Added",
                  description: "Thanks for expanding our list!"
                });
                setNewPositionFullName("");
                setNewPositionCommonName("");
                setNewPositionOtherNames("");
                setShowAddPositionDialog(false);
                setActiveJobIdForPosition(null);
              }}
            >
              Add to DB
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── OTP Verification Dialog (same as signup form) ── */}
      <Dialog open={otpDialogOpen} onOpenChange={(open) => { if (!otpVerifying) setOtpDialogOpen(open); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="text-center space-y-2 sm:space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(346 77% 49%), hsl(346 77% 65%))' }}>
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-center">
              Verify {otpType === "phone" ? "Phone Number" : "Email Address"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground text-center">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-foreground break-all">
                {otpType === "phone" ? `${countryCode} ${data.phone}` : data.email}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 sm:gap-6 py-3 sm:py-4">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={(value) => { setOtpValue(value); setOtpError(""); }}
            >
              <InputOTPGroup className="gap-1.5 sm:gap-2">
                <InputOTPSlot index={0} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md" />
                <InputOTPSlot index={1} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md" />
                <InputOTPSlot index={2} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md" />
                <InputOTPSlot index={3} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md" />
                <InputOTPSlot index={4} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md" />
                <InputOTPSlot index={5} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md" />
              </InputOTPGroup>
            </InputOTP>

            {otpError && (
              <p className="text-xs sm:text-sm text-red-500 text-center px-2">{otpError}</p>
            )}

            <Button
              onClick={handleOtpVerify}
              disabled={otpValue.length !== 6 || otpVerifying}
              className="w-full h-10 sm:h-11 text-sm sm:text-base rounded-xl bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500 text-white"
            >
              {otpVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              {otpCountdown > 0 ? (
                <p>Resend code in{" "}<span className="font-semibold text-foreground">{otpCountdown}s</span></p>
              ) : (
                <button onClick={handleResendOtp} className="text-rose-500 font-semibold hover:underline transition-colors" type="button">
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Profile Geometric Background Styles ─── */
const profileGeoStyles = `
  @keyframes profile-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-14px); }
  }
  @keyframes profile-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes profile-drift {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(12px, -8px); }
    50% { transform: translate(-4px, -16px); }
    75% { transform: translate(-12px, -6px); }
  }
  @keyframes profile-pulse-ring {
    0% { transform: scale(0.85); opacity: 0.4; }
    50% { transform: scale(1.1); opacity: 0.15; }
    100% { transform: scale(0.85); opacity: 0.4; }
  }
  @keyframes profile-pulse-glow {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }
  .profile-spin-slow {
    animation: profile-spin 30s linear infinite;
  }
  .profile-pulse-ring {
    animation: profile-pulse-ring 5s ease-in-out infinite;
  }
  .profile-drift {
    animation: profile-drift 9s ease-in-out infinite;
  }
  .profile-float-anim {
    animation: profile-float 5s ease-in-out infinite;
  }
  .profile-orb {
    animation: profile-pulse-glow 7s ease-in-out infinite;
    pointer-events: none;
  }
`;
