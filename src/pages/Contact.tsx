import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

/* ---------------- VALIDATION ---------------- */
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;
type FormErrors = Partial<Record<keyof ContactForm, string>>;

/* ---------------- DATA ---------------- */
const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    value: "support@mentorlms.com",
    hint: "Response within 24 hours",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+1 (555) 123-4567",
    hint: "Mon–Fri · 9AM–6PM",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "San Francisco, CA",
    hint: "Learning Street 123",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: "Monday – Friday",
    hint: "9:00 AM – 6:00 PM",
  },
];

/* ---------------- PAGE ---------------- */
export default function Contact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      parsed.error.errors.forEach((err) => {
        const key = err.path[0] as keyof ContactForm;
        fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("contact_inquiries")
        .insert(parsed.data);

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Our team will contact you shortly.",
      });

      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        {/* ---------------- HERO ---------------- */}
        <section className="py-24 bg-gradient-to-b from-accent/10 to-transparent text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 max-w-3xl"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-accent/15 text-accent mb-6">
              Contact Us
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Let’s Talk 👋
            </h1>
            <p className="text-lg text-muted-foreground">
              Questions, feedback, or enterprise needs — we’re here to help.
            </p>
          </motion.div>
        </section>

        {/* ---------------- INFO CARDS ---------------- */}
        <section className="py-16 border-y border-border">
          <div className="container mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="glass p-6 rounded-xl text-center"
              >
                <c.icon className="h-6 w-6 text-accent mx-auto mb-4" />
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-foreground">{c.value}</p>
                <p className="text-sm text-muted-foreground">{c.hint}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------------- FORM + MAP ---------------- */}
        <section className="py-24">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12">
            {/* FORM */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold">Send a Message</h2>
              <p className="text-muted-foreground">
                Fill out the form and we’ll respond within 24 hours.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={errors.name && "border-destructive"}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={errors.email && "border-destructive"}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Subject</Label>
                <Input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={errors.subject && "border-destructive"}
                />
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  className={errors.message && "border-destructive"}
                />
              </div>

              <Button
                size="lg"
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? "Sending..." : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </motion.form>

            {/* MAP + ENTERPRISE */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="rounded-2xl overflow-hidden border">
                <iframe
                  title="Office location"
                  src="https://www.google.com/maps?q=San+Francisco&output=embed"
                  className="w-full h-72"
                  loading="lazy"
                />
              </div>

              <div className="glass p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-3">
                  Enterprise & Partnerships
                </h3>
                <p className="text-muted-foreground mb-4">
                  Need custom training for teams or organizations?
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-accent" />
                  enterprise@mentorlms.com
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
