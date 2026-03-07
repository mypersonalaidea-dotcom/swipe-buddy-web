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
        <div>
          <div className="p-4">
            <button
              onClick={handleBackToLogin}
              className="text-primary hover:underline text-sm"
            >
              ← Back to Login
            </button>
          </div>
          <SignupFlow onComplete={handleSignupComplete} />
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