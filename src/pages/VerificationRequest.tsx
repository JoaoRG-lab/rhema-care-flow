 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { useForm } from "react-hook-form";
 import { zodResolver } from "@hookform/resolvers/zod";
 import { z } from "zod";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Separator } from "@/components/ui/separator";
 import { Badge } from "@/components/ui/badge";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { toast } from "sonner";
 import { 
   GraduationCap, 
   Award, 
   FileCheck, 
   BookOpen, 
   Upload,
   ArrowLeft,
   Loader2,
   CheckCircle,
   Info
 } from "lucide-react";
 
 const CERTIFYING_BODIES = [
   "American Board of Internal Medicine (ABIM)",
   "Royal College of Physicians (UK)",
   "UEMS Section of Rheumatology (EU)",
   "Royal College of Physicians and Surgeons (Canada)",
   "Sociedade Brasileira de Reumatologia",
   "Other"
 ];
 
 const POSITION_TYPES = [
   "Resident/Fellow",
   "Faculty - Assistant Professor",
   "Faculty - Associate Professor",
   "Faculty - Professor",
   "Department Head/Division Chief",
   "Emeritus",
   "Clinical Instructor",
   "Research Faculty"
 ];
 
 const LICENSE_STATUS = [
   "Active - Unrestricted",
   "Active - Restricted",
   "Inactive/Retired"
 ];
 
 const EXPERTISE_AREAS = [
   "Rheumatoid Arthritis",
   "Systemic Lupus Erythematosus",
   "Spondyloarthritis",
   "Psoriatic Arthritis",
   "Vasculitis",
   "Fibromyalgia",
   "Pediatric Rheumatology",
   "Clinical Trials",
   "Ultrasound/Imaging"
 ];
 
 const verificationSchema = z.object({
   full_name: z.string().min(2, "Full name is required").max(100),
   email: z.string().email("Valid email is required"),
   
   // University Affiliation
   institution: z.string().optional(),
   department: z.string().optional(),
   position: z.string().optional(),
   institutional_email: z.string().email().optional().or(z.literal("")),
   
   // Board Certification
   certifying_body: z.string().optional(),
   certification_credential: z.string().optional(),
   certification_date: z.string().optional(),
   certification_expiry: z.string().optional(),
   moc_status: z.string().optional(),
   
   // Medical License
   license_number: z.string().optional(),
   license_issuing_authority: z.string().optional(),
   license_status: z.string().optional(),
   license_expiry: z.string().optional(),
   
   // Publications
   orcid_id: z.string().optional(),
   publication_count: z.coerce.number().min(0).optional(),
   clinical_trial_roles: z.string().optional(),
   guideline_contributions: z.string().optional(),
   
   // Experience
   years_in_practice: z.coerce.number().min(0).max(70).optional(),
   expertise_statement: z.string().max(1000).optional(),
   
   // Agreements
   accuracy_agreement: z.boolean().refine(val => val === true, "You must confirm accuracy"),
   ethics_agreement: z.boolean().refine(val => val === true, "You must agree to ethical standards"),
 });
 
 type VerificationFormData = z.infer<typeof verificationSchema>;
 
 export default function VerificationRequest() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
   const [existingRequest, setExistingRequest] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   const form = useForm<VerificationFormData>({
     resolver: zodResolver(verificationSchema),
     defaultValues: {
       full_name: "",
       email: user?.email || "",
       accuracy_agreement: false,
       ethics_agreement: false,
     },
   });
 
   // Check for existing request
   useState(() => {
     const checkExisting = async () => {
       if (!user) {
         setIsLoading(false);
         return;
       }
       
       const { data } = await supabase
         .from("verification_requests")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(1)
         .single();
       
       if (data) {
         setExistingRequest(data);
       }
       setIsLoading(false);
     };
     
     checkExisting();
   });
 
   const onSubmit = async (data: VerificationFormData) => {
     if (!user) {
       toast.error("Please log in to submit a verification request");
       return;
     }
 
     setIsSubmitting(true);
 
     try {
       const { error } = await supabase.from("verification_requests").insert({
         user_id: user.id,
         full_name: data.full_name,
         email: data.email,
         institution: data.institution || null,
         department: data.department || null,
         position: data.position || null,
         institutional_email: data.institutional_email || null,
         certifying_body: data.certifying_body || null,
         certification_credential: data.certification_credential || null,
         certification_date: data.certification_date || null,
         certification_expiry: data.certification_expiry || null,
         moc_status: data.moc_status || null,
         license_number: data.license_number || null,
         license_issuing_authority: data.license_issuing_authority || null,
         license_status: data.license_status || null,
         license_expiry: data.license_expiry || null,
         orcid_id: data.orcid_id || null,
         publication_count: data.publication_count || 0,
         clinical_trial_roles: data.clinical_trial_roles || null,
         guideline_contributions: data.guideline_contributions || null,
         years_in_practice: data.years_in_practice || null,
         expertise_areas: selectedExpertise,
         expertise_statement: data.expertise_statement || null,
       });
 
       if (error) throw error;
 
       toast.success("Verification request submitted successfully!");
       navigate("/settings");
     } catch (error: any) {
       console.error("Error submitting verification request:", error);
       toast.error(error.message || "Failed to submit verification request");
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const toggleExpertise = (area: string) => {
     setSelectedExpertise(prev => 
       prev.includes(area) 
         ? prev.filter(a => a !== area)
         : [...prev, area]
     );
   };
 
   if (!user) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center p-8">
         <Card className="max-w-md w-full">
           <CardHeader>
             <CardTitle>Authentication Required</CardTitle>
             <CardDescription>Please log in to submit a verification request.</CardDescription>
           </CardHeader>
           <CardContent>
             <Button onClick={() => navigate("/login")} className="w-full">
               Go to Login
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   if (existingRequest) {
     const statusColors: Record<string, string> = {
       pending: "bg-warning/10 text-warning border-warning/30",
       under_review: "bg-info/10 text-info border-info/30",
       approved: "bg-success/10 text-success border-success/30",
       rejected: "bg-destructive/10 text-destructive border-destructive/30",
     };
 
     return (
       <div className="min-h-screen bg-background p-8">
         <div className="max-w-2xl mx-auto">
           <Button 
             variant="ghost" 
             onClick={() => navigate("/settings")}
             className="mb-6 gap-2"
           >
             <ArrowLeft className="h-4 w-4" />
             Back to Settings
           </Button>
 
           <Card>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2">
                   <CheckCircle className="h-5 w-5 text-primary" />
                   Verification Request Submitted
                 </CardTitle>
                 <Badge className={statusColors[existingRequest.status] || ""}>
                   {existingRequest.status.replace("_", " ").toUpperCase()}
                 </Badge>
               </div>
               <CardDescription>
                 Submitted on {new Date(existingRequest.submitted_at).toLocaleDateString()}
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                   <p className="text-muted-foreground">Name</p>
                   <p className="font-medium">{existingRequest.full_name}</p>
                 </div>
                 <div>
                   <p className="text-muted-foreground">Email</p>
                   <p className="font-medium">{existingRequest.email}</p>
                 </div>
                 {existingRequest.institution && (
                   <div>
                     <p className="text-muted-foreground">Institution</p>
                     <p className="font-medium">{existingRequest.institution}</p>
                   </div>
                 )}
                 {existingRequest.certifying_body && (
                   <div>
                     <p className="text-muted-foreground">Board Certification</p>
                     <p className="font-medium">{existingRequest.certifying_body}</p>
                   </div>
                 )}
               </div>
 
               {existingRequest.tier && (
                 <div className="pt-4 border-t">
                   <p className="text-sm text-muted-foreground mb-2">Verification Tier</p>
                   <Badge variant="outline" className="text-lg px-4 py-1">
                     {existingRequest.tier === "bronze" && "🥉 Bronze"}
                     {existingRequest.tier === "silver" && "🥈 Silver"}
                     {existingRequest.tier === "gold" && "🥇 Gold"}
                     {existingRequest.tier === "expert" && "⭐ Expert"}
                   </Badge>
                 </div>
               )}
 
               {existingRequest.reviewer_notes && (
                 <Alert>
                   <Info className="h-4 w-4" />
                   <AlertDescription>
                     <strong>Reviewer Notes:</strong> {existingRequest.reviewer_notes}
                   </AlertDescription>
                 </Alert>
               )}
 
               <p className="text-sm text-muted-foreground">
                 Review typically takes 5-7 business days. You'll receive an email notification when your request is processed.
               </p>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background p-8">
       <div className="max-w-4xl mx-auto">
         <Button 
           variant="ghost" 
           onClick={() => navigate(-1)}
           className="mb-6 gap-2"
         >
           <ArrowLeft className="h-4 w-4" />
           Back
         </Button>
 
         <div className="mb-8">
           <h1 className="text-3xl font-bold tracking-tight">Contributor Verification Request</h1>
           <p className="text-muted-foreground mt-2">
             Submit your credentials to become a verified RheumaFlow contributor.
           </p>
         </div>
 
         <Alert className="mb-6">
           <Info className="h-4 w-4" />
           <AlertDescription>
             Verified contributors can add clinical insights, review disease activity scores, and edit clinical guidelines.
             Review typically takes 5-7 business days.
           </AlertDescription>
         </Alert>
 
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             {/* Personal Information */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Award className="h-5 w-5 text-primary" />
                   Personal Information
                 </CardTitle>
                 <CardDescription>Your basic contact information</CardDescription>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="full_name"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Full Name *</FormLabel>
                       <FormControl>
                         <Input placeholder="Dr. Jane Smith" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="email"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Email Address *</FormLabel>
                       <FormControl>
                         <Input type="email" placeholder="jane.smith@hospital.edu" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="years_in_practice"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Years in Practice</FormLabel>
                       <FormControl>
                         <Input type="number" min={0} max={70} placeholder="10" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             {/* University Affiliation */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <GraduationCap className="h-5 w-5 text-primary" />
                   University Affiliation
                 </CardTitle>
                 <CardDescription>Your academic institution details</CardDescription>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="institution"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Institution Name</FormLabel>
                       <FormControl>
                         <Input placeholder="University Medical Center" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="department"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Department</FormLabel>
                       <FormControl>
                         <Input placeholder="Division of Rheumatology" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="position"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Position</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select position" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {POSITION_TYPES.map(pos => (
                             <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="institutional_email"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Institutional Email</FormLabel>
                       <FormControl>
                         <Input type="email" placeholder="jsmith@university.edu" {...field} />
                       </FormControl>
                       <FormDescription>Email ending in .edu, .ac.uk, etc.</FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             {/* Board Certification */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <FileCheck className="h-5 w-5 text-primary" />
                   Board Certification
                 </CardTitle>
                 <CardDescription>Your rheumatology board certification details</CardDescription>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="certifying_body"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Certifying Body</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select certifying body" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {CERTIFYING_BODIES.map(body => (
                             <SelectItem key={body} value={body}>{body}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="certification_credential"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Credential/Certificate Number</FormLabel>
                       <FormControl>
                         <Input placeholder="ABIM-12345678" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="certification_date"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Certification Date</FormLabel>
                       <FormControl>
                         <Input type="date" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="certification_expiry"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Expiry Date</FormLabel>
                       <FormControl>
                         <Input type="date" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="moc_status"
                   render={({ field }) => (
                     <FormItem className="md:col-span-2">
                       <FormLabel>MOC/Recertification Status</FormLabel>
                       <FormControl>
                         <Input placeholder="e.g., Current, Enrolled in MOC program" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             {/* Medical License */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <FileCheck className="h-5 w-5 text-primary" />
                   Medical License
                 </CardTitle>
                 <CardDescription>Your active medical license information</CardDescription>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="license_number"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>License Number</FormLabel>
                       <FormControl>
                         <Input placeholder="MD-123456" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="license_issuing_authority"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Issuing Authority</FormLabel>
                       <FormControl>
                         <Input placeholder="State Medical Board" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="license_status"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>License Status</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select status" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {LICENSE_STATUS.map(status => (
                             <SelectItem key={status} value={status}>{status}</SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="license_expiry"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>License Expiry</FormLabel>
                       <FormControl>
                         <Input type="date" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             {/* Publications & Research */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <BookOpen className="h-5 w-5 text-primary" />
                   Publications & Research
                 </CardTitle>
                 <CardDescription>Your scholarly and research contributions</CardDescription>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="orcid_id"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>ORCID ID</FormLabel>
                       <FormControl>
                         <Input placeholder="0000-0002-1234-5678" {...field} />
                       </FormControl>
                       <FormDescription>Your ORCID researcher identifier</FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="publication_count"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>Publication Count</FormLabel>
                       <FormControl>
                         <Input type="number" min={0} placeholder="15" {...field} />
                       </FormControl>
                       <FormDescription>Peer-reviewed rheumatology publications</FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="clinical_trial_roles"
                   render={({ field }) => (
                     <FormItem className="md:col-span-2">
                       <FormLabel>Clinical Trial Roles</FormLabel>
                       <FormControl>
                         <Textarea 
                           placeholder="e.g., Principal Investigator on ACR2024 trial, Co-investigator on EULAR biologics study..."
                           {...field}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="guideline_contributions"
                   render={({ field }) => (
                     <FormItem className="md:col-span-2">
                       <FormLabel>Guideline Contributions</FormLabel>
                       <FormControl>
                         <Textarea 
                           placeholder="e.g., ACR 2021 RA Guidelines committee member, EULAR SpA task force..."
                           {...field}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             {/* Expertise Areas */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Areas of Expertise</CardTitle>
                 <CardDescription>Select all areas where you have specialized expertise</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="flex flex-wrap gap-2">
                   {EXPERTISE_AREAS.map(area => (
                     <Badge 
                       key={area}
                       variant={selectedExpertise.includes(area) ? "default" : "outline"}
                       className="cursor-pointer transition-colors"
                       onClick={() => toggleExpertise(area)}
                     >
                       {area}
                     </Badge>
                   ))}
                 </div>
               </CardContent>
             </Card>
 
             {/* Statement */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Statement of Expertise</CardTitle>
                 <CardDescription>Brief statement describing your qualifications and experience</CardDescription>
               </CardHeader>
               <CardContent>
                 <FormField
                   control={form.control}
                   name="expertise_statement"
                   render={({ field }) => (
                     <FormItem>
                       <FormControl>
                         <Textarea 
                           placeholder="Describe your clinical and research experience in rheumatology, key areas of expertise, and how you plan to contribute to RheumaFlow..."
                           className="min-h-[120px]"
                           {...field}
                         />
                       </FormControl>
                       <FormDescription>Maximum 1000 characters</FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             {/* Agreements */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Attestations</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <FormField
                   control={form.control}
                   name="accuracy_agreement"
                   render={({ field }) => (
                     <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                       <FormControl>
                         <Checkbox
                           checked={field.value}
                           onCheckedChange={field.onChange}
                         />
                       </FormControl>
                       <div className="space-y-1 leading-none">
                         <FormLabel>
                           I confirm that all information provided is accurate and truthful *
                         </FormLabel>
                         <FormDescription>
                           Providing false information may result in permanent account suspension
                         </FormDescription>
                       </div>
                     </FormItem>
                   )}
                 />
                 <FormField
                   control={form.control}
                   name="ethics_agreement"
                   render={({ field }) => (
                     <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                       <FormControl>
                         <Checkbox
                           checked={field.value}
                           onCheckedChange={field.onChange}
                         />
                       </FormControl>
                       <div className="space-y-1 leading-none">
                         <FormLabel>
                           I agree to the RheumaFlow ethical standards *
                         </FormLabel>
                         <FormDescription>
                           Including accuracy, disclosure of conflicts, patient privacy, and evidence-based contributions
                         </FormDescription>
                       </div>
                     </FormItem>
                   )}
                 />
               </CardContent>
             </Card>
 
             <div className="flex justify-end gap-4">
               <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                 Cancel
               </Button>
               <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 Submit Verification Request
               </Button>
             </div>
           </form>
         </Form>
       </div>
     </div>
   );
 }