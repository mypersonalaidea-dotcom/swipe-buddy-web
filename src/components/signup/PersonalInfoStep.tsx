
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, User, Phone, Plus, Trash2, Briefcase, BookOpen, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrandMultiSelect, BrandOption } from "@/components/ui/brand-multi-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

interface PersonalInfoStepProps {
  data: PersonalInfoData;
  onUpdate: (data: PersonalInfoData) => void;
  onNext: () => void;
  onOTPVerification?: (phone: string) => void;
}

export const PersonalInfoStep = ({ data, onUpdate, onNext }: PersonalInfoStepProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdate({ ...data, profilePicture: file });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

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

  const handleVerifyPhone = () => {
    if (!data.phone || data.phone.length !== 10) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    // Mock sending OTP
    toast({
      title: "OTP Sent! 📱",
      description: `Verification code sent to ${data.phone}. Demo OTP: 123456`,
    });

    // For demo, automatically mark as verified after 2 seconds
    setTimeout(() => {
      handleInputChange('phoneVerified', true);
      toast({
        title: "Phone Verified! ✅",
        description: "Your phone number has been verified successfully.",
      });
    }, 2000);
  };

  const isPasswordValid = Boolean(
    data.password &&
    data.password.length >= 8 &&
    data.password === data.confirmPassword
  );
  const isValid = Boolean(data.name && data.age && data.gender && data.phone && data.phone.length === 10 && data.phoneVerified && isPasswordValid);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
        <p className="text-muted-foreground">Let's start with the basics to create your profile</p>
      </div>

      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-accent/30">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <label htmlFor="profile-picture" className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4 text-primary-foreground" />
          </label>
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

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={data.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={data.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Gender <span className="text-red-500">*</span></Label>
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
          <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
          <div className="flex gap-2">
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
          <Label htmlFor="email">Email Address (Optional)</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={data.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
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
                        label="Company"
                        icon={<Briefcase className="w-4 h-4" />}
                        placeholder="Search companies..."
                        options={companiesDb}
                        selectedValues={experience.company ? [experience.company] : []}
                        mode="single"
                        onSelectedValuesChange={(vals) => {
                          const val = vals.length > 0 ? vals[0] : "";
                          updateJobExperience(experience.id, 'company', val);
                        }}
                        onAddNewBrand={(brand) => {
                          const newBrand = { ...brand, id: brand.name };
                          setCompaniesDb((prev) => [...prev, newBrand]);
                          updateJobExperience(experience.id, 'company', newBrand.id);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`position-${experience.id}`} className="flex items-center h-5">Position</Label>
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
                      <Label htmlFor={`from-year-${experience.id}`}>From Year</Label>
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
                      <Label htmlFor={`till-year-${experience.id}`}>Till Year</Label>
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
                        label="School / College / University"
                        icon={<BookOpen className="w-4 h-4" />}
                        placeholder="Search schools..."
                        options={schoolsDb}
                        selectedValues={education.institution ? [education.institution] : []}
                        mode="single"
                        onSelectedValuesChange={(vals) => {
                          const val = vals.length > 0 ? vals[0] : "";
                          updateEducationExperience(education.id, 'institution', val);
                        }}
                        onAddNewBrand={(brand) => {
                          const newBrand = { ...brand, id: brand.name };
                          setSchoolsDb((prev) => [...prev, newBrand]);
                          updateEducationExperience(education.id, 'institution', newBrand.id);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`degree-${education.id}`} className="flex items-center h-5">Degree</Label>
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
                      <Label htmlFor={`start-year-${education.id}`}>Start Year</Label>
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
                      <Label htmlFor={`end-year-${education.id}`}>End Year</Label>
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
                updateEducationExperience(activeEducationId, 'degree', newDegreeCommonName);

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
