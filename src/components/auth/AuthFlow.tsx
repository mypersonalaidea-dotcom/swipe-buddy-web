import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { OTPVerification } from "./OTPVerification";
import { SignupFlow } from "../signup/SignupFlow";

type AuthView = "login" | "signup" | "otp-verification";

export const AuthFlow = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [verificationPhone, setVerificationPhone] = useState("");

  const handleLogin = () => {
    navigate("/dashboard");
  };

  const handleSignup = () => {
    setCurrentView("signup");
  };

  const handleOTPVerification = (phone: string) => {
    setVerificationPhone(phone);
    setCurrentView("otp-verification");
  };

  const handleOTPVerified = () => {
    navigate("/dashboard");
  };

  const handleBackToSignup = () => {
    setCurrentView("signup");
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  const handleSignupComplete = () => {
    navigate("/dashboard");
  };

  switch (currentView) {
    case "login":
      return (
        <LoginPage
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      );

    case "signup":
      return (
        <div className="relative">
          <div className="absolute top-4 left-4 z-50">
            <button
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-rose-600 bg-white/70 backdrop-blur-md border border-rose-100 shadow-sm hover:bg-white/90 hover:shadow-md transition-all duration-200"
            >
              ← Back to Login
            </button>
          </div>
          <SignupFlow onComplete={handleSignupComplete} onSwitchToLogin={handleBackToLogin} />
        </div>
      );

    case "otp-verification":
      return (
        <OTPVerification
          phoneNumber={verificationPhone}
          onVerified={handleOTPVerified}
          onBack={handleBackToSignup}
        />
      );

    default:
      return null;
  }
};