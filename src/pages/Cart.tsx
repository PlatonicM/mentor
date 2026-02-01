import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  Tag,
  BookOpen,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

/* ---------------- MOTION ---------------- */
const itemMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -80 },
  transition: { duration: 0.25 },
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    itemCount,
    subtotal,
    total,
    discount,
    removeFromCart,
    clearCart,
  } = useCart();

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  /* ---------------- LOADING ---------------- */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground">Loading cart...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-6xl px-4 py-24">
        {/* ---------------- HEADER ---------------- */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="h-8 w-8 text-accent" />
          <h1 className="text-3xl font-bold">Your Cart</h1>
          {itemCount > 0 && (
            <span className="text-muted-foreground">
              ({itemCount} item{itemCount > 1 ? "s" : ""})
            </span>
          )}
        </div>

        {/* ---------------- EMPTY STATE ---------------- */}
        {items.length === 0 ? (
          <Card className="text-center py-20 glass">
            <CardContent>
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-xl font-semibold mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Add courses to start your learning journey 🚀
              </p>
              <Link to="/courses">
                <Button size="lg">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Explore Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* ---------------- CART ITEMS ---------------- */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">Courses</h2>
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  Clear all
                </Button>
              </div>

              <AnimatePresence>
                {items.map((item) => {
                  const finalPrice =
                    item.discounted_price !== null &&
                    item.discounted_price < item.price
                      ? item.discounted_price
                      : item.price;

                  return (
                    <motion.div
                      key={item.id}
                      {...itemMotion}
                      layout
                      whileHover={{ y: -2 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <Link
                              to={`/course/${item.slug}`}
                              className="shrink-0"
                            >
                              <img
                                src={
                                  item.thumbnail_url ||
                                  "https://images.unsplash.com/photo-1584697964192-7c9b54c9c0c6?w=400&fit=crop"
                                }
                                alt={item.title}
                                className="w-32 h-20 rounded-lg object-cover"
                              />
                            </Link>

                            <div className="flex-1 min-w-0">
                              <Link to={`/course/${item.slug}`}>
                                <h3 className="font-semibold line-clamp-1 hover:text-accent transition-colors">
                                  {item.title}
                                </h3>
                              </Link>

                              {item.mentor_name && (
                                <p className="text-sm text-muted-foreground">
                                  by {item.mentor_name}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-lg font-bold">
                                  {finalPrice === 0
                                    ? "Free"
                                    : `₹${finalPrice}`}
                                </span>

                                {item.discounted_price !== null &&
                                  item.discounted_price < item.price && (
                                    <>
                                      <span className="text-sm text-muted-foreground line-through">
                                        ₹{item.price}
                                      </span>
                                      <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded">
                                        {Math.round(
                                          ((item.price -
                                            item.discounted_price) /
                                            item.price) *
                                            100,
                                        )}
                                        % OFF
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                removeFromCart(item.course_id)
                              }
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* ---------------- SUMMARY ---------------- */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28 glass">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Discount
                      </span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>

                  {!user && (
                    <p className="text-xs text-muted-foreground">
                      Login required before checkout
                    </p>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
