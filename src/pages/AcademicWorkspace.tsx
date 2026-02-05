 import { useState, useEffect } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   BookOpen,
   FileText,
   Download,
   ExternalLink,
   Users,
   FlaskConical,
   Search,
   Plus,
   TrendingUp,
   Award,
 } from 'lucide-react';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { format } from 'date-fns';
 
 // ACR/EULAR guideline links
 const GUIDELINES = [
   { name: 'ACR/EULAR RA 2025', url: 'https://rheumatology.org/clinical-practice-guidelines', category: 'RA' },
   { name: 'EULAR SpA Recommendations', url: 'https://www.eular.org/recommendations-management', category: 'SpA' },
   { name: 'OARSI OA Guidelines', url: 'https://oarsi.org/education/oarsi-guidelines', category: 'OA' },
   { name: 'ACR Lupus Nephritis', url: 'https://rheumatology.org/clinical-practice-guidelines', category: 'SLE' },
   { name: 'EULAR Vasculitis', url: 'https://www.eular.org/recommendations-management', category: 'Vasculitis' },
 ];
 
 export default function AcademicWorkspace() {
   const { user } = useAuth();
   const [patientCount, setPatientCount] = useState(0);
   const [scoreCount, setScoreCount] = useState(0);
   const [searchQuery, setSearchQuery] = useState('');
 
   useEffect(() => {
     if (!user) return;
     const fetchStats = async () => {
       const [patients, scores] = await Promise.all([
         supabase.from('patient_cards_secure').select('id', { count: 'exact' }).eq('user_id', user.id),
         supabase.from('score_entries_secure').select('id', { count: 'exact' }).eq('user_id', user.id),
       ]);
       setPatientCount(patients.count || 0);
       setScoreCount(scores.count || 0);
     };
     fetchStats();
   }, [user]);
 
   const handleExportData = async (type: 'patients' | 'scores') => {
     if (!user) return;
     
     const { data, error } = await supabase
       .from(type === 'patients' ? 'patient_cards_secure' : 'score_entries_secure')
       .select('*')
       .eq('user_id', user.id);
     
     if (error || !data) return;
 
     // Anonymize and export as CSV
     const anonymized = data.map((row, idx) => ({
       ...row,
       id: `SUBJ_${String(idx + 1).padStart(4, '0')}`,
       patient_code: undefined,
       user_id: undefined,
     }));
 
     const csv = [
       Object.keys(anonymized[0] || {}).join(','),
       ...anonymized.map(row => Object.values(row).map(v => 
         typeof v === 'object' ? JSON.stringify(v) : v
       ).join(',')),
     ].join('\n');
 
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `rheumaflow_${type}_${format(new Date(), 'yyyyMMdd')}.csv`;
     a.click();
   };
 
   const filteredGuidelines = GUIDELINES.filter(g => 
     g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     g.category.toLowerCase().includes(searchQuery.toLowerCase())
   );
 
   return (
     <AppLayout>
       <div className="p-4 md:p-6 lg:p-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div>
             <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
               <BookOpen className="h-6 w-6 text-primary" />
               Academic Workspace
             </h1>
             <p className="text-muted-foreground text-sm">Research, publications, and data management</p>
           </div>
         </div>
 
         <Tabs defaultValue="research" className="w-full">
           <TabsList className="grid w-full grid-cols-4 mb-6">
             <TabsTrigger value="research">Research Data</TabsTrigger>
             <TabsTrigger value="publications">Publications</TabsTrigger>
             <TabsTrigger value="trials">Clinical Trials</TabsTrigger>
             <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
           </TabsList>
 
           {/* Research Data Tab */}
           <TabsContent value="research" className="space-y-4">
             <div className="grid md:grid-cols-3 gap-4">
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base flex items-center gap-2">
                     <Users className="h-4 w-4" />
                     Patient Cohort
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-3xl font-bold">{patientCount}</p>
                   <p className="text-sm text-muted-foreground">De-identified records</p>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="mt-3 w-full"
                     onClick={() => handleExportData('patients')}
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Export CSV
                   </Button>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base flex items-center gap-2">
                     <TrendingUp className="h-4 w-4" />
                     Disease Activity Scores
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-3xl font-bold">{scoreCount}</p>
                   <p className="text-sm text-muted-foreground">Longitudinal measurements</p>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="mt-3 w-full"
                     onClick={() => handleExportData('scores')}
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Export CSV
                   </Button>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base flex items-center gap-2">
                     <FileText className="h-4 w-4" />
                     Data Dictionary
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground mb-3">
                     Standardized variable definitions for your research datasets
                   </p>
                   <Button variant="outline" size="sm" className="w-full">
                     <Download className="h-4 w-4 mr-2" />
                     Download Codebook
                   </Button>
                 </CardContent>
               </Card>
             </div>
 
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Export Settings</CardTitle>
                 <CardDescription>Configure data export preferences for IRB compliance</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Date Range</label>
                     <div className="flex gap-2">
                       <Input type="date" className="flex-1" />
                       <Input type="date" className="flex-1" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Diagnoses</label>
                     <div className="flex flex-wrap gap-1">
                       {['RA', 'SLE', 'SpA', 'PsA'].map(dx => (
                         <Badge key={dx} variant="outline" className="cursor-pointer hover:bg-accent">
                           {dx}
                         </Badge>
                       ))}
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Publications Tab */}
           <TabsContent value="publications" className="space-y-4">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-base flex items-center gap-2">
                       <Award className="h-4 w-4" />
                       Your Publications
                     </CardTitle>
                     <CardDescription>Track your research output and citations</CardDescription>
                   </div>
                   <Button size="sm" className="gap-2">
                     <Plus className="h-4 w-4" />
                     Add Publication
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="text-center py-8 text-muted-foreground">
                   <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                   <p>Connect your ORCID to import publications</p>
                   <Button variant="outline" size="sm" className="mt-3">
                     <ExternalLink className="h-4 w-4 mr-2" />
                     Connect ORCID
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Clinical Trials Tab */}
           <TabsContent value="trials" className="space-y-4">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="text-base flex items-center gap-2">
                       <FlaskConical className="h-4 w-4" />
                       Clinical Trial Management
                     </CardTitle>
                     <CardDescription>Track study protocols and enrollment</CardDescription>
                   </div>
                   <Button size="sm" className="gap-2">
                     <Plus className="h-4 w-4" />
                     New Study
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="text-center py-8 text-muted-foreground">
                   <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-50" />
                   <p>No active clinical trials</p>
                   <p className="text-sm mt-1">Create a study to track enrollment and outcomes</p>
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Guidelines Tab */}
           <TabsContent value="guidelines" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Clinical Practice Guidelines</CardTitle>
                 <CardDescription>Quick access to ACR/EULAR recommendations</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="relative mb-4">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                     placeholder="Search guidelines..." 
                     className="pl-9"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   {filteredGuidelines.map((guide) => (
                     <a
                       key={guide.name}
                       href={guide.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                     >
                       <div className="flex items-center gap-3">
                         <BookOpen className="h-4 w-4 text-primary" />
                         <span className="font-medium text-sm">{guide.name}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline">{guide.category}</Badge>
                         <ExternalLink className="h-4 w-4 text-muted-foreground" />
                       </div>
                     </a>
                   ))}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </AppLayout>
   );
 }