import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Phone, Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2, Home, Users, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

// OTP mode: "hardcoded" accepts 123456 locally, "service" uses backend APIs
const OTP_MODE = import.meta.env.VITE_OTP_MODE || "hardcoded";
const HARDCODED_OTP = "123456";

interface LoginPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const LoginPage = ({ onLogin, onSignup }: LoginPageProps) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  // ─── Forgot Password State ───
  const [fpOpen, setFpOpen] = useState(false);
  const [fpStep, setFpStep] = useState<"phone" | "otp" | "reset">("phone");
  const [fpPhone, setFpPhone] = useState("");
  const [fpCountryCode, setFpCountryCode] = useState("+91");
  const [fpOtp, setFpOtp] = useState("");
  const [fpOtpError, setFpOtpError] = useState("");
  const [fpOtpShake, setFpOtpShake] = useState(false);
  const [fpCountdown, setFpCountdown] = useState(0);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpShowNew, setFpShowNew] = useState(false);
  const [fpShowConfirm, setFpShowConfirm] = useState(false);
  const [fpResetSuccess, setFpResetSuccess] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (fpCountdown <= 0) return;
    const timer = setTimeout(() => setFpCountdown(fpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [fpCountdown]);

  // Password strength
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const fpStrength = getPasswordStrength(fpNewPassword);
  const fpStrengthLabel = ["", "Weak", "Weak", "Fair", "Strong", "Very Strong"][fpStrength] || "";
  const fpStrengthColor = ["", "bg-red-500", "bg-red-500", "bg-yellow-500", "bg-green-500", "bg-emerald-500"][fpStrength] || "";
  const fpPasswordsMatch = fpNewPassword.length > 0 && fpNewPassword === fpConfirmPassword;
  const fpIsPasswordValid = fpStrength >= 3 && fpPasswordsMatch;

  const openForgotPassword = () => {
    setFpStep("phone");
    setFpPhone("");
    setFpOtp("");
    setFpOtpError("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpResetSuccess(false);
    setFpOpen(true);
  };

  const handleFpSendOtp = async () => {
    if (!fpPhone || fpPhone.length !== 10) {
      setFpOtpError("Please enter a valid 10-digit phone number");
      return;
    }
    setFpLoading(true);
    setFpOtpError("");

    try {
      if (OTP_MODE === "hardcoded") {
        await new Promise(r => setTimeout(r, 800));
        if (fpPhone === "9999999999") {
          setFpOtpError("No user found with this phone number.");
          setFpLoading(false);
          return;
        }
      } else {
        const checkRes = await api.post("/auth/check-phone", { phone: fpPhone });
        if (!checkRes.data?.data?.exists) {
          setFpOtpError("No user found with this phone number.");
          setFpLoading(false);
          return;
        }
        await api.post("/auth/forgot-password/send-otp", { phone: fpPhone });
      }
      setFpStep("otp");
      setFpCountdown(30);
      toast({
        title: "OTP Sent! 📱",
        description: `A verification code has been sent to your phone ending in ${fpPhone.slice(-4)}`,
      });
    } catch (err: any) {
      setFpOtpError(err?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const triggerShake = () => {
    setFpOtpShake(true);
    setTimeout(() => setFpOtpShake(false), 600);
  };

  const handleFpVerifyOtp = async () => {
    if (fpOtp.length !== 6) {
      setFpOtpError("Please enter the complete 6-digit OTP");
      triggerShake();
      return;
    }
    setFpLoading(true);
    setFpOtpError("");

    try {
      if (OTP_MODE === "hardcoded") {
        if (fpOtp === HARDCODED_OTP) {
          setFpStep("reset");
        } else {
          setFpOtpError("Invalid OTP. Please try again.");
          triggerShake();
        }
      } else {
        const res = await api.post("/auth/forgot-password/verify-otp", {
          phone: fpPhone,
          otp: fpOtp,
        });
        if (res.data?.success) {
          setFpStep("reset");
        } else {
          setFpOtpError(res.data?.message || "Invalid OTP. Please try again.");
          triggerShake();
        }
      }
    } catch (err: any) {
      setFpOtpError(err?.response?.data?.message || "Verification failed. Please try again.");
      triggerShake();
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResendOtp = async () => {
    if (fpCountdown > 0) return;
    setFpOtp("");
    setFpOtpError("");
    setFpCountdown(30);

    try {
      if (OTP_MODE !== "hardcoded") {
        await api.post("/auth/forgot-password/send-otp", { phone: fpPhone });
      }
      toast({ title: "OTP Resent! 📱", description: "A new code has been sent to your phone." });
    } catch {
      setFpOtpError("Failed to resend OTP.");
    }
  };

  const handleFpResetPassword = async () => {
    if (!fpIsPasswordValid) return;
    setFpLoading(true);

    try {
      if (OTP_MODE === "hardcoded") {
        // Simulated success
      } else {
        await api.post("/auth/forgot-password/reset", {
          phone: fpPhone,
          otp: fpOtp,
          new_password: fpNewPassword,
        });
      }
      setFpResetSuccess(true);
      toast({
        title: "Password Reset Successful! 🎉",
        description: "You can now sign in with your new password.",
      });
      setTimeout(() => {
        setFpOpen(false);
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err?.response?.data?.message || "Could not reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFpLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(phone, password);
      toast({
        title: "Welcome back! 🎉",
        description: "You have successfully logged in.",
      });
      onLogin();
    } catch (err: any) {
      const message =
        err?.friendlyMessage ||
        err?.response?.data?.message ||
        "Invalid phone number or password.";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  const countryCodes = [
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
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -10px); }
          50% { transform: translate(-5px, -20px); }
          75% { transform: translate(-15px, -8px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        .login-gradient {
          background: linear-gradient(135deg, #9f1239, #e11d48, #f43f5e, #fb7185, #e11d48, #be123c);
          background-size: 400% 400%;
          animation: gradient-shift 12s ease infinite;
        }
        .dot-pattern {
          background-image: radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .glass-stat {
          background: rgba(255, 255, 255, 0.13);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .glass-stat:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-3px) scale(1.02);
        }
        .glass-feature {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.7s ease-out forwards; }
        .animate-slide-right { animation: slide-right 0.5s ease-out forwards; }
        .animate-spin-slow { animation: spin-slow 25s linear infinite; }
        .animate-drift { animation: drift 8s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 4s ease-in-out infinite; }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          animation: pulse-glow 6s ease-in-out infinite;
        }
        .right-panel-bg {
          background: linear-gradient(160deg, #fff5f5 0%, #fef2f2 30%, #fce4ec 70%, #fbe9e7 100%);
        }
        .glass-form {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 40px rgba(225, 29, 72, 0.08), 0 1px 3px rgba(0,0,0,0.04);
        }
        .form-input {
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1px solid rgba(225, 29, 72, 0.12) !important;
          transition: all 0.3s ease;
        }
        .form-input:focus {
          border-color: rgba(225, 29, 72, 0.45) !important;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.08) !important;
          background: rgba(255, 255, 255, 0.95) !important;
        }
        .form-input::placeholder {
          color: rgba(100, 100, 120, 0.5) !important;
        }
        .form-select-trigger {
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1px solid rgba(225, 29, 72, 0.12) !important;
        }
        .form-select-trigger:hover {
          background: rgba(255, 255, 255, 0.9) !important;
          border-color: rgba(225, 29, 72, 0.25) !important;
        }
        .google-btn {
          background: rgba(255, 255, 255, 0.6) !important;
          border: 1px solid rgba(225, 29, 72, 0.1) !important;
          color: #374151 !important;
          backdrop-filter: blur(8px);
        }
        .google-btn:hover {
          background: rgba(255, 255, 255, 0.9) !important;
          border-color: rgba(225, 29, 72, 0.2) !important;
          box-shadow: 0 2px 12px rgba(225, 29, 72, 0.1);
        }
        .right-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          animation: pulse-glow 8s ease-in-out infinite;
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row">

        {/* ─── Left Panel: Premium Animated Hero ─── */}
        <div className="login-gradient relative overflow-hidden lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 lg:py-0 min-h-[420px] lg:min-h-screen">

          {/* Dot grid pattern overlay */}
          <div className="absolute inset-0 dot-pattern opacity-40" />

          {/* Animated background orbs */}
          <div className="orb w-72 h-72 bg-white/10 -top-24 -left-24" />
          <div className="orb w-56 h-56 bg-pink-300/20 top-1/4 right-0" style={{ animationDelay: '2s' }} />
          <div className="orb w-64 h-64 bg-rose-200/15 bottom-0 left-1/3" style={{ animationDelay: '4s' }} />
          <div className="orb w-40 h-40 bg-white/8 top-2/3 -right-10" style={{ animationDelay: '6s' }} />

          {/* Animated geometric decorations */}
          {/* Slowly rotating wireframe square */}
          <div className="absolute top-[15%] right-[12%] w-20 h-20 border-2 border-white/15 rounded-lg animate-spin-slow" />
          <div className="absolute top-[17%] right-[14%] w-16 h-16 border border-white/10 rounded-md animate-spin-slow" style={{ animationDirection: 'reverse' }} />

          {/* Pulsing ring */}
          <div className="absolute bottom-[25%] right-[20%] w-28 h-28 border-2 border-white/10 rounded-full animate-pulse-ring" />
          <div className="absolute bottom-[27%] right-[22%] w-20 h-20 border border-white/8 rounded-full animate-pulse-ring" style={{ animationDelay: '1s' }} />

          {/* Floating small shapes */}
          <div className="absolute top-[40%] right-[8%] w-3 h-3 bg-white/25 rounded-full animate-drift" />
          <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-white/30 rounded-full animate-drift" style={{ animationDelay: '2s' }} />
          <div className="absolute top-[20%] left-[60%] w-2.5 h-2.5 bg-white/20 rounded-full animate-drift" style={{ animationDelay: '4s' }} />
          <div className="absolute bottom-[35%] left-[45%] w-4 h-4 bg-white/10 rotate-45 animate-float-slow" />
          <div className="absolute top-[55%] right-[15%] w-3 h-3 bg-white/15 rotate-45 animate-float-slow" style={{ animationDelay: '3s' }} />

          {/* Floating diamond shapes */}
          <div className="absolute top-[30%] right-[35%] animate-float-delayed">
            <div className="w-6 h-6 border border-white/20 rotate-45" />
          </div>
          <div className="absolute bottom-[40%] right-[10%] animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="w-4 h-4 border border-white/15 rotate-45" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-lg">
            {/* Badge */}
            <div className="animate-slide-right" style={{ animationDelay: '0.2s', opacity: 0 }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20 mb-6 shadow-lg shadow-black/5">
                <Sparkles className="w-3.5 h-3.5" />
                Find Your Perfect Match
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.1] mb-5 animate-slide-up drop-shadow-lg"
              style={{ animationDelay: '0.3s', opacity: 0 }}
            >
              Your Next<br />
              Flatmate<br />
              <span className="bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">Awaits ✨</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-white/85 text-base sm:text-lg max-w-md mb-8 leading-relaxed animate-slide-up"
              style={{ animationDelay: '0.5s', opacity: 0 }}
            >
              Connect with compatible roommates, explore verified flats, and make your next move seamless.
            </p>

            {/* Feature highlights */}
            <div
              className="flex flex-wrap gap-2.5 mb-8 animate-slide-up"
              style={{ animationDelay: '0.65s', opacity: 0 }}
            >
              {[
                { emoji: '🏠', text: 'Verified Listings' },
                { emoji: '🤝', text: 'Smart Matching' },
                { emoji: '🔒', text: 'Safe & Secure' },
              ].map((f) => (
                <span
                  key={f.text}
                  className="glass-feature rounded-full px-3.5 py-1.5 text-xs font-medium text-white/90 flex items-center gap-1.5 transition-all duration-300 hover:bg-white/15 cursor-default"
                >
                  <span>{f.emoji}</span>
                  {f.text}
                </span>
              ))}
            </div>

            {/* Stat Cards */}
            <div
              className="flex gap-4 animate-slide-up"
              style={{ animationDelay: '0.8s', opacity: 0 }}
            >
              <div className="glass-stat rounded-xl px-5 py-3.5 flex items-center gap-3 transition-all duration-300 cursor-default animate-float">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg shadow-black/5">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-tight">500+</p>
                  <p className="text-white/65 text-xs font-medium">Verified Flats</p>
                </div>
              </div>
              <div className="glass-stat rounded-xl px-5 py-3.5 flex items-center gap-3 transition-all duration-300 cursor-default animate-float-delayed">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shadow-lg shadow-black/5">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl leading-tight">2K+</p>
                  <p className="text-white/65 text-xs font-medium">Happy Users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0 hidden lg:block">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0,80 C200,120 400,40 600,80 C800,120 1000,40 1200,80 C1300,100 1380,90 1440,80 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.05)" />
              <path d="M0,90 C180,110 360,60 540,90 C720,120 900,50 1080,90 C1260,130 1380,70 1440,90 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.03)" />
            </svg>
          </div>
        </div>

        {/* ─── Right Panel: Premium Glassmorphic Form ─── */}
        <div className="lg:w-1/2 flex items-center justify-center right-panel-bg relative overflow-hidden px-6 sm:px-12 lg:px-16 py-12 lg:py-0 min-h-[500px] lg:min-h-screen">

          {/* Soft decorative orbs */}
          <div className="right-orb w-80 h-80 bg-rose-300/20 -top-40 -right-40" />
          <div className="right-orb w-60 h-60 bg-pink-200/25 bottom-10 -left-20" style={{ animationDelay: '3s' }} />
          <div className="right-orb w-44 h-44 bg-rose-400/10 top-1/3 right-10" style={{ animationDelay: '5s' }} />

          <div className="glass-form rounded-3xl p-8 sm:p-10 w-full max-w-md relative z-10 animate-fade-in">
            {/* Header */}
            <div className="mb-8 text-center">
              <span className="text-4xl mb-2 block">👋</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-1.5 text-sm">Sign in to find your perfect flatmate</p>
            </div>

            <div className="space-y-5">
              {/* Phone Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  📱 Phone Number
                </label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px] shrink-0 h-12 rounded-xl form-select-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border border-rose-100 max-h-60 overflow-y-auto z-50 shadow-xl rounded-lg">
                      {countryCodes.map(({ code, flag }) => (
                        <SelectItem
                          key={code}
                          value={code}
                          className="cursor-pointer hover:bg-rose-50 focus:bg-rose-50 transition-colors duration-200 rounded-sm mx-1"
                        >
                          {flag} {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={handleKeyDown}
                      maxLength={10}
                      autoComplete="tel"
                      className="pl-10 h-12 rounded-xl form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  🔒 Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-10 h-12 rounded-xl form-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openForgotPassword}
                    className="text-xs text-rose-500 hover:text-rose-600 hover:underline underline-offset-2 transition-colors font-semibold"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mt-2"
                variant="gradient"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing In...
                  </span>
                ) : "Sign In"}
              </Button>
            </div>

            {/* Signup Link */}
            <p className="text-center text-sm text-gray-500 mt-8">
              Don't have an account?{" "}
              <button
                onClick={onSignup}
                className="text-rose-500 font-semibold hover:text-rose-600 hover:underline underline-offset-2 transition-colors"
              >
                Create Account
              </button>
            </p>

            {/* Footer accent */}
            <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Secure & encrypted login</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Forgot Password Dialog ─── */}
      <Dialog open={fpOpen} onOpenChange={setFpOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {fpStep === "phone" && <><Phone className="w-5 h-5 text-primary" /> Forgot Password</>}
              {fpStep === "otp" && <><ShieldCheck className="w-5 h-5 text-primary" /> Verify OTP</>}
              {fpStep === "reset" && !fpResetSuccess && <><KeyRound className="w-5 h-5 text-primary" /> Reset Password</>}
              {fpResetSuccess && <><CheckCircle2 className="w-5 h-5 text-green-500" /> Password Reset</>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* ── Step 1: Phone ── */}
            {fpStep === "phone" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter your registered phone number to receive a verification code.
                </p>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="flex gap-2">
                    <Select value={fpCountryCode} onValueChange={setFpCountryCode}>
                      <SelectTrigger className="w-[100px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background/95 backdrop-blur-sm border border-border/50 max-h-60 overflow-y-auto z-50 shadow-lg rounded-lg">
                        {countryCodes.map(({ code, flag }) => (
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
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={fpPhone}
                      onChange={(e) => {
                        setFpPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setFpOtpError("");
                      }}
                      maxLength={10}
                      onKeyDown={(e) => e.key === "Enter" && handleFpSendOtp()}
                    />
                  </div>
                  {fpOtpError && (
                    <p className="text-xs text-destructive font-medium">{fpOtpError}</p>
                  )}
                </div>
                <Button
                  onClick={handleFpSendOtp}
                  disabled={fpLoading || fpPhone.length !== 10}
                  className="w-full"
                  variant="gradient"
                >
                  {fpLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : "Send OTP"}
                </Button>
              </>
            )}

            {/* ── Step 2: OTP ── */}
            {fpStep === "otp" && (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code sent to <span className="font-medium text-foreground">+91 {fpPhone}</span>
                </p>

                <div className="flex justify-center">
                  <div className={fpOtpShake ? 'animate-shake' : ''}>
                    <InputOTP
                      maxLength={6}
                      value={fpOtp}
                      onChange={(val) => {
                        setFpOtp(val);
                        setFpOtpError("");
                      }}
                    >
                      <InputOTPGroup className="gap-1.5 sm:gap-2">
                        <InputOTPSlot index={0} className={`w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md ${fpOtpError ? 'border-destructive ring-destructive/20 ring-2' : ''}`} />
                        <InputOTPSlot index={1} className={`w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md ${fpOtpError ? 'border-destructive ring-destructive/20 ring-2' : ''}`} />
                        <InputOTPSlot index={2} className={`w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md ${fpOtpError ? 'border-destructive ring-destructive/20 ring-2' : ''}`} />
                        <InputOTPSlot index={3} className={`w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md ${fpOtpError ? 'border-destructive ring-destructive/20 ring-2' : ''}`} />
                        <InputOTPSlot index={4} className={`w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md ${fpOtpError ? 'border-destructive ring-destructive/20 ring-2' : ''}`} />
                        <InputOTPSlot index={5} className={`w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-semibold rounded-md ${fpOtpError ? 'border-destructive ring-destructive/20 ring-2' : ''}`} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {fpOtpError && (
                  <p className="text-xs text-destructive font-medium text-center animate-fade-in">
                    {fpOtpError}
                  </p>
                )}

                <Button
                  onClick={handleFpVerifyOtp}
                  disabled={fpLoading || fpOtp.length !== 6}
                  className="w-full"
                  variant="gradient"
                >
                  {fpLoading ? "Verifying..." : "Verify OTP"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleFpResendOtp}
                    disabled={fpCountdown > 0}
                    className={`text-xs transition-colors ${
                      fpCountdown > 0
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-primary hover:text-primary/80 hover:underline cursor-pointer'
                    }`}
                  >
                    {fpCountdown > 0 ? `Resend in ${fpCountdown}s` : 'Resend OTP'}
                  </button>
                </div>
              </>
            )}

            {/* ── Step 3: Reset Password ── */}
            {fpStep === "reset" && !fpResetSuccess && (
              <>
                <p className="text-sm text-muted-foreground">
                  Create a new password for your account.
                </p>

                {/* New Password */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={fpShowNew ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={fpNewPassword}
                      onChange={(e) => setFpNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setFpShowNew(!fpShowNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {fpShowNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {fpNewPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= fpStrength ? fpStrengthColor : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${fpStrength >= 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {fpStrengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={fpShowConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={fpConfirmPassword}
                      onChange={(e) => setFpConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setFpShowConfirm(!fpShowConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {fpShowConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fpConfirmPassword && (
                    <p className={`text-xs font-medium ${fpPasswordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                      {fpPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleFpResetPassword}
                  disabled={fpLoading || !fpIsPasswordValid}
                  className="w-full"
                  variant="gradient"
                >
                  {fpLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </>
            )}

            {/* ── Success ── */}
            {fpResetSuccess && (
              <div className="text-center space-y-3 py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};