import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Sparkles, PartyPopper, Mail, ArrowRight, Star, Lightbulb, Flame, Dice5, Laugh } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "criticism", label: "Criticism", emoji: "🔥", icon: Flame },
  { value: "suggestion", label: "Suggestion", emoji: "💡", icon: Lightbulb },
  { value: "praise", label: "Praise / Eulogy", emoji: "🌟", icon: Star },
  { value: "lottery", label: "Winner Numbers of Lottery", emoji: "🎰", icon: Dice5 },
  { value: "kidding", label: "Just Kidding", emoji: "😜", icon: Laugh },
];

const CHICKEN_PHRASES = [
  "Winner winner chicken dinner! 🍗",
  "Bawk bawk bawk! 🐔",
  "Cluck yeah! 🐓",
  "The chicken has spoken! 🐣",
  "Poultry perfection! 🍗🏆",
];

export default function TellUs() {
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [chickenText, setChickenText] = useState("");
  const [chickenBounce, setChickenBounce] = useState(false);
  const [rareHit, setRareHit] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message.trim()) {
      toast.error("Please select a category and write a message.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback_submissions").insert({
        category,
        name: name.trim() || null,
        email: email.trim() || null,
        message: message.trim(),
      });
      if (error) throw error;

      try {
        await supabase.functions.invoke("send-feedback-email", {
          body: { category, name: name.trim(), email: email.trim(), message: message.trim() },
        });
      } catch {
        // email delivery is best-effort
      }

      toast.success("Thank you! Your feedback has been sent. 💌");
      setCategory("");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChickenDinner = () => {
    setChickenBounce(true);
    setTimeout(() => setChickenBounce(false), 600);

    const roll = Math.random();
    if (roll < 0.001) {
      const audio = new Audio("https://cdn.freesound.org/previews/614/614427_5674468-lq.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      audioRef.current = audio;
      setChickenText("🎸 ¡Olé! You got the rare Spanish riff! 🇪🇸");
      setRareHit(true);
      setTimeout(() => setRareHit(false), 4000);
    } else {
      const audio = new Audio("https://cdn.freesound.org/previews/316/316920_5765869-lq.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audioRef.current = audio;
      setChickenText(CHICKEN_PHRASES[Math.floor(Math.random() * CHICKEN_PHRASES.length)]);
      setRareHit(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl hero-blob" />
        <div className="absolute top-1/2 -left-48 w-80 h-80 rounded-full bg-blue-300/20 blur-3xl hero-blob-2" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-blue-100/40 blur-3xl" />
      </div>

      {/* ── Invite CTA Banner ── */}
      <div className="relative overflow-hidden" style={{ background: "var(--gradient-blue-hero)" }}>
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--blue-100)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--blue-100)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-14 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-200 animate-pulse-soft" />
            <Badge className="bg-blue-500/20 text-blue-100 border-blue-400/30 backdrop-blur-sm text-xs font-semibold tracking-wider uppercase">
              Alpha Invite
            </Badge>
            <Sparkles className="h-5 w-5 text-blue-200 animate-pulse-soft" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            Join the UHS Health OS Revolution
          </h1>
          <p className="text-blue-100/80 max-w-xl mx-auto mb-8 text-base md:text-lg leading-relaxed">
            Be part of building the future of healthcare intelligence.
            Your voice shapes everything we create.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold gap-2 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-8"
            onClick={() =>
              window.open(
                "mailto:novvsoriens@gmail.com?subject=I want to join UHS Health OS",
                "_blank"
              )
            }
          >
            Request Your Invite <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* ── Page Header ── */}
        <div className="text-center space-y-3 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 text-white shadow-lg mx-auto" style={{ boxShadow: "var(--shadow-blue-glow)" }}>
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold text-blue-900">Tell Us</h2>
          <p className="text-blue-700/70 max-w-md mx-auto">
            Criticism, suggestions, praise, lottery numbers, or just a chicken dinner — we want to hear it all.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
            <Mail className="h-4 w-4" />
            <span className="font-medium">novvsoriens@gmail.com</span>
          </div>
        </div>

        {/* ── Winner Winner Chicken Dinner ── */}
        <Card className="border-0 bg-white/70 backdrop-blur-sm overflow-hidden" style={{ boxShadow: "var(--shadow-blue-soft)" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none" />
          <CardContent className="relative pt-8 pb-8 text-center space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Feeling lucky?
              </p>
              <p className="text-sm text-blue-600/70">
                99.9% chicken, 0.1% something special…
              </p>
            </div>
            <Button
              size="lg"
              className={`text-base font-bold gap-2 rounded-xl px-8 py-6 transition-all duration-300 ${
                rareHit
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-xl"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } ${chickenBounce ? "scale-110" : "scale-100"}`}
              onClick={handleChickenDinner}
            >
              <PartyPopper className="h-5 w-5" />
              Winner Winner Chicken Dinner 🍗
            </Button>
            {chickenText && (
              <div className={`animate-fade-in rounded-xl py-3 px-6 inline-block ${
                rareHit
                  ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}>
                <p className="text-lg font-semibold">{chickenText}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Category Quick-Select Chips ── */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = category === c.value;
            return (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Feedback Form ── */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-hidden" style={{ boxShadow: "var(--shadow-blue-soft)" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-blue-900">Send Us Your Thoughts</CardTitle>
            <CardDescription className="text-blue-600/60">
              Pick a category above and let us know what's on your mind. All messages arrive at{" "}
              <span className="font-medium text-blue-700">novvsoriens@gmail.com</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category (hidden select synced with chips) */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-blue-800">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="bg-blue-50/50 border-blue-200 focus:ring-blue-400">
                    <SelectValue placeholder="What kind of message?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-800">Your Name <span className="text-blue-400 text-xs">(optional)</span></Label>
                <Input
                  id="name"
                  placeholder="How should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="bg-blue-50/50 border-blue-200 focus-visible:ring-blue-400 placeholder:text-blue-300"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-800">Your Email <span className="text-blue-400 text-xs">(optional)</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="So we can reply"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="bg-blue-50/50 border-blue-200 focus-visible:ring-blue-400 placeholder:text-blue-300"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-blue-800">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Write your criticism, suggestion, praise, lottery numbers, or whatever you feel like…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  required
                  className="bg-blue-50/50 border-blue-200 focus-visible:ring-blue-400 placeholder:text-blue-300 resize-none"
                />
                <p className="text-xs text-blue-400 text-right">{message.length}/2000</p>
              </div>

              <Button
                type="submit"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-base font-semibold transition-all duration-300"
                disabled={submitting}
              >
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-blue-400 pb-6">
          All feedback is stored securely and sent to novvsoriens@gmail.com.
          We read everything — yes, even the lottery numbers.
        </p>
      </div>
    </div>
  );
}
