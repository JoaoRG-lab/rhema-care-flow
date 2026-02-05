 import { cn } from '@/lib/utils';
 
 const tagStyles: Record<string, string> = {
   RA: 'tag-ra',
   SLE: 'tag-sle',
   SpA: 'tag-spa',
   PsA: 'tag-psa',
   Vasculitis: 'tag-vasculitis',
   FM: 'tag-fm',
   biologic: 'tag-biologic',
   infusion: 'tag-infusion',
   pregnancy: 'tag-pregnancy',
   infection: 'tag-infection',
 };
 
 interface DiagnosisTagProps {
   tag: string;
   size?: 'sm' | 'md';
   onClick?: () => void;
   selected?: boolean;
 }
 
 export function DiagnosisTag({ tag, size = 'sm', onClick, selected }: DiagnosisTagProps) {
   const styleClass = tagStyles[tag] || 'bg-muted text-muted-foreground border-border';
   
   return (
     <span
       onClick={onClick}
       className={cn(
         'inline-flex items-center rounded-full border font-medium',
         size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
         styleClass,
         onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
         selected && 'ring-2 ring-primary ring-offset-1'
       )}
     >
       {tag}
     </span>
   );
 }