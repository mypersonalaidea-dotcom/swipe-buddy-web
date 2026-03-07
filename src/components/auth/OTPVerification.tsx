import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OTPVerificationProps {
  phoneNumber: string;
  onVerified: () => void;
  onBack: () => void;
}

export const OTPVerification = ({ phoneNumber, onVerified, onBack }: OTPVerificationProps) => {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleVerifyOTP = () => {
    if (!otp) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
      });
      return;
    }

    if (otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Demo OTP verification (hardcoded to 123456)
    setTimeout(() => {
      setIsLoading(false);
      if (otp === "123456") {
        toast({
          title: "Phone Verified! ✅",
          description: "Your phone number has been successfully verified.",
        });
        onVerified();
      } else {
        toast({
          title: "Invalid OTP",
          description: "Please enter the correct OTP. For demo: 123456",
          variant: "destructive",
        });
      }
    }, 1000);
  };

  const handleResendOTP = () => {
    setTimeLeft(60);
    setCanResend(false);
    setOtp("");
    toast({
      title: "OTP Sent",
      description: `New OTP sent to ${phoneNumber}. Demo OTP: 123456`,
    });
  };

  const maskedPhone = `${phoneNumber.slice(0, 2)}XXXXXX${phoneNumber.slice(-2)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md mx-auto shadow-card animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Verify Phone Number</CardTitle>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to <br />
            <span className="font-medium">+91 {maskedPhone}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Demo Notice */}
          <div className="bg-accent/50 p-3 rounded-lg border border-accent">
            <p className="text-sm text-foreground text-center">
              <strong>Demo Mode:</strong> Use OTP <span className="font-mono font-bold">123456</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(value);
              }}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {canResend ? "You can resend OTP now" : `Resend OTP in ${timeLeft}s`}
            </span>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full h-12"
            variant="gradient"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>

          {/* Resend OTP */}
          <Button
            onClick={handleResendOTP}
            disabled={!canResend}
            variant="outline"
            className="w-full"
          >
            Resend OTP
          </Button>

          {/* Back Button */}
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-full"
          >
            Back to Signup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};