 import { Link } from 'react-router-dom';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { VerifiedBadge, type VerificationTier } from '@/components/ui/VerifiedBadge';
 import {
   Calculator,
   Users,
   FileText,
   Shield,
   Sparkles,
   ClipboardCheck,
   Calendar,
   Activity,
   BookOpen,
   Settings,
   BadgeCheck,
   ArrowRight,
 } from 'lucide-react';
 
 interface QuickAction {
   label: string;
   description: string;
   icon: React.ElementType;
   href: string;
   variant?: 'default' | 'outline';
 }
 
 interface WelcomeCardProps {
   tier: VerificationTier;
   fullName: string | null;
 }
 
 // Define actions available to each tier (cumulative - higher tiers get all lower tier actions)
 const TIER_ACTIONS: Record<string, QuickAction[]> = {
   unverified: [
     {
       label: 'Get Verified',
       description: 'Unlock full features',
       icon: BadgeCheck,
       href: '/verification-request',
       variant: 'default',
     },
     {
       label: 'Calculate Scores',
       description: 'Disease activity tools',
       icon: Calculator,
       href: '/scores',
     },
     {
       label: 'View Patients',
       description: 'Patient cards',
       icon: Users,
       href: '/patients',
     },
   ],
   bronze: [
     {
       label: 'Calculate Scores',
       description: 'All calculators unlocked',
       icon: Calculator,
       href: '/scores',
       variant: 'default',
     },
     {
       label: 'Patient Cards',
       description: 'Manage your roster',
       icon: Users,
       href: '/patients',
     },
     {
       label: 'Monitoring',
       description: 'Lab & safety tracking',
       icon: ClipboardCheck,
       href: '/monitoring',
     },
     {
       label: 'Calendar',
       description: 'Schedule shifts',
       icon: Calendar,
       href: '/calendar',
     },
   ],
   silver: [
     {
       label: 'Advanced Scores',
       description: 'Full calculator suite',
       icon: Activity,
       href: '/scores',
       variant: 'default',
     },
     {
       label: 'Patient Cards',
       description: 'Extended patient data',
       icon: Users,
       href: '/patients',
     },
     {
       label: 'Infusions',
       description: 'Biologic scheduling',
       icon: ClipboardCheck,
       href: '/infusions',
     },
     {
       label: 'Focus Timer',
       description: 'Productivity sessions',
       icon: Sparkles,
       href: '/focus',
     },
   ],
   gold: [
     {
       label: 'Expert Calculators',
       description: 'Classification criteria',
       icon: Calculator,
       href: '/scores',
       variant: 'default',
     },
     {
       label: 'Patient Registry',
       description: 'Full patient management',
       icon: Users,
       href: '/patients',
     },
     {
       label: 'Clinical Monitoring',
       description: 'Safety protocols',
       icon: Shield,
       href: '/monitoring',
     },
     {
       label: 'Documentation',
       description: 'Clinical guidelines',
       icon: BookOpen,
       href: '/scores',
     },
   ],
   expert: [
     {
       label: 'Full Calculator Suite',
       description: 'All scores & criteria',
       icon: Activity,
       href: '/scores',
       variant: 'default',
     },
     {
       label: 'Patient Analytics',
       description: 'Advanced insights',
       icon: Users,
       href: '/patients',
     },
     {
       label: 'Admin Panel',
       description: 'Review submissions',
       icon: Shield,
       href: '/admin',
     },
     {
       label: 'Settings',
       description: 'Customize experience',
       icon: Settings,
       href: '/settings',
     },
   ],
   developer: [
     {
       label: 'Style Guide',
       description: 'Design system docs',
       icon: FileText,
       href: '/style-guide',
       variant: 'default',
     },
     {
       label: 'Calculators',
       description: 'Test implementations',
       icon: Calculator,
       href: '/scores',
     },
     {
       label: 'Components',
       description: 'UI component library',
       icon: BookOpen,
       href: '/style-guide',
     },
     {
       label: 'Settings',
       description: 'Dev configuration',
       icon: Settings,
       href: '/settings',
     },
   ],
   partner: [
     {
       label: 'Dashboard Overview',
       description: 'Platform metrics',
       icon: Activity,
       href: '/dashboard',
       variant: 'default',
     },
     {
       label: 'Clinical Tools',
       description: 'All calculators',
       icon: Calculator,
       href: '/scores',
     },
     {
       label: 'Documentation',
       description: 'Integration guides',
       icon: BookOpen,
       href: '/style-guide',
     },
     {
       label: 'Settings',
       description: 'Partner preferences',
       icon: Settings,
       href: '/settings',
     },
   ],
 };
 
 const TIER_MESSAGES: Record<string, { title: string; subtitle: string }> = {
   unverified: {
     title: 'Welcome to RheumaFlow',
     subtitle: 'Verify your credentials to unlock all features and join our clinical community.',
   },
   bronze: {
     title: 'Bronze Member',
     subtitle: 'You have access to core clinical tools. Keep contributing to level up!',
   },
   silver: {
     title: 'Silver Member',
     subtitle: 'Enhanced access unlocked. Your contributions are making a difference.',
   },
   gold: {
     title: 'Gold Member',
     subtitle: 'Full clinical access granted. Thank you for your verified expertise.',
   },
   expert: {
     title: 'Expert Contributor',
     subtitle: 'Your expertise shapes our community. All features are at your fingertips.',
   },
   developer: {
     title: 'Developer Access',
     subtitle: 'Full platform access for development and testing purposes.',
   },
   partner: {
     title: 'Partner Account',
     subtitle: 'Welcome to our partnership program. Explore our clinical solutions.',
   },
 };
 
 export function WelcomeCard({ tier, fullName }: WelcomeCardProps) {
   const tierKey = tier || 'unverified';
   const actions = TIER_ACTIONS[tierKey] || TIER_ACTIONS.unverified;
   const message = TIER_MESSAGES[tierKey] || TIER_MESSAGES.unverified;
 
   return (
     <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
       <CardContent className="pt-6">
         <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
           {/* Left: Welcome Message */}
           <div className="space-y-2">
             <div className="flex items-center gap-3">
               <h2 className="text-xl font-semibold text-foreground">{message.title}</h2>
               {tier && <VerifiedBadge tier={tier} size="sm" showLabel />}
             </div>
             <p className="text-muted-foreground text-sm max-w-md">
               {message.subtitle}
             </p>
             {!tier && (
               <div className="pt-2">
                 <Badge variant="outline" className="text-xs">
                   <Sparkles className="h-3 w-3 mr-1" />
                   Complete verification to unlock all features
                 </Badge>
               </div>
             )}
           </div>
 
           {/* Right: Quick Actions Grid */}
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
             {actions.map((action) => {
               const Icon = action.icon;
               return (
                 <Link key={action.label} to={action.href}>
                   <Button
                     variant={action.variant || 'outline'}
                     className="w-full h-auto flex-col items-center justify-center gap-1 py-3 px-2"
                   >
                     <Icon className="h-5 w-5" />
                     <span className="text-xs font-medium">{action.label}</span>
                   </Button>
                 </Link>
               );
             })}
           </div>
         </div>
 
         {/* Bottom: Tier-specific CTA */}
         {!tier && (
           <div className="mt-6 pt-4 border-t border-border/50">
             <Link to="/verification-request">
               <Button className="gap-2">
                 <BadgeCheck className="h-4 w-4" />
                 Start Verification
                 <ArrowRight className="h-4 w-4" />
               </Button>
             </Link>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }