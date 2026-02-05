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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Info,
  Code,
  Handshake,
  Stethoscope,
  Github,
  Globe,
  Building2
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
 
const TECHNICAL_EXPERTISE_AREAS = [
  "React/TypeScript",
  "Backend/Node.js",
  "Database/SQL",
  "Mobile Development",
  "UI/UX Design",
  "DevOps/Infrastructure",
  "Security",
  "AI/Machine Learning",
  "Healthcare IT/FHIR",
  "Data Visualization"
];

const PARTNERSHIP_TYPES = [
  "Healthcare Institution",
  "Medical Device Company",
  "Pharmaceutical Company",
  "Research Organization",
  "Professional Association",
  "Technology Vendor",
  "Academic Partner",
  "Other"
];

// Base schema for all contributor types
const baseSchema = z.object({
   full_name: z.string().min(2, "Full name is required").max(100),
   email: z.string().email("Valid email is required"),
  contributor_type: z.enum(["clinical", "developer", "partner"]),
  expertise_statement: z.string().max(1000).optional(),
  accuracy_agreement: z.boolean().refine(val => val === true, "You must confirm accuracy"),
  ethics_agreement: z.boolean().refine(val => val === true, "You must agree to ethical standards"),
});

// Clinical contributor fields
const clinicalSchema = baseSchema.extend({
  contributor_type: z.literal("clinical"),
   institution: z.string().optional(),
   department: z.string().optional(),
   position: z.string().optional(),
   institutional_email: z.string().email().optional().or(z.literal("")),
   certifying_body: z.string().optional(),
   certification_credential: z.string().optional(),
   certification_date: z.string().optional(),
   certification_expiry: z.string().optional(),
   moc_status: z.string().optional(),
   license_number: z.string().optional(),
   license_issuing_authority: z.string().optional(),
   license_status: z.string().optional(),
   license_expiry: z.string().optional(),
   orcid_id: z.string().optional(),
   publication_count: z.coerce.number().min(0).optional(),
   clinical_trial_roles: z.string().optional(),
   guideline_contributions: z.string().optional(),
   years_in_practice: z.coerce.number().min(0).max(70).optional(),
 });
 
// Developer contributor fields
const developerSchema = baseSchema.extend({
  contributor_type: z.literal("developer"),
  github_username: z.string().optional(),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  years_of_experience: z.coerce.number().min(0).max(50).optional(),
  open_source_contributions: z.string().optional(),
});

// Partner contributor fields
const partnerSchema = baseSchema.extend({
  contributor_type: z.literal("partner"),
  company_name: z.string().min(2, "Company name is required"),
  partnership_type: z.string().optional(),
  company_website: z.string().url().optional().or(z.literal("")),
  contact_role: z.string().optional(),
  partnership_goals: z.string().optional(),
});

// Combined schema using discriminated union
const verificationSchema = z.discriminatedUnion("contributor_type", [
  clinicalSchema,
  developerSchema,
  partnerSchema,
]);

type VerificationFormData = z.infer<typeof clinicalSchema> | z.infer<typeof developerSchema> | z.infer<typeof partnerSchema>;
 
 export default function VerificationRequest() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [selectedTechExpertise, setSelectedTechExpertise] = useState<string[]>([]);
  const [contributorType, setContributorType] = useState<"clinical" | "developer" | "partner">("clinical");
   const [existingRequest, setExistingRequest] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);
 
  const form = useForm<any>({
    resolver: zodResolver(
      contributorType === "clinical" ? clinicalSchema :
      contributorType === "developer" ? developerSchema : partnerSchema
    ),
     defaultValues: {
       full_name: "",
       email: user?.email || "",
      contributor_type: contributorType,
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
          .from("verification_requests_secure")
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
      const baseData = {
         user_id: user.id,
         full_name: data.full_name,
         email: data.email,
        contributor_type: contributorType,
         expertise_statement: data.expertise_statement || null,
      };

      let insertData: any = baseData;

      if (contributorType === "clinical") {
        const clinicalData = data as z.infer<typeof clinicalSchema>;
        insertData = {
          ...baseData,
          institution: clinicalData.institution || null,
          department: clinicalData.department || null,
          position: clinicalData.position || null,
          institutional_email: clinicalData.institutional_email || null,
          certifying_body: clinicalData.certifying_body || null,
          certification_credential: clinicalData.certification_credential || null,
          certification_date: clinicalData.certification_date || null,
          certification_expiry: clinicalData.certification_expiry || null,
          moc_status: clinicalData.moc_status || null,
          license_number: clinicalData.license_number || null,
          license_issuing_authority: clinicalData.license_issuing_authority || null,
          license_status: clinicalData.license_status || null,
          license_expiry: clinicalData.license_expiry || null,
          orcid_id: clinicalData.orcid_id || null,
          publication_count: clinicalData.publication_count || 0,
          clinical_trial_roles: clinicalData.clinical_trial_roles || null,
          guideline_contributions: clinicalData.guideline_contributions || null,
          years_in_practice: clinicalData.years_in_practice || null,
          expertise_areas: selectedExpertise,
        };
      } else if (contributorType === "developer") {
        const devData = data as z.infer<typeof developerSchema>;
        insertData = {
          ...baseData,
          github_username: devData.github_username || null,
          portfolio_url: devData.portfolio_url || null,
          technical_expertise: selectedTechExpertise,
        };
      } else if (contributorType === "partner") {
        const partnerData = data as z.infer<typeof partnerSchema>;
        insertData = {
          ...baseData,
          company_name: partnerData.company_name || null,
          partnership_type: partnerData.partnership_type || null,
          portfolio_url: partnerData.company_website || null,
          position: partnerData.contact_role || null,
        };
      }

      const { error } = await supabase.from("verification_requests").insert(insertData);
 
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
 
  const toggleTechExpertise = (area: string) => {
    setSelectedTechExpertise(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleContributorTypeChange = (type: "clinical" | "developer" | "partner") => {
    setContributorType(type);
    form.setValue("contributor_type", type);
    form.reset({
      full_name: form.getValues("full_name"),
      email: form.getValues("email"),
      contributor_type: type,
      accuracy_agreement: false,
      ethics_agreement: false,
    });
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
                  {existingRequest.tier === "developer" && "💻 Developer"}
                  {existingRequest.tier === "partner" && "🤝 Partner"}
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
 
          {/* Contributor Type Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Choose Your Contributor Type</CardTitle>
              <CardDescription>Select the type that best describes your contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleContributorTypeChange("clinical")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    contributorType === "clinical" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Stethoscope className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">Clinical</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Healthcare professionals, researchers, and medical educators
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleContributorTypeChange("developer")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    contributorType === "developer" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Code className="h-8 w-8 text-violet-500 mb-2" />
                  <h3 className="font-semibold">Developer</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Software engineers and designers building RheumaFlow
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleContributorTypeChange("partner")}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    contributorType === "partner" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Handshake className="h-8 w-8 text-emerald-500 mb-2" />
                  <h3 className="font-semibold">Partner</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Organizations and companies integrating with RheumaFlow
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Alert className="mb-6">
           <Info className="h-4 w-4" />
           <AlertDescription>
              {contributorType === "clinical" && "Verified clinical contributors can add clinical insights, review disease activity scores, and edit clinical guidelines."}
              {contributorType === "developer" && "Verified developers can contribute code, improve features, and help maintain the RheumaFlow platform."}
              {contributorType === "partner" && "Verified partners can integrate their services and collaborate on healthcare solutions."}
              {" "}Review typically takes 5-7 business days.
           </AlertDescription>
         </Alert>
 
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
             {/* Personal Information */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2">
                   <Award className="h-5 w-5 text-primary" />
                    {contributorType === "partner" ? "Contact Information" : "Personal Information"}
                 </CardTitle>
                  <CardDescription>
                    {contributorType === "partner" ? "Primary contact for partnership" : "Your basic contact information"}
                  </CardDescription>
               </CardHeader>
               <CardContent className="grid md:grid-cols-2 gap-4">
                 <FormField
                   control={form.control}
                   name="full_name"
                   render={({ field }) => (
                     <FormItem>
                        <FormLabel>{contributorType === "partner" ? "Contact Name *" : "Full Name *"}</FormLabel>
                       <FormControl>
                          <Input placeholder={contributorType === "clinical" ? "Dr. Jane Smith" : "Jane Smith"} {...field} />
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
                          <Input type="email" placeholder={
                            contributorType === "clinical" ? "jane.smith@hospital.edu" :
                            contributorType === "developer" ? "jane@example.com" :
                            "partnerships@company.com"
                          } {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                  {contributorType === "clinical" && (
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
                  )}
               </CardContent>
             </Card>
 
              {/* Clinical: University Affiliation */}
              {contributorType === "clinical" && (
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
              )}
 
              {/* Clinical: Board Certification */}
              {contributorType === "clinical" && (
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
              )}
 
              {/* Clinical: Medical License */}
              {contributorType === "clinical" && (
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
              )}
 
              {/* Clinical: Publications & Research */}
              {contributorType === "clinical" && (
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
              )}
 
              {/* Clinical: Expertise Areas */}
              {contributorType === "clinical" && (
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
              )}

              {/* Developer: GitHub & Portfolio */}
              {contributorType === "developer" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      Developer Profile
                    </CardTitle>
                    <CardDescription>Your development experience and portfolio</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="github_username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GitHub Username</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="octocat" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>Your GitHub profile for code review</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="portfolio_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio URL</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="https://yourportfolio.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>Personal website or portfolio</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="open_source_contributions"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Open Source Contributions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your notable open source contributions, especially in healthcare or medical software..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Developer: Technical Expertise */}
              {contributorType === "developer" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5 text-violet-500" />
                      Technical Expertise
                    </CardTitle>
                    <CardDescription>Select your areas of technical expertise</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {TECHNICAL_EXPERTISE_AREAS.map(area => (
                        <Badge 
                          key={area}
                          variant={selectedTechExpertise.includes(area) ? "default" : "outline"}
                          className="cursor-pointer transition-colors"
                          onClick={() => toggleTechExpertise(area)}
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Partner: Company Information */}
              {contributorType === "partner" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-500" />
                      Organization Details
                    </CardTitle>
                    <CardDescription>Information about your organization</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Organization Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Healthcare Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partnership_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partnership Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PARTNERSHIP_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company_website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="https://company.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Role</FormLabel>
                          <FormControl>
                            <Input placeholder="Head of Partnerships" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partnership_goals"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Partnership Goals</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe how your organization would like to collaborate with RheumaFlow and the value you can bring..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}
 
             {/* Statement */}
             <Card>
               <CardHeader>
                  <CardTitle className="text-lg">
                    {contributorType === "clinical" && "Statement of Expertise"}
                    {contributorType === "developer" && "Motivation Statement"}
                    {contributorType === "partner" && "Partnership Vision"}
                  </CardTitle>
                  <CardDescription>
                    {contributorType === "clinical" && "Brief statement describing your qualifications and experience"}
                    {contributorType === "developer" && "Tell us why you want to contribute to RheumaFlow"}
                    {contributorType === "partner" && "Describe your vision for the partnership"}
                  </CardDescription>
               </CardHeader>
               <CardContent>
                 <FormField
                   control={form.control}
                   name="expertise_statement"
                   render={({ field }) => (
                     <FormItem>
                       <FormControl>
                         <Textarea 
                            placeholder={
                              contributorType === "clinical" 
                                ? "Describe your clinical and research experience in rheumatology, key areas of expertise, and how you plan to contribute to RheumaFlow..."
                                : contributorType === "developer"
                                ? "Tell us about your background, why you're interested in healthcare technology, and what you hope to build..."
                                : "Explain your organization's mission, how you envision the partnership, and the mutual benefits..."
                            }
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