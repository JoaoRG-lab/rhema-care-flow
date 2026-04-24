import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Send, 
  Users, 
  Sparkles, 
  Globe,
  BookOpen, 
  CheckCircle,
  Loader2,
  GraduationCap,
  Building2,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const societies = [
  'American College of Rheumatology (ACR)',
  'European Alliance of Associations for Rheumatology (EULAR)',
  'Asia Pacific League of Associations for Rheumatology (APLAR)',
  'Pan-American League of Associations for Rheumatology (PANLAR)',
  'Brazilian Society of Rheumatology (SBR)',
  'British Society for Rheumatology (BSR)',
  'Japanese College of Rheumatology (JCR)',
  'Indian Rheumatology Association (IRA)',
  'Other National/Regional Society',
];

const roles = [
  'Society President/Chair',
  'Board Member',
  'Committee Chair',
  'Education Director',
  'Research Director',
  'Guidelines Committee',
  'Department Head',
  'Professor/Academic Lead',
  'Clinical Director',
  'Other Leadership Role',
];

interface AlphaInviteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlphaInvite({ open, onOpenChange }: AlphaInviteProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    society: '',
    role: '',
    institution: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.society || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('alpha_invites').insert({
        name: formData.name,
        email: formData.email,
        society: formData.society,
        role: formData.role,
        institution: formData.institution || null,
        message: formData.message || null,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Thank you! Your request has been submitted.');
    } catch (err) {
      toast.error('Erro ao enviar — tente novamente');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Request Received!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in shaping the future of rheumatology knowledge. 
              Our team will reach out to you shortly with exclusive alpha access details.
            </p>
            <Button onClick={() => { setSubmitted(false); onOpenChange(false); }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Join the Alpha Program
          </DialogTitle>
          <DialogDescription>
            Be among the first leaders to shape the future of rheumatology knowledge aggregation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="leader@society.org"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rheumatology Society *</Label>
            <Select 
              value={formData.society} 
              onValueChange={(v) => setFormData({ ...formData, society: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your society" />
              </SelectTrigger>
              <SelectContent>
                {societies.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Leadership Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="University/Hospital"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Why are you interested? (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Share your vision for how we can transform rheumatology knowledge..."
              rows={3}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              Request Alpha Access
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AlphaCTASectionProps {
  onOpenInvite: () => void;
}

export function AlphaCTASection({ onOpenInvite }: AlphaCTASectionProps) {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[hsl(170_25%_12%)] via-[hsl(168_30%_15%)] to-[hsl(170_28%_10%)] text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(168_55%_45%)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[hsl(42_85%_55%)]/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto max-w-5xl relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4 text-[hsl(42_85%_55%)]" />
            Exclusive Alpha Program
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Calling All{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(168_55%_50%)] to-[hsl(42_85%_55%)]">
              Rheumatology Leaders
            </span>
          </h2>

          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-8 leading-relaxed">
            We're building a revolutionary knowledge aggregation platform that will transform 
            how rheumatology guidelines, research, and clinical wisdom are organized, accessed, 
            and evolved. <strong className="text-white">And we need your expertise to shape it.</strong>
          </p>
        </div>

        {/* Vision Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Globe className="h-10 w-10 text-[hsl(168_55%_50%)] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Global Collaboration</h3>
            <p className="text-sm text-white/60">
              Unite knowledge from ACR, EULAR, APLAR, and societies worldwide in one living platform.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <BookOpen className="h-10 w-10 text-[hsl(42_85%_55%)] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Living Guidelines</h3>
            <p className="text-sm text-white/60">
              Transform static PDFs into interactive, always-updated clinical decision support.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Users className="h-10 w-10 text-[hsl(280_55%_60%)] mb-4" />
            <h3 className="text-lg font-semibold mb-2">Expert Curation</h3>
            <p className="text-sm text-white/60">
              Society-endorsed content with transparent provenance and continuous peer review.
            </p>
          </div>
        </div>

        {/* Who we're looking for */}
        <div className="bg-white/5 rounded-2xl p-8 mb-12 border border-white/10">
          <h3 className="text-xl font-semibold text-center mb-6">Who Should Join the Alpha?</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Award, label: 'Society Presidents & Chairs' },
              { icon: GraduationCap, label: 'Education Committee Leaders' },
              { icon: Building2, label: 'Academic Department Heads' },
              { icon: BookOpen, label: 'Guidelines Authors' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <Icon className="h-5 w-5 text-[hsl(168_55%_50%)] shrink-0" />
                <span className="text-sm text-white/80">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={onOpenInvite}
            className="h-14 px-10 text-lg gap-3 bg-gradient-to-r from-[hsl(168_55%_45%)] to-[hsl(42_85%_55%)] hover:opacity-90 text-white shadow-xl"
          >
            <Send className="h-5 w-5" />
            Request Alpha Access
          </Button>
          <p className="text-sm text-white/50 mt-4">
            Limited spots available • Direct access to founding team • Shape the platform
          </p>
        </div>
      </div>
    </section>
  );
}
