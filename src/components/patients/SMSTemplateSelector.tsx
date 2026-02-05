 import { useState } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Calendar, Pill, FlaskConical, MessageSquare, Check, Plus, Trash2, Save, Star } from 'lucide-react';
 import { SMS_TEMPLATES, SMSTemplate, fillTemplate, getUnfilledVariables } from '@/config/smsTemplates';
 import { useSmsTemplates, extractVariables, CustomSMSTemplate } from '@/hooks/useSmsTemplates';
 import { cn } from '@/lib/utils';
 
 interface SMSTemplateSelectorProps {
   onSelect: (message: string) => void;
   defaultValues?: Record<string, string>;
 }
 
 type TemplateCategory = 'appointment' | 'medication' | 'lab' | 'general';
 
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
   const { templates: customTemplates, createTemplate, deleteTemplate } = useSmsTemplates();
   const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | CustomSMSTemplate | null>(null);
   const [isCustom, setIsCustom] = useState(false);
   const [variableValues, setVariableValues] = useState<Record<string, string>>(defaultValues);
   const [showCreateDialog, setShowCreateDialog] = useState(false);
   const [newTemplate, setNewTemplate] = useState({
     name: '',
     category: 'general' as TemplateCategory,
     message: '',
   });
 
   const handleTemplateSelect = (template: SMSTemplate | CustomSMSTemplate, custom: boolean = false) => {
     setSelectedTemplate(template);
     setIsCustom(custom);
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
     const message = fillTemplate(selectedTemplate as SMSTemplate, variableValues);
     onSelect(message);
   };
 
   const handleSaveAsTemplate = async () => {
     if (!selectedTemplate) return;
     await createTemplate({
       name: `${selectedTemplate.name} (Copy)`,
       category: selectedTemplate.category as TemplateCategory,
       message: selectedTemplate.message,
       variables: selectedTemplate.variables,
     });
   };
 
   const handleCreateTemplate = async () => {
     const variables = extractVariables(newTemplate.message);
     await createTemplate({
       name: newTemplate.name,
       category: newTemplate.category,
       message: newTemplate.message,
       variables,
     });
     setNewTemplate({ name: '', category: 'general', message: '' });
     setShowCreateDialog(false);
   };
 
   const handleDeleteCustomTemplate = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     await deleteTemplate(id);
     if (selectedTemplate && 'user_id' in selectedTemplate && selectedTemplate.id === id) {
       setSelectedTemplate(null);
     }
   };
 
   const unfilledVars = selectedTemplate ? getUnfilledVariables(selectedTemplate as SMSTemplate, variableValues) : [];
   const previewMessage = selectedTemplate ? fillTemplate(selectedTemplate as SMSTemplate, variableValues) : '';
 
   const categories = ['appointment', 'medication', 'lab', 'general'] as const;
 
   const getTemplatesForCategory = (cat: TemplateCategory) => {
     const builtIn = SMS_TEMPLATES.filter(t => t.category === cat);
     const custom = customTemplates.filter(t => t.category === cat);
     return { builtIn, custom };
   };
 
   return (
     <div className="space-y-4">
       <div className="flex justify-end">
         <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
           <DialogTrigger asChild>
             <Button variant="outline" size="sm" className="gap-1">
               <Plus className="h-3 w-3" />
               Create Template
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Create Custom Template</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 mt-4">
               <div>
                 <Label htmlFor="templateName">Template Name</Label>
                 <Input
                   id="templateName"
                   value={newTemplate.name}
                   onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="e.g., My Custom Reminder"
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label htmlFor="templateCategory">Category</Label>
                 <Select
                   value={newTemplate.category}
                   onValueChange={(v) => setNewTemplate(prev => ({ ...prev, category: v as TemplateCategory }))}
                 >
                   <SelectTrigger className="mt-1">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     {categories.map(cat => (
                       <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label htmlFor="templateMessage">Message</Label>
                 <Textarea
                   id="templateMessage"
                   value={newTemplate.message}
                   onChange={(e) => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                   placeholder="Use {{variableName}} for dynamic values"
                   rows={4}
                   className="mt-1"
                 />
                 <p className="text-xs text-muted-foreground mt-1">
                   Variables detected: {extractVariables(newTemplate.message).join(', ') || 'None'}
                 </p>
               </div>
               <Button 
                 onClick={handleCreateTemplate} 
                 disabled={!newTemplate.name || !newTemplate.message}
                 className="w-full"
               >
                 <Save className="h-4 w-4 mr-2" />
                 Save Template
               </Button>
             </div>
           </DialogContent>
         </Dialog>
       </div>
 
       <Tabs defaultValue="appointment" className="w-full">
         <TabsList className="grid w-full grid-cols-4">
           {categories.map((cat) => {
             const Icon = categoryIcons[cat];
             const customCount = customTemplates.filter(t => t.category === cat).length;
             return (
               <TabsTrigger key={cat} value={cat} className="gap-1 text-xs">
                 <Icon className="h-3 w-3" />
                 <span className="hidden sm:inline">{categoryLabels[cat]}</span>
                 {customCount > 0 && (
                   <Badge variant="secondary" className="h-4 w-4 p-0 text-[10px] ml-1">
                     {customCount}
                   </Badge>
                 )}
               </TabsTrigger>
             );
           })}
         </TabsList>
 
         {categories.map((cat) => (
           <TabsContent key={cat} value={cat} className="mt-3">
             <ScrollArea className="h-[200px]">
               <div className="space-y-2">
                 {getTemplatesForCategory(cat).custom.length > 0 && (
                   <>
                     <div className="flex items-center gap-2 mb-2">
                       <Star className="h-3 w-3 text-warning" />
                       <span className="text-xs font-medium text-muted-foreground">My Templates</span>
                     </div>
                     {getTemplatesForCategory(cat).custom.map((template) => (
                       <button
                         key={template.id}
                         onClick={() => handleTemplateSelect(template, true)}
                         className={cn(
                           'w-full text-left p-3 rounded-lg border transition-colors relative group',
                           selectedTemplate?.id === template.id && isCustom
                             ? 'border-primary bg-primary/5'
                             : 'border-border hover:bg-muted/50'
                         )}
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <Star className="h-3 w-3 text-warning" />
                             <span className="font-medium text-sm">{template.name}</span>
                           </div>
                           <div className="flex items-center gap-1">
                             {selectedTemplate?.id === template.id && isCustom && (
                               <Check className="h-4 w-4 text-primary" />
                             )}
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                               onClick={(e) => handleDeleteCustomTemplate(template.id, e)}
                             >
                               <Trash2 className="h-3 w-3 text-destructive" />
                             </Button>
                           </div>
                         </div>
                         <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                           {template.message}
                         </p>
                       </button>
                     ))}
                     <div className="border-t my-3" />
                   </>
                 )}
 
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-xs font-medium text-muted-foreground">Built-in Templates</span>
                 </div>
                 {getTemplatesForCategory(cat).builtIn.map((template) => (
                   <button
                     key={template.id}
                     onClick={() => handleTemplateSelect(template, false)}
                     className={cn(
                       'w-full text-left p-3 rounded-lg border transition-colors',
                       selectedTemplate?.id === template.id && !isCustom
                         ? 'border-primary bg-primary/5'
                         : 'border-border hover:bg-muted/50'
                     )}
                   >
                     <div className="flex items-center justify-between">
                       <span className="font-medium text-sm">{template.name}</span>
                       {selectedTemplate?.id === template.id && !isCustom && (
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
 
             {selectedTemplate && !isCustom && (
               <Button
                 variant="outline"
                 size="sm"
                 className="w-full gap-1"
                 onClick={handleSaveAsTemplate}
               >
                 <Star className="h-3 w-3" />
                 Save as My Template
               </Button>
             )}
           </CardContent>
         </Card>
       )}
     </div>
   );
 }