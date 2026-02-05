 import { cn } from "@/lib/utils";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { Badge } from "@/components/ui/badge";
 import { CheckCircle, Shield, Award, Star } from "lucide-react";
 
 export type VerificationTier = "bronze" | "silver" | "gold" | "expert" | null;
 
 interface VerifiedBadgeProps {
   tier: VerificationTier;
   showLabel?: boolean;
   size?: "sm" | "md" | "lg";
   className?: string;
 }
 
 const tierConfig: Record<NonNullable<VerificationTier>, {
   icon: typeof CheckCircle;
   label: string;
   emoji: string;
   description: string;
   className: string;
   iconClassName: string;
 }> = {
   bronze: {
     icon: CheckCircle,
     label: "Bronze",
     emoji: "🥉",
     description: "Verified contributor with medical license + 1 credential",
     className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
     iconClassName: "text-amber-600 dark:text-amber-400",
   },
   silver: {
     icon: Shield,
     label: "Silver",
     emoji: "🥈",
     description: "Board certified + University affiliated contributor",
     className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-600",
     iconClassName: "text-slate-500 dark:text-slate-300",
   },
   gold: {
     icon: Award,
     label: "Gold",
     emoji: "🥇",
     description: "Fully verified with all 4 credential categories",
     className: "bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600",
     iconClassName: "text-yellow-600 dark:text-yellow-400",
   },
   expert: {
     icon: Star,
     label: "Expert",
     emoji: "⭐",
     description: "Gold tier + 5+ publications + guideline committee member",
     className: "bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40",
     iconClassName: "text-primary",
   },
 };
 
 const sizeConfig = {
   sm: {
     badge: "text-xs px-1.5 py-0.5 gap-1",
     icon: "h-3 w-3",
   },
   md: {
     badge: "text-sm px-2 py-0.5 gap-1.5",
     icon: "h-4 w-4",
   },
   lg: {
     badge: "text-base px-3 py-1 gap-2",
     icon: "h-5 w-5",
   },
 };
 
 export function VerifiedBadge({ 
   tier, 
   showLabel = true, 
   size = "md",
   className 
 }: VerifiedBadgeProps) {
   if (!tier) return null;
 
   const config = tierConfig[tier];
   const sizeStyles = sizeConfig[size];
   const IconComponent = config.icon;
 
   return (
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <Badge
             variant="outline"
             className={cn(
               "inline-flex items-center font-medium border cursor-default",
               config.className,
               sizeStyles.badge,
               className
             )}
           >
             <IconComponent className={cn(sizeStyles.icon, config.iconClassName)} />
             {showLabel && (
               <span>{config.emoji} {config.label}</span>
             )}
           </Badge>
         </TooltipTrigger>
         <TooltipContent>
           <p className="font-medium">{config.label} Verified Contributor</p>
           <p className="text-xs text-muted-foreground">{config.description}</p>
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 }
 
 // Icon-only version for compact displays
 export function VerifiedIcon({ 
   tier, 
   size = "md",
   className 
 }: Omit<VerifiedBadgeProps, "showLabel">) {
   if (!tier) return null;
 
   const config = tierConfig[tier];
   const sizeStyles = sizeConfig[size];
   const IconComponent = config.icon;
 
   return (
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger asChild>
           <span className={cn("inline-flex items-center", className)}>
             <IconComponent className={cn(sizeStyles.icon, config.iconClassName)} />
           </span>
         </TooltipTrigger>
         <TooltipContent>
           <p className="font-medium">{config.emoji} {config.label} Verified</p>
           <p className="text-xs text-muted-foreground">{config.description}</p>
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 }
 
 // Status badge for pending/under review states
 export function VerificationStatusBadge({ 
   status,
   size = "md",
   className 
 }: { 
   status: "pending" | "under_review" | "approved" | "rejected";
   size?: "sm" | "md" | "lg";
   className?: string;
 }) {
   const sizeStyles = sizeConfig[size];
   
   const statusConfig = {
     pending: {
       label: "Pending Review",
       className: "bg-warning/10 text-warning border-warning/30",
     },
     under_review: {
       label: "Under Review",
       className: "bg-info/10 text-info border-info/30",
     },
     approved: {
       label: "Approved",
       className: "bg-success/10 text-success border-success/30",
     },
     rejected: {
       label: "Not Approved",
       className: "bg-destructive/10 text-destructive border-destructive/30",
     },
   };
 
   const config = statusConfig[status];
 
   return (
     <Badge
       variant="outline"
       className={cn(
         "inline-flex items-center font-medium border",
         config.className,
         sizeStyles.badge,
         className
       )}
     >
       {config.label}
     </Badge>
   );
 }