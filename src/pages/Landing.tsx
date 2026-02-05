 import { Link } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { 
   Stethoscope, 
   Shield, 
   Activity, 
   Users, 
   Calendar,
   CheckCircle,
   ArrowRight,
   Lock
 } from 'lucide-react';
 
 const features = [
   {
     icon: Users,
     title: 'De-identified Patient Tracking',
     description: 'Track patient visits and disease activity using codes only. No PHI stored.',
   },
   {
     icon: Activity,
     title: 'Disease Activity Scores',
     description: 'Built-in calculators for DAS28, SLEDAI, BASDAI, CDAI, and more.',
   },
   {
     icon: Shield,
     title: 'Safety Monitoring',
     description: 'Automated reminders for lab monitoring, TB screening, and vaccines.',
   },
   {
     icon: Calendar,
     title: 'Infusion Coordination',
     description: 'Track biologic schedules, pre-infusion checklists, and intervals.',
   },
 ];
 
 export default function Landing() {
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
         <div className="container mx-auto px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
               <Stethoscope className="h-5 w-5 text-primary-foreground" />
             </div>
             <span className="font-semibold text-xl">RheumaFlow</span>
           </div>
           <div className="flex items-center gap-4">
             <Link to="/login">
               <Button variant="ghost" size="sm">Sign In</Button>
             </Link>
             <Link to="/signup">
               <Button size="sm">Get Started</Button>
             </Link>
           </div>
         </div>
       </header>
 
       {/* Hero */}
       <section className="pt-32 pb-20 px-6">
         <div className="container mx-auto max-w-5xl text-center">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
             <Lock className="h-4 w-4" />
             Privacy-first workflow management
           </div>
           <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
             Streamline Your{' '}
             <span className="gradient-text">Rheumatology Practice</span>
           </h1>
           <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
             A workflow companion for practicing rheumatologists. Organize clinic days, track disease activity, 
             monitor safety labs, and coordinate infusions—without storing patient identifiers.
           </p>
           <div className="flex items-center justify-center gap-4">
             <Link to="/signup">
               <Button size="lg" className="gap-2">
                 Start Free <ArrowRight className="h-4 w-4" />
               </Button>
             </Link>
             <Link to="/login">
               <Button size="lg" variant="outline">
                 Sign In
               </Button>
             </Link>
           </div>
         </div>
       </section>
 
       {/* Features */}
       <section className="py-20 px-6 bg-muted/30">
         <div className="container mx-auto max-w-6xl">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold mb-4">Built for Rheumatologists</h2>
             <p className="text-muted-foreground max-w-xl mx-auto">
               Purpose-built tools for managing chronic autoimmune conditions, biologic therapies, and complex follow-ups.
             </p>
           </div>
           <div className="grid md:grid-cols-2 gap-6">
             {features.map((feature) => (
               <div key={feature.title} className="bg-card rounded-xl p-6 border border-border shadow-soft">
                 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-accent-foreground mb-4">
                   <feature.icon className="h-6 w-6" />
                 </div>
                 <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                 <p className="text-muted-foreground">{feature.description}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* Privacy Notice */}
       <section className="py-20 px-6">
         <div className="container mx-auto max-w-4xl">
           <div className="bg-card rounded-2xl p-8 md:p-12 border border-border shadow-medium text-center">
             <Shield className="h-12 w-12 text-primary mx-auto mb-6" />
             <h2 className="text-2xl font-bold mb-4">Privacy by Design</h2>
             <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
               RheumaFlow is an organizational tool, not a medical record system. 
               We do not store patient names, CPF, phone numbers, addresses, or any direct identifiers. 
               Use optional patient codes and MRN last-4 digits for your reference only.
             </p>
             <div className="flex flex-wrap items-center justify-center gap-4">
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <CheckCircle className="h-4 w-4 text-success" />
                 No PHI storage
               </div>
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <CheckCircle className="h-4 w-4 text-success" />
                 User-defined codes
               </div>
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <CheckCircle className="h-4 w-4 text-success" />
                 Encrypted data
               </div>
             </div>
           </div>
         </div>
       </section>
 
       {/* Footer */}
       <footer className="py-8 px-6 border-t border-border">
         <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Stethoscope className="h-4 w-4" />
             RheumaFlow © {new Date().getFullYear()}
           </div>
           <p className="text-xs text-muted-foreground">
             This is an organizational tool, not a medical record system.
           </p>
         </div>
       </footer>
     </div>
   );
 }