import { useState } from "react";
import { habitCategories, getCategoryForHabit, getHabitIcon } from "@/constants/habits";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  Edit2, Save, X, Plus, Trash2, Camera, Heart, Bookmark, Share2, Copy, Check, DoorOpen, Building2
} from "lucide-react";
import { MediaUpload } from "@/components/ui/media-upload";
import { mockProfiles } from "@/data/mockProfiles";
import { Profile } from "@/components/profile/ProfileCard";

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
  gender: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  profilePictureUrl: string;
  jobExperiences: JobExperience[];
  educationExperiences: EducationExperience[];
  // Housing Details
  searchType: "flat" | "flatmate" | "both";
  flatDetails: {
    address: string;
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

// Mock user data - this would come from your auth/database
const mockUserProfile: UserProfile = {
  name: "John Doe",
  age: "28",
  gender: "male",
  phone: "9876543210",
  email: "john.doe@example.com",
  city: "Mumbai",
  state: "Maharashtra",
  profilePictureUrl: "",
  jobExperiences: [
    {
      id: "1",
      company: "Tech Corp",
      position: "Software Engineer",
      fromYear: "2020",
      tillYear: "",
      currentlyWorking: true
    }
  ],
  educationExperiences: [
    {
      id: "1",
      institution: "IIT Mumbai",
      degree: "B.Tech Computer Science",
      startYear: "2016",
      endYear: "2020"
    }
  ],
  searchType: "both",
  flatDetails: {
    address: "402, Sunshine Apartments, Lokhandwala Complex, Andheri West, Mumbai - 400053",
    flatType: "2bhk",
    flatFurnishing: "semi-furnished",
    rooms: [
      {
        id: "1",
        roomType: "private",
        quantity: "2",
        rent: "18000",
        securityDeposit: "2 Month",
        brokerage: "none|15 Day",
        availableFrom: "2024-02-15",
        amenities: ["WiFi", "Parking"],
        media: []
      },
      {
        id: "2",
        roomType: "shared",
        quantity: "1",
        rent: "10000",
        securityDeposit: "1 Month",
        brokerage: "1 Month",
        availableFrom: "2024-02-01",
        amenities: ["WiFi"],
        media: []
      }
    ],
    commonAmenities: ["WiFi", "Parking", "Gym"],
    description: "Spacious 3BHK apartment in a prime location with great connectivity. Looking for working professionals or students.",
    commonMedia: []
  },
  myHabits: ["Non-Smoker", "Early Riser", "Vegetarian"]
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
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(mockUserProfile);
  const [savedProfileIds, setSavedProfileIds] = useState<string[]>(["1", "3"]); // Mock saved profiles
  const [, setSearchParams] = useSearchParams();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

  const [companiesDb, setCompaniesDb] = useState<BrandOption[]>([
    { id: "Google", name: "Google", aliases: ["Alphabet"], logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" },
    { id: "TCS", name: "TCS", aliases: ["Tata Consultancy Services"], logo: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg" },
    { id: "Microsoft", name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  ]);
  const [schoolsDb, setSchoolsDb] = useState<BrandOption[]>([
    { id: "IIT Delhi", name: "IIT Delhi", aliases: ["Indian Institute of Technology Delhi"], logo: "https://upload.wikimedia.org/wikipedia/en/1/1d/Indian_Institute_of_Technology_Delhi_Logo.svg" },
    { id: "NIT Trichy", name: "NIT Trichy", aliases: ["National Institute of Technology"], logo: "https://upload.wikimedia.org/wikipedia/en/c/c4/National_Institute_of_Technology%2C_Tiruchirappalli_Logo.png" },
  ]);
  const [positionOptions, setPositionOptions] = useState<string[]>([
    "Academic Counselor", "Account Executive", "Account Manager", "Accountant", "Advisor",
    "Analyst", "Android Developer", "Animator", "Apprentice", "Art Director",
    "Associate", "Associate Product Manager (APM)", "Auditor",
    "Backend Developer", "Board Member", "Brand Manager", "Business Analyst",
    "Business Development Associate", "Business Development Manager",
    "CEO", "CFO", "CHRO", "CIO", "CISO", "CMO", "COO", "CPO", "CSM", "CTO",
    "Chartered Accountant (CA)", "Chief Financial Officer", "Clinical Research Associate",
    "Cloud Architect", "Cloud Engineer", "Co-Founder", "Company Secretary (CS)",
    "Compensation & Benefits Analyst", "Compliance Officer", "Consultant",
    "Consultant (Independent)", "Content Strategist", "Content Writer", "Controller",
    "Copywriter", "Corporate Lawyer", "Creative Director",
    "Data Analyst", "Data Engineer", "Data Scientist", "Database Administrator (DBA)",
    "Design Lead", "DevOps Engineer", "Digital Marketing Manager",
    "Director of Engineering", "Director of Product", "Distinguished Engineer", "Doctor",
    "Editor", "Embedded Systems Engineer", "Engineering Manager", "Entrepreneur",
    "Fellow", "Finance Manager", "Financial Analyst", "Founder", "Freelancer",
    "Frontend Developer", "Full Stack Developer",
    "Game Developer", "General Counsel", "General Manager", "Graduate Trainee",
    "Graphic Designer", "Group Product Manager", "Growth Manager",
    "HR Business Partner", "HR Executive", "HR Manager",
    "IM", "Instructional Designer", "Interaction Designer", "Intern",
    "Investment Analyst", "Investment Banker", "iOS Developer",
    "Journalist",
    "Key Account Manager",
    "Lab Technician", "Learning & Development Manager", "Lecturer",
    "Legal Associate", "Legal Counsel", "Logistics Manager",
    "Machine Learning Engineer", "Management Consultant", "Management Trainee",
    "Managing Director", "Marketing Analyst", "Marketing Executive", "Marketing Manager",
    "Medical Officer", "Mobile Developer",
    "Network Engineer", "Nurse",
    "Operations Analyst", "Operations Manager",
    "Paralegal", "Partner", "People Operations Manager", "Performance Marketer",
    "Pharmacist", "Photographer", "Platform Engineer", "Portfolio Manager",
    "President", "Principal Consultant", "Principal Engineer",
    "Process Improvement Manager", "Procurement Manager",
    "Product Designer", "Product Manager", "Professor",
    "QA Analyst", "QA Engineer",
    "Recruiter", "Research Associate", "Research Scientist", "Risk Analyst",
    "SDE 1", "SDE 2", "SDE 3", "SDET", "SEO Specialist",
    "SRE", "SWE", "SWE 1", "SWE 2", "SWE 3",
    "Sales Associate", "Sales Engineer", "Sales Executive", "Sales Manager",
    "Security Analyst", "Security Engineer",
    "Senior Associate", "Senior Consultant", "Senior Engineering Manager",
    "Senior Product Manager", "Site Reliability Engineer",
    "Social Media Manager", "Software Architect", "Software Engineer",
    "Staff Engineer", "Strategy Analyst", "Supply Chain Manager", "Systems Engineer",
    "Talent Acquisition Specialist", "Tax Consultant", "Teacher", "Team Lead",
    "Technical Lead", "Test Engineer", "Trainee", "Trainer", "Treasury Analyst",
    "UI Designer", "UI/UX Developer", "UX Designer", "UX Researcher",
    "VP of Engineering", "VP of Product", "Vice President",
    "Video Editor", "Videographer", "Visual Designer",
    "Warehouse Manager", "Web Developer",
    "Other"
  ]);
  const [degreeOptions, setDegreeOptions] = useState<string[]>([
    "10th Standard", "12th Standard", "B.A.", "B.Arch", "B.Com", "B.Des", "B.E.", "B.Ed", "B.F.A.", "B.P.Ed",
    "B.Pharm", "B.Plan", "B.Sc", "B.Sc. Nursing", "B.Tech", "BAMS", "BBA", "BCA", "BDS", "BHM / BHMCT", "BHMS",
    "BMS", "BPT", "BSW", "BVSc & AH", "CA", "CMA", "CS", "Diploma", "LLB", "LLM", "M.A.", "M.Arch", "M.Com",
    "M.Des", "M.E.", "M.Pharm", "M.Phil", "M.Sc", "M.Tech", "MBA", "MBBS", "MCA", "MD", "MDS", "MFA", "MPT",
    "MS", "MSW", "PGDM", "Ph.D.", "Pharm.D", "Other"
  ]);

  // Mock user ID - in real app this would come from auth
  const currentUserId = "current-user";
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

  const savedProfiles = mockProfiles.filter(p => savedProfileIds.includes(p.id));

  const handleUnsaveProfile = (profileId: string) => {
    setSavedProfileIds(prev => prev.filter(id => id !== profileId));
    toast({
      title: "Profile Removed",
      description: "Profile has been removed from saved.",
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());
  const futureYears = Array.from({ length: 11 }, (_, i) => (currentYear + i).toString());

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
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
      id: Date.now().toString(),
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

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
            <p className="text-muted-foreground">View and manage your profile details</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
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

        {/* Profile Picture & Basic Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-border flex items-center justify-center overflow-hidden bg-accent/30">
                  {data.profilePictureUrl ? (
                    <img src={data.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                )}
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h2 className="text-2xl font-bold text-foreground">{data.name}</h2>
                <p className="text-muted-foreground">{data.city}, {data.state}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" /> {data.phone}
                  </span>
                  {data.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" /> {data.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="housing">Housing</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1">
              <Bookmark className="w-4 h-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    {isEditing ? (
                      <Input
                        value={data.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={data.age}
                        onChange={(e) => updateField('age', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.age} years</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    {isEditing ? (
                      <RadioGroup
                        value={data.gender}
                        onValueChange={(value) => updateField('gender', value)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="edit-male" />
                          <Label htmlFor="edit-male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="edit-female" />
                          <Label htmlFor="edit-female">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="edit-other" />
                          <Label htmlFor="edit-other">Other</Label>
                        </div>
                      </RadioGroup>
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md capitalize">{data.gender}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {isEditing ? (
                      <Input
                        value={data.phone}
                        onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={data.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.email || 'Not provided'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    {isEditing ? (
                      <Input
                        value={data.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    {isEditing ? (
                      <Input
                        value={data.state}
                        onChange={(e) => updateField('state', e.target.value)}
                      />
                    ) : (
                      <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.state}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Work Experience
                  </span>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addJobExperience}>
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
                    <div key={exp.id} className="border rounded-lg p-4 space-y-3 bg-accent/20">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Experience #{index + 1}</h4>
                        {isEditing && (
                          <Button variant="ghost" size="sm" onClick={() => removeJobExperience(exp.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-3">
                          <BrandMultiSelect
                            label=""
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
                          <Select value={exp.fromYear} onValueChange={(v) => updateJobExperience(exp.id, 'fromYear', v)}>
                            <SelectTrigger><SelectValue placeholder="From Year" /></SelectTrigger>
                            <SelectContent className="bg-background border max-h-60">
                              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          {exp.currentlyWorking ? (
                            <div className="h-10 px-3 py-2 bg-muted border rounded-md flex items-center text-muted-foreground">
                              Currently Working
                            </div>
                          ) : (
                            <Select value={exp.tillYear} onValueChange={(v) => updateJobExperience(exp.id, 'tillYear', v)}>
                              <SelectTrigger><SelectValue placeholder="Till Year" /></SelectTrigger>
                              <SelectContent className="bg-background border max-h-60">
                                {futureYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                          <div className="flex items-center space-x-2 col-span-full">
                            <Checkbox
                              checked={exp.currentlyWorking}
                              onCheckedChange={(c) => updateJobExperience(exp.id, 'currentlyWorking', c)}
                            />
                            <Label>Currently working here</Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{exp.position} at {exp.company}</p>
                          <p className="text-sm text-muted-foreground">
                            {exp.fromYear} - {exp.currentlyWorking ? 'Present' : exp.tillYear}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Education
                  </span>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addEducation}>
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
                    <div key={edu.id} className="border rounded-lg p-4 space-y-3 bg-accent/20">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Education #{index + 1}</h4>
                        {isEditing && (
                          <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <BrandMultiSelect
                              label=""
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
                            < SearchableSelect
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
                          </div >

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <Select value={edu.startYear} onValueChange={(v) => updateEducation(edu.id, 'startYear', v)}>
                              <SelectTrigger><SelectValue placeholder="Start Year" /></SelectTrigger>
                              <SelectContent className="bg-background border max-h-60">
                                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select value={edu.endYear} onValueChange={(v) => updateEducation(edu.id, 'endYear', v)}>
                              <SelectTrigger><SelectValue placeholder="End Year" /></SelectTrigger>
                              <SelectContent className="bg-background border max-h-60">
                                {futureYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <div>
                          <p className="font-medium">{edu.degree}</p>
                          <p className="text-sm text-muted-foreground">
                            {edu.institution} • {edu.startYear} - {edu.endYear}
                          </p>
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
            < Card >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  What are you looking for?
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
                  <p className="text-foreground p-2 bg-muted/30 rounded-md">
                    {data.searchType === 'flat' ? 'Looking for a flat' :
                      data.searchType === 'flatmate' ? 'Looking for flatmates' :
                        'Open to both'}
                  </p>
                )}
              </CardContent>
            </Card >

            {/* Flat Details — shown for flatmate seekers, same as signup */}
            {
              (data.searchType === 'flatmate' || data.searchType === 'both') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Your Flat Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Address */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> Flat Address
                      </Label>
                      {isEditing ? (
                        <Input
                          value={data.flatDetails.address}
                          onChange={(e) => updateField('flatDetails', { ...editedProfile.flatDetails, address: e.target.value })}
                          placeholder="123 Main St, City"
                        />
                      ) : (
                        <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.flatDetails.address || 'Not provided'}</p>
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
                          <p className="text-foreground p-2 bg-muted/30 rounded-md">
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
                          <p className="text-foreground p-2 bg-muted/30 rounded-md">
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
                        <p className="text-foreground p-2 bg-muted/30 rounded-md">{data.flatDetails.description || 'No description'}</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  My Habits
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5" />
                  Saved Profiles ({savedProfiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No saved profiles yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Save profiles you're interested in by clicking the bookmark icon
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedProfiles.map((savedProfile) => (
                      <div
                        key={savedProfile.id}
                        className="border rounded-lg p-4 space-y-3 bg-accent/20 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => setSearchParams({ profile: savedProfile.id, from: "saved" })}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={savedProfile.profilePicture}
                            alt={savedProfile.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{savedProfile.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {savedProfile.age} years • {savedProfile.city}, {savedProfile.state}
                            </p>
                            <Badge
                              variant={savedProfile.searchType === "flatmate" ? "default" : "secondary"}
                              className="text-xs mt-1"
                            >
                              {savedProfile.searchType === "flatmate" ? "Has Flat" : "Looking for Flat"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnsaveProfile(savedProfile.id);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {savedProfile.myHabits.slice(0, 3).map((habit) => (
                            <Badge key={habit} variant="outline" className="text-xs">
                              {habit}
                            </Badge>
                          ))}
                          {savedProfile.myHabits.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{savedProfile.myHabits.length - 3} more
                            </Badge>
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
      </div>

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
    </div>
  );
};
