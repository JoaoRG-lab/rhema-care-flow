 import { usePersona, Persona } from '@/contexts/PersonaContext';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { Stethoscope, GraduationCap, Heart, ChevronDown } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 const personas: { id: Persona; label: string; icon: typeof Stethoscope; description: string }[] = [
   { id: 'clinical', label: 'Clinical', icon: Stethoscope, description: 'Day-to-day clinic workflow' },
   { id: 'academic', label: 'Academic', icon: GraduationCap, description: 'Research & publications' },
   { id: 'patient', label: 'Patient', icon: Heart, description: 'Track your health' },
 ];
 
 interface PersonaSwitcherProps {
   variant?: 'sidebar' | 'header';
 }
 
 export function PersonaSwitcher({ variant = 'sidebar' }: PersonaSwitcherProps) {
   const { persona, setPersona } = usePersona();
   const current = personas.find((p) => p.id === persona)!;
 
   if (variant === 'header') {
     return (
       <DropdownMenu>
         <DropdownMenuTrigger asChild>
           <Button variant="outline" size="sm" className="gap-2">
             <current.icon className="h-4 w-4" />
             <span className="hidden sm:inline">{current.label}</span>
             <ChevronDown className="h-3 w-3" />
           </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
           {personas.map((p) => (
             <DropdownMenuItem
               key={p.id}
               onClick={() => setPersona(p.id)}
               className={cn(persona === p.id && 'bg-accent')}
             >
               <p.icon className="mr-2 h-4 w-4" />
               <div>
                 <p className="font-medium">{p.label}</p>
                 <p className="text-xs text-muted-foreground">{p.description}</p>
               </div>
             </DropdownMenuItem>
           ))}
         </DropdownMenuContent>
       </DropdownMenu>
     );
   }
 
   return (
     <div className="px-3 py-2 space-y-1">
       <p className="text-xs font-medium text-sidebar-foreground/50 px-3 mb-2">View Mode</p>
       {personas.map((p) => (
         <button
           key={p.id}
           onClick={() => setPersona(p.id)}
           className={cn(
             'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
             persona === p.id
               ? 'bg-sidebar-primary text-sidebar-primary-foreground'
               : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
           )}
         >
           <p.icon className="h-4 w-4" />
           <span>{p.label}</span>
         </button>
       ))}
     </div>
   );
 }