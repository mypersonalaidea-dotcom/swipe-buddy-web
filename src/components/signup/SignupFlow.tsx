import { useState } from "react";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { HousingDetailsStep } from "./HousingDetailsStep";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

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
  description: string;
  amenities: string[];
  media: MediaFile[];
}

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

interface SignupData {
  personalInfo: {
    name: string;
    age: string;
    gender: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    profilePicture: File | null;
    phoneVerified: boolean;
    emailVerified: boolean;
    jobExperiences: JobExperience[];
    educationExperiences: EducationExperience[];
  };
  housingDetails: {
    searchType: "flat" | "flatmate" | "both";
    propertyMoveInDate?: string;
    searchLocation?: string;
    searchCoordinates?: [number, number];
    searchRadius?: number;
    flatDetails: {
      address: string;
      /** [longitude, latitude] — set by AddressAutocomplete */
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
  };
}

interface SignupFlowProps {
  onComplete?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupFlow = ({ onComplete, onSwitchToLogin }: SignupFlowProps = {}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { signup } = useAuth();

  const [signupData, setSignupData] = useState<SignupData>({
    personalInfo: {
      name: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      profilePicture: null,
      phoneVerified: false,
      emailVerified: false,
      jobExperiences: [],
      educationExperiences: []
    },
    housingDetails: {
      searchType: "flat",
      propertyMoveInDate: new Date().toISOString().split('T')[0],
      flatDetails: {
        address: "",
        city: "",
        state: "",
        flatType: "",
        flatFurnishing: "",
        rooms: [],
        commonAmenities: [],
        description: "",
        commonMedia: []
      }
    }
  });

  const handlePersonalInfoUpdate = (data: SignupData['personalInfo']) => {
    setSignupData(prev => ({ ...prev, personalInfo: data }));
  };

  const handleHousingDetailsUpdate = (data: SignupData['housingDetails']) => {
    setSignupData(prev => ({ ...prev, housingDetails: data }));
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const { personalInfo, housingDetails } = signupData;
    setIsSubmitting(true);

    try {
      // 1. Create account (with all mandatory fields)
      await signup({
        name: personalInfo.name,
        email: personalInfo.email,
        password: personalInfo.password,
        phone: personalInfo.phone,
        age: parseInt(personalInfo.age) || 0,
        gender: personalInfo.gender,
      });

      // 2. Update profile with age, gender, city, search_type
      await api.put("/profile", {
        age: parseInt(personalInfo.age) || undefined,
        gender: personalInfo.gender || undefined,
        search_type: housingDetails.searchType,
      });

      // 3. Add job experiences (parallel)
      if (personalInfo.jobExperiences.length > 0) {
        await Promise.all(
          personalInfo.jobExperiences
            .filter(j => j.company || j.position)
            .map((j, idx) =>
              api.post("/profile/jobs", {
                company_name: j.company || undefined,
                position_name: j.position || undefined,
                from_year: j.fromYear || undefined,
                till_year: j.currentlyWorking ? undefined : (j.tillYear || undefined),
                currently_working: j.currentlyWorking,
                display_order: idx + 1,
              })
            )
        );
      }

      // 4. Add education experiences (parallel)
      if (personalInfo.educationExperiences.length > 0) {
        await Promise.all(
          personalInfo.educationExperiences
            .filter(e => e.institution || e.degree)
            .map((e, idx) =>
              api.post("/profile/education", {
                institution_name: e.institution || undefined,
                degree_name: e.degree || undefined,
                start_year: e.startYear || undefined,
                end_year: e.endYear || undefined,
                display_order: idx + 1,
              })
            )
        );
      }

      // 5. Create flat listing with rooms + amenities if user has flat details
      const { flatDetails, searchType } = housingDetails;
      if ((searchType === "flatmate" || searchType === "both") && flatDetails.address) {
        const furnishingMap: Record<string, string> = {
          "fully-furnished": "furnished",
          "semi-furnished": "semifurnished",
          "non-furnished": "unfurnished",
        };

        // Extract lat/lng from coordinates [lng, lat]
        const latitude  = flatDetails.coordinates?.[1];
        const longitude = flatDetails.coordinates?.[0];

        // Build rooms array for nested creation
        const rooms = flatDetails.rooms
          .filter(r => r.roomType)
          .map((r, idx) => ({
            room_name: r.roomName || undefined,
            room_type: r.roomType,
            rent: r.rent ? parseFloat(r.rent) : undefined,
            security_deposit: r.securityDeposit ? parseFloat(r.securityDeposit) : undefined,
            brokerage: r.brokerage ? parseFloat(r.brokerage) : undefined,
            available_count: r.quantity ? parseInt(r.quantity) : 1,
            available_from: r.availableFrom || undefined,
            display_order: idx + 1,
            amenities: r.amenities || [],
          }));

        await api.post("/flats", {
          address: flatDetails.address,
          city: flatDetails.city,
          state: flatDetails.state,
          flat_type: flatDetails.flatType || undefined,
          furnishing_type: furnishingMap[flatDetails.flatFurnishing] || "unfurnished",
          description: flatDetails.description || undefined,
          is_published: true,
          ...(latitude  !== undefined && { latitude }),
          ...(longitude !== undefined && { longitude }),
          // Nested rooms + amenities
          rooms: rooms.length > 0 ? rooms : undefined,
          common_amenities: flatDetails.commonAmenities?.length > 0
            ? flatDetails.commonAmenities
            : undefined,
        });
      }

      // 6. Save search preferences (location + radius) for flat seekers
      if ((searchType === "flat" || searchType === "both") && housingDetails.searchLocation) {
        await api.put("/profile/search-preferences", {
          location_search: housingDetails.searchLocation,
          location_range_km: housingDetails.searchRadius ?? 5,
        });
      }

      setIsComplete(true);
      toast({
        title: "Profile Created Successfully! 🎉",
        description: "You can now start discovering potential flatmates.",
      });

      setTimeout(() => {
        onComplete?.();
      }, 2000);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Registration failed. Please try again.";
      toast({
        title: "Signup Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = (currentStep / 2) * 100;

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md mx-auto shadow-card animate-fade-in">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Welcome to Buddy!</h2>
              <p className="text-muted-foreground">
                Your profile has been created successfully. You can now start discovering compatible flatmates in your area.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">What's next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✨ Browse potential matches</li>
                <li>💬 Start conversations</li>
                <li>🏠 Find your perfect flatmate</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Join Buddy</h1>
          <p className="text-muted-foreground">Find your perfect flatmate in 2 simple steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Personal Info</span>
            <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Housing Details</span>
          </div>
          <Progress value={progressValue} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">
            Step {currentStep} of 2
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-card">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <PersonalInfoStep
                data={signupData.personalInfo}
                onUpdate={handlePersonalInfoUpdate}
                onNext={handleNext}
                onSwitchToLogin={onSwitchToLogin}
              />
            )}
            {currentStep === 2 && (
              <HousingDetailsStep
                data={signupData.housingDetails}
                onUpdate={handleHousingDetailsUpdate}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};