import { useState } from "react";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { HousingDetailsStep } from "./HousingDetailsStep";
import { CheckCircle, User, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

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
    dob: string;
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
      dob: "",
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

  /**
   * Upload an array of MediaFile objects to Cloudinary in parallel.
   * Returns an array of { media_url, media_type } ready for the API.
   */
  const uploadMediaFiles = async (
    files: MediaFile[],
    folder: string
  ): Promise<{ media_url: string; media_type: string }[]> => {
    if (!files || files.length === 0) return [];

    const results = await Promise.all(
      files.map(async (mf) => {
        const result = await uploadToCloudinary(mf.file, folder);
        return {
          media_url: result.secure_url,
          media_type: mf.type, // 'image' | 'video'
        };
      })
    );
    return results;
  };
  const handleSubmit = async () => {
    const { personalInfo, housingDetails } = signupData;
    setIsSubmitting(true);

    try {
      // ── Step 0: Upload ALL media in parallel ───────────────────────────
      // 0a. Profile picture
      let profilePictureUrl: string | undefined;
      if (personalInfo.profilePicture) {
        try {
          const uploadResult = await uploadToCloudinary(
            personalInfo.profilePicture,
            "swipe-buddy/profile-pictures"
          );
          profilePictureUrl = uploadResult.secure_url;
        } catch (uploadErr: any) {
          console.error("Profile picture upload failed:", uploadErr);
          toast({
            title: "Image Upload Failed",
            description: uploadErr?.message || "Could not upload profile picture. Continuing without it.",
            variant: "destructive",
          });
        }
      }

      const { flatDetails, searchType } = housingDetails;

      // 0b. Flat & Room Media (if owner)
      let commonMediaUploaded: { media_url: string; media_type: string }[] = [];
      let roomsData: any[] = [];

      if ((searchType === "flatmate" || searchType === "both") && flatDetails.address) {
        // Common area media
        if (flatDetails.commonMedia?.length > 0) {
          try {
            commonMediaUploaded = await uploadMediaFiles(
              flatDetails.commonMedia,
              "swipe-buddy/flats/common"
            );
          } catch (err: any) {
            console.error("Common area media upload failed:", err);
          }
        }

        // Room media (and prepare room records)
        roomsData = await Promise.all(
          flatDetails.rooms
            .filter(r => r.roomType)
            .map(async (r, idx) => {
              let roomMediaUploaded: { media_url: string; media_type: string }[] = [];
              if (r.media?.length > 0) {
                try {
                  roomMediaUploaded = await uploadMediaFiles(
                    r.media,
                    "swipe-buddy/flats/rooms"
                  );
                } catch (err: any) {
                  console.error(`Room ${idx + 1} media upload failed:`, err);
                }
              }

              return {
                room_name: r.roomName || undefined,
                room_type: r.roomType,
                rent: r.rent ? parseFloat(r.rent) : undefined,
                security_deposit: r.securityDeposit && !r.securityDeposit.startsWith('none|') ? parseInt(r.securityDeposit.replace('none|', '').split(' ')[0] || '0') : undefined,
                brokerage: r.brokerage && !r.brokerage.startsWith('none|') ? parseInt(r.brokerage.replace('none|', '').split(' ')[0] || '0') : undefined,
                available_count: r.quantity ? parseInt(r.quantity) : 1,
                available_from: r.availableFrom || undefined,
                display_order: idx + 1,
                room_amenities: r.amenities || [],
                media: roomMediaUploaded.length > 0 ? roomMediaUploaded : undefined,
              };
            })
        );
      }

      // Calculate age
      const dobDate = new Date(personalInfo.dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) age--;

      // ── Step 1: Prepare Flat Details ──────────────────────────────────
      let flat_details: any = undefined;
      if ((searchType === "flatmate" || searchType === "both") && flatDetails.address) {
        const furnishingMap: Record<string, string> = {
          "fully-furnished": "furnished",
          "semi-furnished": "semifurnished",
          "non-furnished": "unfurnished",
        };

        flat_details = {
          address: flatDetails.address,
          city: flatDetails.city,
          state: flatDetails.state,
          flat_type: flatDetails.flatType || undefined,
          furnishing_type: furnishingMap[flatDetails.flatFurnishing] || "unfurnished",
          description: flatDetails.description || undefined,
          is_published: true,
          latitude: flatDetails.coordinates?.[1],
          longitude: flatDetails.coordinates?.[0],
          rooms: roomsData.length > 0 ? roomsData : undefined,
          common_amenities: flatDetails.commonAmenities?.length > 0
            ? flatDetails.commonAmenities
            : undefined,
          media: commonMediaUploaded.length > 0 ? commonMediaUploaded : undefined,
        };
      }

      // ── Step 2: Unified Signup (Single Transaction on Backend) ───────
      await signup({
        name: personalInfo.name,
        email: personalInfo.email,
        password: personalInfo.password,
        phone: personalInfo.phone,
        age: age || 0,
        gender: personalInfo.gender,
        search_type: housingDetails.searchType,
        city: flatDetails.city || undefined,
        state: flatDetails.state || undefined,
        profile_picture_url: profilePictureUrl,
        flat_details,
      });

      // ── Step 3: Other Profile Updates (Jobs, Education, Prefs) ───────
      // Update verification flags (not in signup payload yet)
      await api.put("/profile", {
        phone_verified: personalInfo.phoneVerified,
        email_verified: personalInfo.emailVerified,
      });

      // Add jobs
      if (personalInfo.jobExperiences.length > 0) {
        const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        await Promise.all(
          personalInfo.jobExperiences
            .filter(j => j.company || j.position)
            .map((j, idx) =>
              api.post("/profile/jobs", {
                company_id: isUuid(j.company) ? j.company : undefined,
                company_name: isUuid(j.company) ? undefined : (j.company || undefined),
                position_id: isUuid(j.position) ? j.position : undefined,
                position_name: isUuid(j.position) ? undefined : (j.position || undefined),
                from_year: j.fromYear || undefined,
                till_year: j.currentlyWorking ? undefined : (j.tillYear || undefined),
                currently_working: j.currentlyWorking,
                display_order: idx + 1,
              })
            )
        );
      }

      // Add education
      if (personalInfo.educationExperiences.length > 0) {
        const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        await Promise.all(
          personalInfo.educationExperiences
            .filter(e => e.institution || e.degree)
            .map((e, idx) =>
              api.post("/profile/education", {
                institution_id: isUuid(e.institution) ? e.institution : undefined,
                institution_name: isUuid(e.institution) ? undefined : (e.institution || undefined),
                degree_id: isUuid(e.degree) ? e.degree : undefined,
                degree_name: isUuid(e.degree) ? undefined : (e.degree || undefined),
                start_year: e.startYear || undefined,
                end_year: e.endYear || undefined,
                display_order: idx + 1,
              })
            )
        );
      }

      // Search preferences
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

  const steps = [
    { num: 1, label: 'Personal Info', icon: User },
    { num: 2, label: 'Housing Details', icon: Home },
  ];

  if (isComplete) {
    return (
      <>
        <style>{signupStyles}</style>
        <div className="signup-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div className="signup-dot-pattern absolute inset-0" />
          <div className="signup-orb w-72 h-72 bg-rose-300/20 -top-24 -left-24" />
          <div className="signup-orb w-56 h-56 bg-pink-200/25 bottom-10 right-10" style={{ animationDelay: '3s' }} />

          <div className="signup-glass rounded-3xl p-10 max-w-md w-full text-center space-y-6 relative z-10 animate-fade-in">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-500/25">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <span className="absolute -top-2 -right-2 text-2xl animate-bounce">🎉</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Welcome to Buddy!</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your profile has been created successfully. You can now start discovering compatible flatmates in your area.
              </p>
            </div>
            <div className="signup-feature-card rounded-xl p-4 text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">What's next?</p>
              <ul className="space-y-2">
                {[
                  { emoji: '✨', text: 'Browse potential matches' },
                  { emoji: '💬', text: 'Start conversations' },
                  { emoji: '🏠', text: 'Find your perfect flatmate' },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <span className="text-base">{item.emoji}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{signupStyles}</style>
      <div className="signup-bg min-h-screen relative overflow-hidden">

        {/* Dot grid */}
        <div className="signup-dot-pattern absolute inset-0" />

        {/* Animated orbs */}
        <div className="signup-orb w-80 h-80 bg-rose-300/15 -top-32 -right-32" />
        <div className="signup-orb w-64 h-64 bg-pink-200/20 bottom-20 -left-24" style={{ animationDelay: '3s' }} />
        <div className="signup-orb w-48 h-48 bg-rose-400/10 top-1/2 right-10" style={{ animationDelay: '5s' }} />

        {/* Geometric shapes — visible but non-distracting */}
        {/* Top-right: nested rotating squares */}
        <div className="absolute top-[6%] right-[6%] w-24 h-24 border-2 border-rose-400/25 rounded-xl signup-spin-slow hidden lg:block" />
        <div className="absolute top-[8%] right-[8%] w-16 h-16 border-2 border-rose-300/20 rounded-lg signup-spin-slow hidden lg:block" style={{ animationDirection: 'reverse' }} />

        {/* Bottom-left: concentric pulsing rings */}
        <div className="absolute bottom-[12%] left-[4%] w-28 h-28 border-2 border-rose-400/20 rounded-full signup-pulse-ring hidden lg:block" />
        <div className="absolute bottom-[14%] left-[6%] w-20 h-20 border-2 border-rose-300/15 rounded-full signup-pulse-ring hidden lg:block" style={{ animationDelay: '1.5s' }} />

        {/* Top-left: rotating diamond */}
        <div className="absolute top-[18%] left-[6%] w-14 h-14 border-2 border-rose-400/20 rotate-45 signup-spin-slow hidden lg:block" style={{ animationDuration: '35s' }} />

        {/* Bottom-right: small rotating square */}
        <div className="absolute bottom-[20%] right-[7%] w-10 h-10 border-2 border-rose-300/25 rounded-md signup-spin-slow hidden lg:block" style={{ animationDirection: 'reverse', animationDuration: '20s' }} />

        {/* Floating dots — scattered around edges */}
        <div className="absolute top-[35%] right-[5%] w-3.5 h-3.5 bg-rose-400/30 rounded-full signup-drift hidden lg:block" />
        <div className="absolute top-[15%] left-[15%] w-3 h-3 bg-rose-500/20 rounded-full signup-drift hidden lg:block" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[25%] right-[15%] w-2.5 h-2.5 bg-rose-400/25 rounded-full signup-drift hidden lg:block" style={{ animationDelay: '4s' }} />
        <div className="absolute top-[55%] left-[4%] w-3 h-3 bg-pink-400/25 rounded-full signup-drift hidden lg:block" style={{ animationDelay: '6s' }} />
        <div className="absolute bottom-[8%] left-[35%] w-2 h-2 bg-rose-500/20 rounded-full signup-drift hidden lg:block" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[75%] right-[3%] w-2.5 h-2.5 bg-rose-300/30 rounded-full signup-drift hidden lg:block" style={{ animationDelay: '5s' }} />

        {/* Floating diamonds */}
        <div className="absolute top-[45%] right-[4%] signup-float-anim hidden lg:block">
          <div className="w-5 h-5 border-2 border-rose-400/25 rotate-45" />
        </div>
        <div className="absolute bottom-[40%] left-[3%] signup-float-anim hidden lg:block" style={{ animationDelay: '2s' }}>
          <div className="w-4 h-4 border-2 border-rose-300/20 rotate-45" />
        </div>
        <div className="absolute top-[10%] left-[40%] signup-float-anim hidden lg:block" style={{ animationDelay: '4s' }}>
          <div className="w-3 h-3 border border-rose-400/20 rotate-45" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">

          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <span className="text-4xl mb-3 block">🏡</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
              Join <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Buddy</span>
            </h1>
            <p className="text-gray-500 text-sm">Find your perfect flatmate in 2 simple steps</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-0 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                      currentStep >= step.num
                        ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 scale-100'
                        : 'bg-white/60 text-gray-400 border border-rose-100 scale-95'
                    }`}
                  >
                    {currentStep > step.num ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${currentStep >= step.num ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium transition-colors duration-300 ${
                    currentStep >= step.num ? 'text-rose-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-20 sm:w-32 h-1 mx-3 rounded-full bg-rose-100 overflow-hidden -mt-4">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: currentStep > step.num ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="signup-glass rounded-3xl p-6 sm:p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
          </div>

          {/* Footer trust badge */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span>🔒</span>
            <span>Your data is secure & encrypted</span>
          </div>
        </div>
      </div>
    </>
  );
};

/* ─── Shared Styles ─── */
const signupStyles = `
  @keyframes signup-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-14px); }
  }
  @keyframes signup-pulse-glow {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.75; }
  }
  @keyframes signup-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes signup-drift {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(12px, -8px); }
    50% { transform: translate(-4px, -16px); }
    75% { transform: translate(-12px, -6px); }
  }
  @keyframes signup-pulse-ring {
    0% { transform: scale(0.85); opacity: 0.4; }
    50% { transform: scale(1.1); opacity: 0.15; }
    100% { transform: scale(0.85); opacity: 0.4; }
  }
  .signup-bg {
    background: linear-gradient(160deg, #fff5f5 0%, #fef2f2 25%, #fce4ec 60%, #fbe9e7 100%);
  }
  .signup-dot-pattern {
    background-image: radial-gradient(rgba(225, 29, 72, 0.07) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .signup-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    animation: signup-pulse-glow 7s ease-in-out infinite;
    pointer-events: none;
  }
  .signup-glass {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 40px rgba(225, 29, 72, 0.06), 0 1px 3px rgba(0,0,0,0.03);
  }
  .signup-feature-card {
    background: rgba(225, 29, 72, 0.04);
    border: 1px solid rgba(225, 29, 72, 0.08);
  }
  .signup-spin-slow {
    animation: signup-spin 30s linear infinite;
  }
  .signup-pulse-ring {
    animation: signup-pulse-ring 5s ease-in-out infinite;
  }
  .signup-drift {
    animation: signup-drift 9s ease-in-out infinite;
  }
  .signup-float-anim {
    animation: signup-float 5s ease-in-out infinite;
  }
`;