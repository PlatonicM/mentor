import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Building2,
  Smartphone,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PaymentMethod = "card" | "upi" | "netbanking";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, total, discount, clearCart } = useCart();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
    upiId: "",
    bank: "",
  });

  // Redirect if cart is empty or not logged in
  if (!user) {
    navigate("/auth", { state: { from: "/checkout" } });
    return null;
  }

  if (items.length === 0 && !success) {
    navigate("/cart");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    // Format card number with spaces
    if (name === "cardNumber") {
      value = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
      if (value.length > 19) return;
    }

    // Format expiry as MM/YY
    if (name === "expiry") {
      value = value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4);
      }
      if (value.length > 5) return;
    }

    // Limit CVV
    if (name === "cvv" && value.length > 3) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (paymentMethod === "card") {
      if (formData.cardNumber.replace(/\s/g, "").length !== 16) {
        toast({ title: "Invalid card number", variant: "destructive" });
        return false;
      }
      if (!formData.cardName.trim()) {
        toast({ title: "Please enter card holder name", variant: "destructive" });
        return false;
      }
      if (formData.expiry.length !== 5) {
        toast({ title: "Invalid expiry date", variant: "destructive" });
        return false;
      }
      if (formData.cvv.length !== 3) {
        toast({ title: "Invalid CVV", variant: "destructive" });
        return false;
      }
    } else if (paymentMethod === "upi") {
      if (!formData.upiId.includes("@")) {
        toast({ title: "Invalid UPI ID", variant: "destructive" });
        return false;
      }
    } else if (paymentMethod === "netbanking") {
      if (!formData.bank) {
        toast({ title: "Please select a bank", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      // Create enrollments and transactions for each course
      for (const item of items) {
        // Create enrollment
        const { error: enrollError } = await supabase.from("enrollments").insert({
          course_id: item.course_id,
          user_id: user.id,
        });

        if (enrollError) {
          console.error("Enrollment error:", enrollError);
          throw enrollError;
        }

        // Create transaction record
        const price = item.discounted_price ?? item.price ?? 0;
        if (price > 0) {
          const platformFee = price * 0.2;
          const netAmount = price - platformFee;

          await supabase.from("transactions").insert({
            course_id: item.course_id,
            student_id: user.id,
            mentor_id: item.mentor_id,
            amount: price,
            platform_fee: platformFee,
            net_amount: netAmount,
            status: "completed",
          });
        }
      }

      setSuccess(true);
      clearCart();

      toast({
        title: "Payment Successful!",
        description: `You have been enrolled in ${items.length} course(s).`,
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container max-w-lg py-24 px-4 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-success" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground mb-6">
                  Thank you for your purchase. You can now access your courses.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate("/courses")}>
                    Browse More
                  </Button>
                  <Button onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-5xl py-24 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Choose your preferred payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                  className="grid grid-cols-3 gap-4"
                >
                  <Label
                    htmlFor="card"
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" className="sr-only" />
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Card</span>
                  </Label>
                  <Label
                    htmlFor="upi"
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <Smartphone className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">UPI</span>
                  </Label>
                  <Label
                    htmlFor="netbanking"
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                      paymentMethod === "netbanking"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="netbanking" id="netbanking" className="sr-only" />
                    <Building2 className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Net Banking</span>
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Card Payment Form */}
            {paymentMethod === "card" && (
              <Card>
                <CardHeader>
                  <CardTitle>Card Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      name="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      name="cardName"
                      placeholder="John Doe"
                      value={formData.cardName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        name="expiry"
                        placeholder="MM/YY"
                        value={formData.expiry}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        name="cvv"
                        type="password"
                        placeholder="•••"
                        value={formData.cvv}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* UPI Form */}
            {paymentMethod === "upi" && (
              <Card>
                <CardHeader>
                  <CardTitle>UPI Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      name="upiId"
                      placeholder="yourname@upi"
                      value={formData.upiId}
                      onChange={handleInputChange}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Net Banking Form */}
            {paymentMethod === "netbanking" && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Bank</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.bank}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, bank: value }))
                    }
                    className="grid grid-cols-2 gap-3"
                  >
                    {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB"].map((bank) => (
                      <Label
                        key={bank}
                        htmlFor={bank}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.bank === bank
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <RadioGroupItem value={bank} id={bank} />
                        <span className="font-medium">{bank} Bank</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.thumbnail_url || "/placeholder.svg"}
                      alt={item.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.discounted_price ?? item.price}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{(total + discount).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay ₹{total.toFixed(2)}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
