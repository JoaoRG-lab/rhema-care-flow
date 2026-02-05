 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Calendar, Pill, FlaskConical, MessageSquare, Check } from 'lucide-react';
 import { SMS_TEMPLATES, SMSTemplate, fillTemplate, getUnfilledVariables } from '@/config/smsTemplates';
 import { cn } from '@/lib/utils';
 
 interface SMSTemplateSelectorProps {
   onSelect: (message: string) => void;
   defaultValues?: Record<string, string>;
 }
 
 const categoryIcons = {
   appointment: Calendar,
   medication: Pill,
   lab: FlaskConical,
   general: MessageSquare,
 };
 
 const categoryLabels = {
   appointment: 'Appointments',
   medication: 'Medications',
   lab: 'Lab Work',
   general: 'General',
 };
 
 export function SMSTemplateSelector({ onSelect, defaultValues = {} }: SMSTemplateSelectorProps) {
   const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
   const [variableValues, setVariableValues] = useState<Record<string, string>>(defaultValues);
 
   const handleTemplateSelect = (template: SMSTemplate) => {
     setSelectedTemplate(template);
     // Pre-fill any default values
     const newValues = { ...defaultValues };
     template.variables.forEach((v) => {
       if (!newValues[v]) newValues[v] = '';
     });
     setVariableValues(newValues);
   };
 
   const handleVariableChange = (variable: string, value: string) => {
     setVariableValues((prev) => ({ ...prev, [variable]: value }));
   };
 
   const handleApply = () => {
     if (!selectedTemplate) return;
     const message = fillTemplate(selectedTemplate, variableValues);
     onSelect(message);
   };
 
   const unfilledVars = selectedTemplate ? getUnfilledVariables(selectedTemplate, variableValues) : [];
   const previewMessage = selectedTemplate ? fillTemplate(selectedTemplate, variableValues) : '';
 
   const categories = ['appointment', 'medication', 'lab', 'general'] as const;
 
   return (
     <div className="space-y-4">
       <Tabs defaultValue="appointment" className="w-full">
         <TabsList className="grid w-full grid-cols-4">
           {categories.map((cat) => {
             const Icon = categoryIcons[cat];
             return (
               <TabsTrigger key={cat} value={cat} className="gap-1 text-xs">
                 <Icon className="h-3 w-3" />
                 <span className="hidden sm:inline">{categoryLabels[cat]}</span>
               </TabsTrigger>
             );
           })}
         </TabsList>
 
         {categories.map((cat) => (
           <TabsContent key={cat} value={cat} className="mt-3">
             <ScrollArea className="h-[150px]">
               <div className="space-y-2">
                 {SMS_TEMPLATES.filter((t) => t.category === cat).map((template) => (
                   <button
                     key={template.id}
                     onClick={() => handleTemplateSelect(template)}
                     className={cn(
                       'w-full text-left p-3 rounded-lg border transition-colors',
                       selectedTemplate?.id === template.id
                         ? 'border-primary bg-primary/5'
                         : 'border-border hover:bg-muted/50'
                     )}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-sm">{template.name}</span>
                       {selectedTemplate?.id === template.id && (
                         <Check className="h-4 w-4 text-primary" />
                       )}
                     </div>
                     <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                       {template.message}
                     </p>
                   </button>
                 ))}
               </div>
             </ScrollArea>
           </TabsContent>
         ))}
       </Tabs>
 
       {selectedTemplate && (
         <Card>
           <CardContent className="p-4 space-y-4">
             <div>
               <Label className="text-xs text-muted-foreground">Fill in the details</Label>
               <div className="grid grid-cols-2 gap-2 mt-2">
                 {selectedTemplate.variables.map((variable) => (
                   <div key={variable}>
                     <Label htmlFor={variable} className="text-xs capitalize">
                       {variable.replace(/([A-Z])/g, ' $1').trim()}
                     </Label>
                     <Input
                       id={variable}
                       value={variableValues[variable] || ''}
                       onChange={(e) => handleVariableChange(variable, e.target.value)}
                       placeholder={`Enter ${variable}`}
                       className="h-8 text-sm mt-1"
                     />
                   </div>
                 ))}
               </div>
             </div>
 
             <div>
               <Label className="text-xs text-muted-foreground">Preview</Label>
               <div className="mt-1 p-3 rounded-lg bg-muted/50 text-sm">
                 {previewMessage || 'Fill in the variables to see preview'}
               </div>
               <div className="flex items-center justify-between mt-2">
                 <span className="text-xs text-muted-foreground">
                   {previewMessage.length}/160 chars ({Math.ceil(previewMessage.length / 160) || 1} SMS)
                 </span>
                 {unfilledVars.length > 0 && (
                   <Badge variant="outline" className="text-xs">
                     {unfilledVars.length} field{unfilledVars.length > 1 ? 's' : ''} remaining
                   </Badge>
                 )}
               </div>
             </div>
 
             <Button
               onClick={handleApply}
               disabled={unfilledVars.length > 0}
               className="w-full"
               size="sm"
             >
               Use This Template
             </Button>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }