
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, User, Users, Phone, PhoneOff, Mail, Calendar, CalendarArrowUp, CalendarArrowDown, UserCheck, GraduationCap, Plus, Trash2, Briefcase, BookOpen, Lock, Eye, EyeOff, ShieldCheck, KeyRound, ZoomIn, ZoomOut, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useCompanies, usePositions, useInstitutions, useDegrees } from "@/hooks/useMasterData";
import { BrandMultiSelect, BrandOption } from "@/components/ui/brand-multi-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

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

interface PersonalInfoData {
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
}

interface PersonalInfoStepProps {
  data: PersonalInfoData;
  onUpdate: (data: PersonalInfoData) => void;
  onNext: () => void;
  onOTPVerification?: (phone: string) => void;
  onSwitchToLogin?: () => void;
}

// OTP mode: "hardcoded" accepts 123456 locally, "service" uses backend APIs
const OTP_MODE = import.meta.env.VITE_OTP_MODE || "hardcoded";
const HARDCODED_OTP = "123456";

export const PersonalInfoStep = ({ data, onUpdate, onNext, onSwitchToLogin }: PersonalInfoStepProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneExistsDialogOpen, setPhoneExistsDialogOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState<"" | "phone" | "email">("");

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

  const { data: masterCompanies = [] } = useCompanies();
  const { data: masterInstitutions = [] } = useInstitutions();
  const { data: masterPositions = [] } = usePositions();
  const { data: masterDegrees = [] } = useDegrees();

  const [extraCompanies, setExtraCompanies] = useState<BrandOption[]>([]);
  const [extraSchools, setExtraSchools] = useState<BrandOption[]>([]);
  const [extraPositions, setExtraPositions] = useState<string[]>([]);
  const [extraDegrees, setExtraDegrees] = useState<string[]>([]);

  const companiesDb: BrandOption[] = [
    ...masterCompanies.map(c => ({ id: c.id, name: c.name, logo: c.logo_url ?? undefined })),
    ...extraCompanies,
  ];

  const schoolsDb: BrandOption[] = [
    ...masterInstitutions.map(i => ({ id: i.id, name: i.name, logo: i.logo_url ?? undefined })),
    ...extraSchools,
  ];

  const positionOptions: string[] = [
    ...masterPositions.map(p => p.full_name),
    ...extraPositions,
    "Other"
  ];

  const degreeOptions: string[] = [
    ...masterDegrees.map(d => d.common_name),
    ...extraDegrees,
    "Other"
  ];

  // Placeholder setters for compatibility
  const setCompaniesDb = () => { };
  const setSchoolsDb = () => { };
  const setPositionOptions = () => { };
  const setDegreeOptions = () => { };

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(data.password || '');
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword;

  // Generate years array (current year back to 50 years ago)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());
  // Generate future years array (current year to 10 years ahead)
  const futureYears = Array.from({ length: 11 }, (_, i) => (currentYear + i).toString());

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      pendingFileRef.current = file;
      const url = URL.createObjectURL(file);
      setRawImageUrl(url);
      setCropZoom(1);
      setCropOffset({ x: 0, y: 0 });
      setCropDialogOpen(true);
    }
    // Reset input so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleCropConfirm = useCallback(() => {
    if (!rawImageUrl || !cropImgRef.current) return;

    const img = cropImgRef.current;
    const canvas = document.createElement('canvas');
    const size = 400; // output size
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Fill with white background to avoid black bars
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Calculate crop area based on zoom and offset
    const containerSize = 280;
    const scale = Math.min(containerSize / img.naturalWidth, containerSize / img.naturalHeight) * cropZoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const drawX = (containerSize - drawW) / 2 + cropOffset.x;
    const drawY = (containerSize - drawH) / 2 + cropOffset.y;

    // The visible crop area in the container 
    const cropAreaSize = 220; // matches the highlight box
    const cropAreaLeft = (containerSize - cropAreaSize) / 2;
    const cropAreaTop = (containerSize - cropAreaSize) / 2;

    // Map crop area back to source image
    const srcX = (cropAreaLeft - drawX) / scale;
    const srcY = (cropAreaTop - drawY) / scale;
    const srcSize = cropAreaSize / scale;

    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], pendingFileRef.current?.name || 'profile.jpg', { type: 'image/jpeg' });
        onUpdate({ ...data, profilePicture: croppedFile });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
      setCropDialogOpen(false);
      setRawImageUrl(null);
    }, 'image/jpeg', 0.9);
  }, [rawImageUrl, cropZoom, cropOffset, data, onUpdate]);

  const handleRemoveProfilePicture = () => {
    onUpdate({ ...data, profilePicture: null });
    setPreviewUrl(null);
  };

  // Mouse/touch handlers for dragging in crop dialog
  const handleCropMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y });
  };

  const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleCropMouseUp = () => setIsDragging(false);

  const handleInputChange = (field: keyof PersonalInfoData, value: string | boolean) => {
    onUpdate({ ...data, [field]: value });
  };

  const addEducationExperience = () => {
    const newEducation: EducationExperience = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      startYear: "",
      endYear: ""
    };
    onUpdate({
      ...data,
      educationExperiences: [...data.educationExperiences, newEducation]
    });
  };

  const removeEducationExperience = (id: string) => {
    onUpdate({
      ...data,
      educationExperiences: data.educationExperiences.filter(edu => edu.id !== id)
    });
  };

  const updateEducationExperience = (id: string, field: keyof EducationExperience, value: string) => {
    const updatedEducations = data.educationExperiences.map(edu => {
      if (edu.id === id) {
        return { ...edu, [field]: value };
      }
      return edu;
    });

    onUpdate({
      ...data,
      educationExperiences: updatedEducations
    });
  };

  const addJobExperience = () => {
    const newExperience: JobExperience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      fromYear: "",
      tillYear: "",
      currentlyWorking: false
    };
    onUpdate({
      ...data,
      jobExperiences: [...data.jobExperiences, newExperience]
    });
  };

  const removeJobExperience = (id: string) => {
    onUpdate({
      ...data,
      jobExperiences: data.jobExperiences.filter(exp => exp.id !== id)
    });
  };

  const updateJobExperience = (id: string, field: keyof JobExperience, value: string | boolean) => {
    const updatedExperiences = data.jobExperiences.map(exp => {
      if (exp.id === id) {
        const updatedExp = { ...exp, [field]: value };

        // If currently working is checked, clear till year
        if (field === 'currentlyWorking' && value === true) {
          updatedExp.tillYear = "";
        }

        return updatedExp;
      }
      return exp;
    });

    onUpdate({
      ...data,
      jobExperiences: updatedExperiences
    });
  };

  // Helper functions to get filtered years for dropdowns
  const getFilteredFromYears = (experience: JobExperience) => {
    if (!experience.tillYear || experience.currentlyWorking) return years;
    return years.filter(year => parseInt(year) <= parseInt(experience.tillYear));
  };

  const getFilteredTillYears = (experience: JobExperience) => {
    if (experience.currentlyWorking) return futureYears;
    if (!experience.fromYear) {
      // Show years from 2000 to 10 years in the future when no input is given
      const maxYear = currentYear + 10;
      return Array.from({ length: maxYear - 2000 + 1 }, (_, i) => (2000 + i).toString());
    }
    const fromYear = parseInt(experience.fromYear);
    const maxYear = currentYear + 10;
    return Array.from({ length: maxYear - fromYear + 1 }, (_, i) => (fromYear + i).toString());
  };

  const getFilteredStartYears = (education: EducationExperience) => {
    if (!education.endYear) return years;
    return years.filter(year => parseInt(year) <= parseInt(education.endYear));
  };

  const getFilteredEndYears = (education: EducationExperience) => {
    if (!education.startYear) {
      // Show years from 2000 to 10 years in the future when no input is given
      const maxYear = currentYear + 10;
      return Array.from({ length: maxYear - 2000 + 1 }, (_, i) => (2000 + i).toString());
    }
    const startYear = parseInt(education.startYear);
    const maxYear = currentYear + 10;
    return Array.from({ length: maxYear - startYear + 1 }, (_, i) => (startYear + i).toString());
  };

  // OTP Dialog State
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpType, setOtpType] = useState<"phone" | "email">("phone");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const openOtpDialog = (type: "phone" | "email") => {
    setOtpType(type);
    setOtpValue("");
    setOtpError("");
    setOtpDialogOpen(true);
    setOtpCountdown(30);

    const target = type === "phone" ? `${countryCode} ${data.phone}` : data.email;
    toast({
      title: type === "phone" ? "OTP Sent! 📱" : "OTP Sent! 📧",
      description: `Verification code sent to ${target}`,
    });
  };

  const handleOtpVerify = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setOtpVerifying(true);
    setOtpError("");

    try {
      if (OTP_MODE === "hardcoded") {
        // ── Hardcoded mode: verify against 123456 locally ──
        if (otpValue === HARDCODED_OTP) {
          if (otpType === "phone") {
            handleInputChange('phoneVerified', true);
            toast({ title: "Phone Verified! ✅", description: "Your phone number has been verified successfully." });
          } else {
            handleInputChange('emailVerified', true);
            toast({ title: "Email Verified! ✅", description: "Your email has been verified successfully." });
          }
          setOtpDialogOpen(false);
        } else {
          setOtpError("Invalid OTP. Please try again.");
        }
      } else {
        // ── Service mode: verify via backend APIs ──
        if (otpType === "phone") {
          const res = await api.post("/auth/verify-otp", {
            phone: data.phone,
            otp: otpValue,
          });

          if (res.data?.success || res.data?.data?.verified) {
            handleInputChange('phoneVerified', true);
            toast({ title: "Phone Verified! ✅", description: "Your phone number has been verified successfully." });
            setOtpDialogOpen(false);
          } else {
            setOtpError(res.data?.message || "Invalid OTP. Please try again.");
          }
        } else {
          const res = await api.post("/auth/verify-email-otp", {
            email: data.email,
            otp: otpValue,
          });

          if (res.data?.success || res.data?.data?.verified) {
            handleInputChange('emailVerified', true);
            toast({ title: "Email Verified! ✅", description: "Your email has been verified successfully." });
            setOtpDialogOpen(false);
          } else {
            setOtpError(res.data?.message || "Invalid OTP. Please try again.");
          }
        }
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.friendlyMessage ||
        "Verification failed. Please try again.";
      setOtpError(message);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setOtpValue("");
    setOtpError("");

    if (OTP_MODE === "hardcoded") {
      // In hardcoded mode, just reset the countdown (no backend call)
      setOtpCountdown(30);
      toast({
        title: "OTP Resent! 🔄",
        description: `Use code ${HARDCODED_OTP} to verify (dev mode)`,
      });
      return;
    }

    try {
      if (otpType === "phone") {
        await api.post("/auth/send-otp", { phone: data.phone });
      } else {
        await api.post("/auth/check-email", { email: data.email });
      }
      setOtpCountdown(30);
      toast({
        title: "OTP Resent! 🔄",
        description: `New verification code sent to ${otpType === "phone" ? `${countryCode} ${data.phone}` : data.email}`,
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.friendlyMessage ||
        "Failed to resend OTP. Please try again.";
      toast({
        title: "Resend Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyPhone = async () => {
    if (!data.phone || data.phone.length !== 10) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    if (OTP_MODE === "hardcoded") {
      // Skip backend phone-check in hardcoded mode, go straight to OTP dialog
      openOtpDialog("phone");
      return;
    }

    setVerifyLoading("phone");

    try {
      const res = await api.post("/auth/check-phone", { phone: data.phone });
      setVerifyLoading("");
      if (res.data?.data?.exists) {
        setPhoneExistsDialogOpen(true);
        return;
      }
    } catch (error: any) {
      setVerifyLoading("");
      console.warn("Phone check failed, proceeding with verification:", error);
    }

    openOtpDialog("phone");
  };

  const handleVerifyEmail = async () => {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (OTP_MODE === "hardcoded") {
      // Skip backend email-check in hardcoded mode, go straight to OTP dialog
      openOtpDialog("email");
      return;
    }

    setVerifyLoading("email");

    try {
      const res = await api.post("/auth/check-email", { email: data.email });

      if (res.data?.data?.exists) {
        toast({
          title: "Email Already Registered",
          description: "This email is already linked to an account. Please use a different email or log in.",
          variant: "destructive",
        });
        setVerifyLoading("");
        return;
      }

      setVerifyLoading("");
      openOtpDialog("email");
    } catch (err: any) {
      setVerifyLoading("");
      const message =
        err?.response?.data?.message ||
        err?.friendlyMessage ||
        "Failed to send verification email. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isPasswordValid = Boolean(
    data.password &&
    data.password.length >= 8 &&
    data.password === data.confirmPassword
  );
  // Check all job experiences have required fields filled
  const areJobExperiencesValid = data.jobExperiences.length === 0 || data.jobExperiences.every(exp =>
    exp.company && exp.position && exp.fromYear && (exp.currentlyWorking || exp.tillYear)
  );
  // Check all education experiences have required fields filled
  const areEducationExperiencesValid = data.educationExperiences.length === 0 || data.educationExperiences.every(edu =>
    edu.institution && edu.degree && edu.startYear && edu.endYear
  );
  const isDobComplete = /^\d{4}-\d{2}-\d{2}$/.test(data.dob);
  const isValid = Boolean(data.name && isDobComplete && data.gender && data.phone && data.phone.length === 10 && data.phoneVerified && isPasswordValid && areJobExperiencesValid && areEducationExperiencesValid);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
        <p className="text-muted-foreground">Let's start with the basics to create your profile</p>
      </div>

      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div
            className={`w-36 h-36 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-accent/30 shadow-md ${previewUrl ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            onClick={() => {
              if (previewUrl) {
                setRawImageUrl(previewUrl);
                setCropZoom(1);
                setCropOffset({ x: 0, y: 0 });
                setCropDialogOpen(true);
              }
            }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <label htmlFor="profile-picture" className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4 text-primary-foreground" />
          </label>
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemoveProfilePicture}
              className="absolute -top-2 -right-2 bg-destructive rounded-full p-1.5 cursor-pointer hover:bg-destructive/90 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
          <input
            id="profile-picture"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <p className="text-sm text-muted-foreground">Upload your profile picture</p>
      </div>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open) { setCropDialogOpen(false); setRawImageUrl(null); } }}>
        <DialogContent className="max-w-[380px] mx-auto p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-center">Crop Profile Picture</DialogTitle>
            <DialogDescription className="text-center text-sm">Drag to reposition, zoom to adjust</DialogDescription>
          </DialogHeader>

          {/* Crop area */}
          <div className="px-4">
            <div
              ref={cropContainerRef}
              className="relative w-[280px] h-[280px] mx-auto overflow-hidden rounded-xl bg-white cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                setCropZoom(z => Math.min(3, Math.max(0.5, z + delta)));
              }}
            >
              {/* Image */}
              {rawImageUrl && (
                <img
                  ref={(el) => { cropImgRef.current = el; }}
                  src={rawImageUrl}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${cropOffset.x}px), calc(-50% + ${cropOffset.y}px)) scale(${cropZoom})`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              )}

              {/* Dark overlay with square cutout */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top */}
                <div className="absolute top-0 left-0 right-0 bg-white/60" style={{ height: '30px' }} />
                {/* Bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/60" style={{ height: '30px' }} />
                {/* Left */}
                <div className="absolute left-0 bg-white/60" style={{ top: '30px', bottom: '30px', width: '30px' }} />
                {/* Right */}
                <div className="absolute right-0 bg-white/60" style={{ top: '30px', bottom: '30px', width: '30px' }} />
                {/* Highlight border */}
                <div
                  className="absolute border-2 border-gray-400 rounded-2xl"
                  style={{
                    top: '30px',
                    left: '30px',
                    right: '30px',
                    bottom: '30px',
                  }}
                />
                {/* Corner markers */}
                <div className="absolute w-4 h-4 border-t-2 border-l-2 border-gray-500 rounded-tl-lg" style={{ top: '28px', left: '28px' }} />
                <div className="absolute w-4 h-4 border-t-2 border-r-2 border-gray-500 rounded-tr-lg" style={{ top: '28px', right: '28px' }} />
                <div className="absolute w-4 h-4 border-b-2 border-l-2 border-gray-500 rounded-bl-lg" style={{ left: '28px', bottom: '28px' }} />
                <div className="absolute w-4 h-4 border-b-2 border-r-2 border-gray-500 rounded-br-lg" style={{ right: '28px', bottom: '28px' }} />
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-3 px-4 py-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setCropZoom(z => Math.max(0.5, z - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={cropZoom}
              onChange={(e) => setCropZoom(parseFloat(e.target.value))}
              className="w-40 accent-primary"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setCropZoom(z => Math.min(3, z + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(cropZoom * 100)}%</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-4 pb-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setCropDialogOpen(false); setRawImageUrl(null); }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCropConfirm}
            >
              Set as Profile Picture
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={data.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dob" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            {(() => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [dobView, setDobView] = useState<'year' | 'month' | 'day'>('day');
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const [dobNavMonth, setDobNavMonth] = useState<Date>(
                data.dob ? new Date(data.dob) : new Date(new Date().getFullYear() - 25, 0)
              );

              const currentYear = new Date().getFullYear();
              const startYear = 1945;
              const allYears = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !data.dob ? 'text-muted-foreground' : ''
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {data.dob
                        ? format(new Date(data.dob), 'PPP')
                        : 'Select your date of birth'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {dobView === 'year' && (
                      <div className="p-3 w-[280px]">
                        <div className="text-center font-semibold text-sm mb-3">Select Year</div>
                        <div className="grid grid-cols-4 gap-1.5 max-h-[240px] overflow-y-auto">
                          {allYears.map(y => (
                            <button
                              key={y}
                              onClick={() => {
                                setDobNavMonth(new Date(y, dobNavMonth.getMonth()));
                                setDobView('month');
                              }}
                              className={`text-sm py-1.5 rounded-md transition-colors hover:bg-primary hover:text-primary-foreground ${
                                dobNavMonth.getFullYear() === y
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'hover:bg-accent'
                              }`}
                            >
                              {y}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {dobView === 'month' && (
                      <div className="p-3 w-[280px]">
                        <button
                          onClick={() => setDobView('year')}
                          className="w-full text-center font-semibold text-sm mb-3 hover:text-primary transition-colors cursor-pointer"
                        >
                          {dobNavMonth.getFullYear()} ▾
                        </button>
                        <div className="grid grid-cols-3 gap-2">
                          {monthNames.map((name, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setDobNavMonth(new Date(dobNavMonth.getFullYear(), idx));
                                setDobView('day');
                              }}
                              className={`text-sm py-2.5 rounded-md transition-colors hover:bg-primary hover:text-primary-foreground ${
                                dobNavMonth.getMonth() === idx
                                  ? 'bg-primary text-primary-foreground font-medium'
                                  : 'hover:bg-accent'
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {dobView === 'day' && (
                      <CalendarComponent
                        mode="single"
                        month={dobNavMonth}
                        onMonthChange={setDobNavMonth}
                        selected={data.dob ? new Date(data.dob) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            handleInputChange('dob', `${y}-${m}-${d}`);
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date('1920-01-01')}
                        initialFocus
                        className="rounded-md border"
                        classNames={{
                          caption_label: 'text-sm font-medium cursor-pointer hover:text-primary hover:underline transition-colors',
                        }}
                        onDayClick={() => {}}
                        formatters={{
                          formatCaption: (date) => {
                            return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                          },
                        }}
                        components={{
                          CaptionLabel: ({ displayMonth }: { displayMonth: Date }) => (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setDobView('year');
                              }}
                              className="text-sm font-medium cursor-pointer hover:text-primary hover:underline underline-offset-2 transition-colors flex items-center gap-1"
                            >
                              {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()} ▾
                            </button>
                          ),
                        }}
                      />
                    )}
                  </PopoverContent>
                </Popover>
              );
            })()}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Gender <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={data.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Select
              value={countryCode}
              onValueChange={setCountryCode}
            >
              <SelectTrigger className="w-[100px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 max-h-60 overflow-y-auto z-50 shadow-lg rounded-lg">
                {[
                  { code: "+1", flag: "🇺🇸", country: "USA" },
                  { code: "+33", flag: "🇫🇷", country: "France" },
                  { code: "+44", flag: "🇬🇧", country: "UK" },
                  { code: "+49", flag: "🇩🇪", country: "Germany" },
                  { code: "+61", flag: "🇦🇺", country: "Australia" },
                  { code: "+65", flag: "🇸🇬", country: "Singapore" },
                  { code: "+81", flag: "🇯🇵", country: "Japan" },
                  { code: "+82", flag: "🇰🇷", country: "S. Korea" },
                  { code: "+86", flag: "🇨🇳", country: "China" },
                  { code: "+91", flag: "🇮🇳", country: "India" },
                  { code: "+92", flag: "🇵🇰", country: "Pakistan" },
                  { code: "+94", flag: "🇱🇰", country: "Sri Lanka" },
                  { code: "+880", flag: "🇧🇩", country: "Bangladesh" },
                  { code: "+966", flag: "🇸🇦", country: "Saudi Arabia" },
                  { code: "+971", flag: "🇦🇪", country: "UAE" },
                  { code: "+977", flag: "🇳🇵", country: "Nepal" },
                ].map(({ code, flag, country }) => (
                  <SelectItem
                    key={code}
                    value={code}
                    className="cursor-pointer hover:bg-accent/50 focus:bg-accent/70 transition-colors duration-200 rounded-sm mx-1"
                  >
                    {flag} {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter 10-digit number"
              value={data.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleInputChange('phone', value);
                if (data.phoneVerified && value !== data.phone) {
                  handleInputChange('phoneVerified', false);
                }
              }}
              maxLength={10}
              className="flex-1"
            />
            <Button
              onClick={handleVerifyPhone}
              disabled={!data.phone || data.phone.length !== 10 || data.phoneVerified}
              variant={data.phoneVerified ? "default" : "outline"}
              className="whitespace-nowrap"
            >
              {data.phoneVerified ? "✅ Verified" : "Verify"}
            </Button>
          </div>
          {data.phoneVerified && (
            <p className="text-sm text-green-600">Phone number verified successfully!</p>
          )}
        </div>

        {/* Password Section — appears after phone is verified */}
        {data.phoneVerified && (
          <div className="space-y-4 p-4 border rounded-lg bg-accent/20 animate-fade-in">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Set Your Password
            </h3>
            <p className="text-sm text-muted-foreground">
              Create a secure password for your account
            </p>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={data.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {data.password && (
                <div className="space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-muted'
                          }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength <= 1 ? 'text-red-500' :
                    passwordStrength === 2 ? 'text-orange-500' :
                      passwordStrength === 3 ? 'text-yellow-600' :
                        'text-green-600'
                    }`}>
                    {strengthLabels[passwordStrength]}
                  </p>
                </div>
              )}

              {/* Requirements checklist */}
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li className={data.password && data.password.length >= 8 ? 'text-green-600' : ''}>
                  {data.password && data.password.length >= 8 ? '✓' : '○'} At least 8 characters
                </li>
                <li className={data.password && /[A-Z]/.test(data.password) ? 'text-green-600' : ''}>
                  {data.password && /[A-Z]/.test(data.password) ? '✓' : '○'} One uppercase letter
                </li>
                <li className={data.password && /[0-9]/.test(data.password) ? 'text-green-600' : ''}>
                  {data.password && /[0-9]/.test(data.password) ? '✓' : '○'} One number
                </li>
                <li className={data.password && /[^A-Za-z0-9]/.test(data.password) ? 'text-green-600' : ''}>
                  {data.password && /[^A-Za-z0-9]/.test(data.password) ? '✓' : '○'} One special character
                </li>
              </ul>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={data.confirmPassword || ''}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {data.confirmPassword && (
                <p className={`text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              placeholder="Ex: your.email@example.com"
              value={data.email}
              onChange={(e) => {
                handleInputChange('email', e.target.value);
                if (data.emailVerified && e.target.value !== data.email) {
                  handleInputChange('emailVerified', false);
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleVerifyEmail}
              disabled={!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.emailVerified}
              variant={data.emailVerified ? "default" : "outline"}
              className="whitespace-nowrap"
              type="button"
            >
              {data.emailVerified ? "✅ Verified" : "Verify"}
            </Button>
          </div>
          {data.emailVerified && (
            <p className="text-sm text-green-600">Email verified successfully!</p>
          )}
        </div>

        {/* Job Experience Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </h3>
            <Button
              type="button"
              onClick={addJobExperience}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Experience
            </Button>
          </div>

          {data.jobExperiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No work experience added yet</p>
              <p className="text-sm">Click "Add Experience" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.jobExperiences.map((experience, index) => (
                <div key={experience.id} className="border rounded-lg p-4 space-y-3 bg-accent/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Experience #{index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => removeJobExperience(experience.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <BrandMultiSelect
                        label={<>Company <span className="text-red-500">*</span></>}
                        dialogLabel="Company"
                        icon={<Briefcase className="w-4 h-4" />}
                        placeholder="Search companies..."
                        options={companiesDb}
                        selectedValues={experience.company ? [experience.company] : []}
                        mode="single"
                        onSelectedValuesChange={(vals) => {
                          const val = vals.length > 0 ? vals[0] : "";
                          updateJobExperience(experience.id, 'company', val);
                        }}
                        onAddNewBrand={async (brand) => {
                          try {
                            let logoUrl = brand.logo;
                            if (brand.logoFile) {
                              const res = await uploadToCloudinary(brand.logoFile, "swipe-buddy/master/companies");
                              logoUrl = res.secure_url;
                            }

                            const apiRes = await api.post("/master/companies", {
                              name: brand.name,
                              logo_url: logoUrl,
                              aliases: brand.aliases
                            });

                            const newBrand = {
                              id: apiRes.data.data.id || brand.name,
                              name: brand.name,
                              logo: logoUrl,
                              aliases: brand.aliases
                            };

                            setExtraCompanies((prev) => [...prev, newBrand]);
                            updateJobExperience(experience.id, 'company', newBrand.name);
                            toast({ title: "Submitted for verification!", description: "Entry submitted. It will appear once approved, but you can use it now." });
                          } catch (err: any) {
                            toast({ title: "Submission Failed", description: err.message || "Failed to add company", variant: "destructive" });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`position-${experience.id}`} className="flex items-center gap-2 h-5">
                        <UserCheck className="w-4 h-4" />
                        Position <span className="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        value={positionOptions.includes(experience.position) && experience.position !== "Other" ? experience.position : ""}
                        onValueChange={(val) => {
                          if (val !== "Other") {
                            updateJobExperience(experience.id, 'position', val);
                          } else {
                            setActiveJobIdForPosition(experience.id);
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`from-year-${experience.id}`} className="flex items-center gap-2">
                        <CalendarArrowUp className="w-4 h-4" />
                        From Year <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={experience.fromYear}
                        onValueChange={(value) => updateJobExperience(experience.id, 'fromYear', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 max-h-60 overflow-y-auto z-50 shadow-lg rounded-lg">
                          {getFilteredFromYears(experience).map((year) => (
                            <SelectItem
                              key={year}
                              value={year}
                              className="cursor-pointer hover:bg-accent/50 focus:bg-accent/70 transition-colors duration-200 rounded-sm mx-1"
                            >
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`till-year-${experience.id}`} className="flex items-center gap-2">
                        <CalendarArrowDown className="w-4 h-4" />
                        Till Year {!experience.currentlyWorking && <span className="text-red-500">*</span>}
                      </Label>
                      {experience.currentlyWorking ? (
                        <div className="h-10 px-3 py-2 bg-muted border border-border rounded-md flex items-center text-muted-foreground">
                          Currently Working
                        </div>
                      ) : (
                        <Select
                          value={experience.tillYear}
                          onValueChange={(value) => updateJobExperience(experience.id, 'tillYear', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 max-h-60 overflow-y-auto z-50 shadow-lg rounded-lg">
                            {getFilteredTillYears(experience).map((year) => (
                              <SelectItem
                                key={year}
                                value={year}
                                className="cursor-pointer hover:bg-accent/50 focus:bg-accent/70 transition-colors duration-200 rounded-sm mx-1"
                              >
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`currently-working-${experience.id}`}
                      checked={experience.currentlyWorking}
                      onCheckedChange={(checked) => updateJobExperience(experience.id, 'currentlyWorking', checked)}
                    />
                    <Label htmlFor={`currently-working-${experience.id}`} className="text-sm">
                      Currently working here
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Education Details
            </h3>
            <Button
              type="button"
              onClick={addEducationExperience}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Education
            </Button>
          </div>

          {data.educationExperiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No education qualifications added yet</p>
              <p className="text-sm">Click "Add Education" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.educationExperiences.map((education, index) => (
                <div key={education.id} className="border rounded-lg p-4 space-y-3 bg-accent/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Education #{index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => removeEducationExperience(education.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <BrandMultiSelect
                        label={<>Institution <span className="text-red-500">*</span></>}
                        icon={<BookOpen className="w-4 h-4" />}
                        placeholder="Search schools..."
                        options={schoolsDb}
                        selectedValues={education.institution ? [education.institution] : []}
                        mode="single"
                        onSelectedValuesChange={(vals) => {
                          const val = vals.length > 0 ? vals[0] : "";
                          updateEducationExperience(education.id, 'institution', val);
                        }}
                        onAddNewBrand={async (brand) => {
                          try {
                            let logoUrl = brand.logo;
                            if (brand.logoFile) {
                              const res = await uploadToCloudinary(brand.logoFile, "swipe-buddy/master/institutions");
                              logoUrl = res.secure_url;
                            }

                            const apiRes = await api.post("/master/institutions", {
                              name: brand.name,
                              logo_url: logoUrl,
                              aliases: brand.aliases
                            });

                            const newBrand = {
                              id: apiRes.data.data.id || brand.name,
                              name: brand.name,
                              logo: logoUrl,
                              aliases: brand.aliases
                            };

                            setExtraSchools((prev) => [...prev, newBrand]);
                            updateEducationExperience(education.id, 'institution', newBrand.name);
                            toast({ title: "Submitted for verification!", description: "Entry submitted. It will appear once approved, but you can use it now." });
                          } catch (err: any) {
                            toast({ title: "Submission Failed", description: err.message || "Failed to add institution", variant: "destructive" });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`degree-${education.id}`} className="flex items-center gap-2 h-5">
                        <GraduationCap className="w-4 h-4" />
                        Degree <span className="text-red-500">*</span>
                      </Label>
                      <SearchableSelect
                        value={degreeOptions.includes(education.degree) && education.degree !== "Other" ? education.degree : ""}
                        onValueChange={(val) => {
                          if (val !== "Other") {
                            updateEducationExperience(education.id, 'degree', val);
                          } else {
                            setActiveEducationId(education.id);
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`start-year-${education.id}`} className="flex items-center gap-2">
                        <CalendarArrowUp className="w-4 h-4" />
                        Start Year <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={education.startYear}
                        onValueChange={(value) => updateEducationExperience(education.id, 'startYear', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 max-h-60 overflow-y-auto z-50 shadow-lg rounded-lg">
                          {getFilteredStartYears(education).map((year) => (
                            <SelectItem
                              key={year}
                              value={year}
                              className="cursor-pointer hover:bg-accent/50 focus:bg-accent/70 transition-colors duration-200 rounded-sm mx-1"
                            >
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-year-${education.id}`} className="flex items-center gap-2">
                        <CalendarArrowDown className="w-4 h-4" />
                        End Year <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={education.endYear}
                        onValueChange={(value) => updateEducationExperience(education.id, 'endYear', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 max-h-60 overflow-y-auto z-50 shadow-lg rounded-lg">
                          {getFilteredEndYears(education).map((year) => (
                            <SelectItem
                              key={year}
                              value={year}
                              className="cursor-pointer hover:bg-accent/50 focus:bg-accent/70 transition-colors duration-200 rounded-sm mx-1"
                            >
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{newDegreeFullName.length}/50</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degreeCommonName">Most commonly known as <span className="text-red-500">*</span></Label>
              <Input
                id="degreeCommonName"
                placeholder="e.g. B.Tech"
                value={newDegreeCommonName}
                onChange={(e) => setNewDegreeCommonName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{newDegreeCommonName.length}/50</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="degreeOtherNames">Other common names</Label>
              <Input
                id="degreeOtherNames"
                placeholder="e.g. BTech, B.E."
                value={newDegreeOtherNames}
                onChange={(e) => setNewDegreeOtherNames(e.target.value)}
                maxLength={250}
              />
              <p className="text-xs text-muted-foreground text-right">{newDegreeOtherNames.length}/250</p>
            </div>
            <Button
              className="mt-2 w-full"
              disabled={!newDegreeFullName.trim() || !newDegreeCommonName.trim()}
              onClick={async () => {
                if (!newDegreeCommonName.trim() || !activeEducationId) return;

                try {
                  const res = await api.post("/master/degrees", {
                    full_name: newDegreeFullName,
                    common_name: newDegreeCommonName,
                    other_names: newDegreeOtherNames
                  });

                  // Add to extra degrees
                  setExtraDegrees(prev => [...prev, newDegreeCommonName]);

                  // Auto-select the newly added degree
                  updateEducationExperience(activeEducationId, 'degree', newDegreeCommonName);

                  toast({
                    title: "Entry submitted for verification!",
                    description: "It will appear in the dropdown once approved."
                  });
                  setNewDegreeFullName("");
                  setNewDegreeCommonName("");
                  setNewDegreeOtherNames("");
                  setShowAddDegreeDialog(false);
                  setActiveEducationId(null);
                } catch (err: any) {
                  toast({ title: "Submission Failed", description: err.message || "Failed to add degree", variant: "destructive" });
                }
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
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{newPositionFullName.length}/50</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="positionCommonName">Most commonly known as <span className="text-red-500">*</span></Label>
              <Input
                id="positionCommonName"
                placeholder="e.g. SDE"
                value={newPositionCommonName}
                onChange={(e) => setNewPositionCommonName(e.target.value)}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{newPositionCommonName.length}/50</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="positionOtherNames">Other common names</Label>
              <Input
                id="positionOtherNames"
                placeholder="e.g. Developer, Dev"
                value={newPositionOtherNames}
                onChange={(e) => setNewPositionOtherNames(e.target.value)}
                maxLength={250}
              />
              <p className="text-xs text-muted-foreground text-right">{newPositionOtherNames.length}/250</p>
            </div>
            <Button
              className="mt-2 w-full"
              disabled={!newPositionFullName.trim() || !newPositionCommonName.trim()}
              onClick={async () => {
                if (!newPositionFullName.trim() || !activeJobIdForPosition) return;

                try {
                  const res = await api.post("/master/positions", {
                    full_name: newPositionFullName,
                    common_name: newPositionCommonName,
                    other_names: newPositionOtherNames
                  });

                  setExtraPositions(prev => [...prev, newPositionFullName]);

                  updateJobExperience(activeJobIdForPosition, 'position', newPositionFullName);

                  toast({
                    title: "Entry submitted for verification!",
                    description: "It will appear in the dropdown once approved."
                  });
                  setNewPositionFullName("");
                  setNewPositionCommonName("");
                  setNewPositionOtherNames("");
                  setShowAddPositionDialog(false);
                  setActiveJobIdForPosition(null);
                } catch (err: any) {
                  toast({ title: "Submission Failed", description: err.message || "Failed to add position", variant: "destructive" });
                }
              }}
            >
              Add to DB
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Already Registered Dialog */}
      <Dialog open={phoneExistsDialogOpen} onOpenChange={setPhoneExistsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="text-center space-y-2 sm:space-y-3">
            <div className="flex justify-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-center">
              Number Already Registered
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground text-center">
              🔐 An account with <span className="font-semibold text-foreground">{countryCode} {data.phone}</span> already exists.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="gradient"
              className="w-full h-11"
              onClick={() => {
                setPhoneExistsDialogOpen(false);
                onSwitchToLogin?.();
              }}
            >
              Sign In Instead
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 flex items-center justify-center gap-2"
              onClick={() => {
                setPhoneExistsDialogOpen(false);
                // TODO: Navigate to forgot password when implemented
                onSwitchToLogin?.();
              }}
            >
              <KeyRound className="w-4 h-4" />
              Forgot Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verify Loading Dialog */}
      <Dialog open={!!verifyLoading} onOpenChange={() => { }}>
        <DialogContent className="max-w-[320px] mx-auto p-6 flex flex-col items-center gap-4" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              {verifyLoading === "phone" ? <Phone className="w-6 h-6 text-primary animate-pulse" /> : <Mail className="w-6 h-6 text-primary animate-pulse" />}
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">
              Verifying your {verifyLoading === "phone" ? "phone number" : "email address"}...
            </p>
            <p className="text-sm text-muted-foreground">Please wait while we check your details</p>
          </div>
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={(open) => {
        if (!otpVerifying) setOtpDialogOpen(open);
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-4 sm:p-6">
          <DialogHeader className="text-center space-y-2 sm:space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
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
            {/* OTP Input */}
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={(value) => {
                setOtpValue(value);
                setOtpError("");
              }}
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

            {/* Error Message */}
            {otpError && (
              <p className="text-xs sm:text-sm text-red-500 text-center px-2">{otpError}</p>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleOtpVerify}
              disabled={otpValue.length !== 6 || otpVerifying}
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              variant="gradient"
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

            {/* Resend Section */}
            <div className="text-center text-xs sm:text-sm text-muted-foreground">
              {otpCountdown > 0 ? (
                <p>
                  Resend code in{" "}
                  <span className="font-semibold text-foreground">
                    {otpCountdown}s
                  </span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-primary font-semibold hover:underline transition-colors"
                  type="button"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full h-12 text-base"
        variant="gradient"
      >
        Continue to Housing Details
      </Button>
    </div>
  );
};
