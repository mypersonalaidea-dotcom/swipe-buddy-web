import { useState } from "react";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { HousingDetailsStep } from "./HousingDetailsStep";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    jobExperiences: JobExperience[];
    educationExperiences: EducationExperience[];
  };
  housingDetails: {
    searchType: "flat" | "flatmate" | "both";
    propertyMoveInDate?: string;
    flatDetails: {
      address: string;
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
}

export const SignupFlow = ({ onComplete }: SignupFlowProps = {}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

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
      jobExperiences: [],
      educationExperiences: []
    },
    housingDetails: {
      searchType: "flat",
      propertyMoveInDate: new Date().toISOString().split('T')[0],
      flatDetails: {
        address: "",
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

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log("Signup completed with data:", signupData);
    setIsComplete(true);
    toast({
      title: "Profile Created Successfully! 🎉",
      description: "You can now start discovering potential flatmates.",
    });

    // Call onComplete callback if provided
    setTimeout(() => {
      onComplete?.();
    }, 2000);
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
              />
            )}
            {currentStep === 2 && (
              <HousingDetailsStep
                data={signupData.housingDetails}
                onUpdate={handleHousingDetailsUpdate}
                onSubmit={handleSubmit}
                onBack={handleBack}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};