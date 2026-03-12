import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Sparkles, PartyPopper, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "criticism", label: "Criticism", emoji: "🔥" },
  { value: "suggestion", label: "Suggestion", emoji: "💡" },
  { value: "praise", label: "Praise / Eulogy", emoji: "🌟" },
  { value: "lottery", label: "Winner Numbers of Lottery", emoji: "🎰" },
  { value: "kidding", label: "Just Kidding", emoji: "😜" },
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

      // Also send via edge function to email
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
      // 0.1% chance — play a short royalty-free Spanish guitar riff
      // Using a public domain flamenco sample
      const audio = new Audio("https://cdn.freesound.org/previews/614/614427_5674468-lq.mp3");
      audio.volume = 0.6;
      audio.play().catch(() => {});
      audioRef.current = audio;
      setChickenText("🎸 ¡Olé! You got the rare Spanish riff! 🇪🇸");
    } else {
      // 99.9% — chicken sound
      const audio = new Audio("https://cdn.freesound.org/previews/316/316920_5765869-lq.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audioRef.current = audio;
      setChickenText(CHICKEN_PHRASES[Math.floor(Math.random() * CHICKEN_PHRASES.length)]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Invite CTA Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-6 w-6" />
            <Badge variant="secondary" className="text-sm font-semibold">
              Alpha Invite
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Join the UHS Health OS Revolution
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-6 text-lg">
            Be part of building the future of healthcare intelligence. Your voice shapes everything we create.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="font-semibold gap-2"
            onClick={() => window.open("mailto:novvsoriens@gmail.com?subject=I want to join UHS Health OS", "_blank")}
          >
            Request Your Invite <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Tell Us
          </h2>
          <p className="text-muted-foreground">
            Criticism, suggestions, praise, lottery numbers, or just a chicken dinner — we want to hear it all.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>novvsoriens@gmail.com</span>
          </div>
        </div>

        {/* Winner Winner Chicken Dinner */}
        <Card className="border-2 border-dashed border-primary/30 bg-card">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground font-medium">
              Feeling lucky? Press the button. 99.9% chicken, 0.1% something special…
            </p>
            <Button
              size="lg"
              variant="outline"
              className={`text-lg font-bold gap-2 border-primary/40 hover:bg-primary/10 transition-transform ${
                chickenBounce ? "scale-110" : "scale-100"
              }`}
              onClick={handleChickenDinner}
            >
              <PartyPopper className="h-5 w-5" />
              Winner Winner Chicken Dinner 🍗
            </Button>
            {chickenText && (
              <p className="text-lg font-semibold text-primary animate-fade-in">
                {chickenText}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Send Us Your Thoughts</CardTitle>
            <CardDescription>
              Pick a category and let us know what's on your mind. All messages arrive at{" "}
              <span className="font-medium text-foreground">novvsoriens@gmail.com</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
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
                <Label htmlFor="name">Your Name (optional)</Label>
                <Input
                  id="name"
                  placeholder="How should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Your Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="So we can reply"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Write your criticism, suggestion, praise, lottery numbers, or whatever you feel like…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          All feedback is stored securely and sent to novvsoriens@gmail.com.
          We read everything — yes, even the lottery numbers.
        </p>
      </div>
    </div>
  );
}
