import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
    </div>
  );
};