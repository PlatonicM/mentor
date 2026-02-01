import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  price: number;
  discounted_price: number | null;
  mentor_id: string;
  mentor_name?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  discount: number;
  loading: boolean;
  addToCart: (course: Omit<CartItem, "id">) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "mentor_lms_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(parsed);
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }
    setLoading(false);
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loading]);

  // Filter out already enrolled courses when user logs in
  useEffect(() => {
    const filterEnrolledCourses = async () => {
      if (!user || items.length === 0) return;

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      if (enrollments && enrollments.length > 0) {
        const enrolledIds = enrollments.map((e) => e.course_id);
        setItems((prev) => prev.filter((item) => !enrolledIds.includes(item.course_id)));
      }
    };

    filterEnrolledCourses();
  }, [user]);

  const addToCart = useCallback(
    (course: Omit<CartItem, "id">) => {
      setItems((prev) => {
        const exists = prev.some((item) => item.course_id === course.course_id);
        if (exists) {
          toast({
            title: "Already in cart",
            description: "This course is already in your cart.",
          });
          return prev;
        }

        toast({
          title: "Added to cart",
          description: `"${course.title}" has been added to your cart.`,
        });

        return [...prev, { ...course, id: crypto.randomUUID() }];
      });
    },
    [toast]
  );

  const removeFromCart = useCallback(
    (courseId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.course_id === courseId);
        if (item) {
          toast({
            title: "Removed from cart",
            description: `"${item.title}" has been removed from your cart.`,
          });
        }
        return prev.filter((item) => item.course_id !== courseId);
      });
    },
    [toast]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (courseId: string) => items.some((item) => item.course_id === courseId),
    [items]
  );

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const total = items.reduce(
    (sum, item) => sum + (item.discounted_price ?? item.price ?? 0),
    0
  );
  const discount = subtotal - total;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.length,
        subtotal,
        total,
        discount,
        loading,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
