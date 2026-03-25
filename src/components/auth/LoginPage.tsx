import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Phone, Lock, Eye, EyeOff, ShieldCheck, KeyRound, CheckCircle2 } from "lucide-react";
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
        // Simulate a small delay for UX
        await new Promise(r => setTimeout(r, 800));
        // Simulate non-existent user for testing
        if (fpPhone === "9999999999") {
          setFpOtpError("No user found with this phone number.");
          setFpLoading(false);
          return;
        }
      } else {
        // Check if phone number exists in our database
        const checkRes = await api.post("/auth/check-phone", { phone: fpPhone });
        if (!checkRes.data?.data?.exists) {
          setFpOtpError("No user found with this phone number.");
          setFpLoading(false);
          return;
        }
        // Phone exists — send OTP
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-card animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
          <p className="text-muted-foreground">Sign in to find your perfect flatmate</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone Input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
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
              <div className="relative flex-1">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={handleKeyDown}
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-xs text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors font-medium"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-12"
            variant="gradient"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Signup Link */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Don't have an account?</p>
            <Button
              onClick={onSignup}
              variant="outline"
              className="w-full"
            >
              Create New Account
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

                  {/* Strength meter */}
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
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
    </div>
  );
};