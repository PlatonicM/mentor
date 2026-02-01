import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type AuthStep = "phone" | "otp" | "profile";
type UserType = "student" | "mentor";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<AuthStep>("phone");
  const [userType, setUserType] = useState<UserType>("student");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/courses");
    }
  }, [user, authLoading, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: phone.startsWith("+") ? phone : `+91${phone}` },
      });

      if (error) throw error;

      if (data.success) {
        setStep("otp");
        setCountdown(data.expiresIn || 180);
        // Demo mode - show OTP
        if (data.demoOtp) {
          setDemoOtp(data.demoOtp);
        }
        toast({
          title: "OTP Sent!",
          description: "Check your phone for the verification code",
        });
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          phone: phone.startsWith("+") ? phone : `+91${phone}`,
          otp,
          fullName,
          role: userType,
        },
      });

      if (error) throw error;

      if (data.success) {
        setIsNewUser(data.isNewUser);
        
        if (data.isNewUser) {
          setStep("profile");
        } else if (data.magicLink) {
          // Redirect to magic link for existing users
          window.location.href = data.magicLink;
        }
        
        toast({
          title: "Verified!",
          description: data.isNewUser ? "Complete your profile" : "Logging you in...",
        });
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    // The profile was already created during OTP verification
    // Just redirect to courses
    toast({
      title: "Welcome to MentorLMS!",
      description: "Your account has been created successfully",
    });
    navigate("/courses");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-border/50">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center"
            >
              <GraduationCap className="h-8 w-8 text-accent-foreground" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {step === "phone" && "Welcome to MentorLMS"}
                {step === "otp" && "Verify Your Number"}
                {step === "profile" && "Complete Your Profile"}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {step === "phone" && "Sign in or create an account with your phone"}
                {step === "otp" && `Enter the 6-digit code sent to ${phone}`}
                {step === "profile" && "Tell us a bit about yourself"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* User Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={userType === "student" ? "default" : "outline"}
                      onClick={() => setUserType("student")}
                      className="h-auto py-4 flex flex-col gap-2"
                    >
                      <GraduationCap className="h-6 w-6" />
                      <span>I'm a Student</span>
                    </Button>
                    <Button
                      variant={userType === "mentor" ? "default" : "outline"}
                      onClick={() => setUserType("mentor")}
                      className="h-auto py-4 flex flex-col gap-2"
                    >
                      <Users className="h-6 w-6" />
                      <span>I'm a Mentor</span>
                    </Button>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-12"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSendOtp}
                    disabled={loading || !phone}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Send OTP
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Demo OTP Display */}
                  {demoOtp && (
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-center">
                      <p className="text-sm text-muted-foreground">Demo OTP:</p>
                      <p className="text-2xl font-mono font-bold text-accent">{demoOtp}</p>
                    </div>
                  )}

                  {/* OTP Input */}
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {/* Countdown & Resend */}
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Code expires in{" "}
                        <span className="font-mono text-accent">{formatTime(countdown)}</span>
                      </p>
                    ) : (
                      <Button variant="link" onClick={handleSendOtp} disabled={loading}>
                        Resend OTP
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setDemoOtp(null);
                      }}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 6}
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleCompleteProfile}
                    disabled={loading || !fullName.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-accent hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-accent hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
