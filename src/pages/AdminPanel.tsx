 import { useState, useEffect } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Shield, Users, BadgeCheck, Clock, CheckCircle, XCircle, 
    Eye, FileText, ExternalLink, Mail, Building, Calendar,
    AlertTriangle, Loader2, Download
  } from 'lucide-react';
 import { useUserRole } from '@/hooks/useUserRole';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import { VerifiedBadge, VerificationStatusBadge, type VerificationTier } from '@/components/ui/VerifiedBadge';
 import { Navigate } from 'react-router-dom';
 
 interface VerificationRequest {
   id: string;
   user_id: string;
   full_name: string;
   email: string;
   contributor_type: string | null;
   institution: string | null;
   department: string | null;
   position: string | null;
   years_in_practice: number | null;
   license_number: string | null;
   license_issuing_authority: string | null;
   certification_credential: string | null;
   certifying_body: string | null;
   expertise_areas: string[] | null;
   publication_count: number | null;
   notable_publications: string[] | null;
   expertise_statement: string | null;
   documents: string[] | null;
   status: 'pending' | 'under_review' | 'approved' | 'rejected';
   tier: VerificationTier;
   submitted_at: string;
   reviewed_at: string | null;
   reviewer_notes: string | null;
   github_username: string | null;
   portfolio_url: string | null;
   company_name: string | null;
   partnership_type: string | null;
   technical_expertise: string[] | null;
 }
 
 const TIER_OPTIONS: { value: VerificationTier; label: string }[] = [
   { value: 'bronze', label: 'Bronze' },
   { value: 'silver', label: 'Silver' },
   { value: 'gold', label: 'Gold' },
   { value: 'expert', label: 'Expert' },
   { value: 'developer', label: 'Developer' },
   { value: 'partner', label: 'Partner' },
 ];
 
 export default function AdminPanel() {
   const { user } = useAuth();
   const { isAdmin, loading: roleLoading } = useUserRole();
   const [requests, setRequests] = useState<VerificationRequest[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
   const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
   const [selectedTier, setSelectedTier] = useState<VerificationTier>(null);
   const [reviewerNotes, setReviewerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('pending');
  const [exporting, setExporting] = useState(false);

  const handleAuditExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-data-export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uhs-audit-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Audit data exported successfully (PII encrypted)');
    } catch (error: any) {
      console.error('Audit export failed:', error);
      toast.error(error.message || 'Failed to export audit data');
    } finally {
      setExporting(false);
    }
  };
 
   useEffect(() => {
     if (isAdmin) {
       fetchRequests();
     }
   }, [isAdmin]);
 
   const fetchRequests = async () => {
     try {
       setLoading(true);
        // Use base table for admin - admins need all fields and have proper RLS access
       const { data, error } = await supabase
          .from('verification_requests')
         .select('*')
         .order('submitted_at', { ascending: false });
 
       if (error) throw error;
       setRequests(data as VerificationRequest[]);
     } catch (error) {
       console.error('Error fetching requests:', error);
       toast.error('Failed to load verification requests');
     } finally {
       setLoading(false);
     }
   };
 
   const openReviewDialog = (request: VerificationRequest) => {
     setSelectedRequest(request);
     setSelectedTier(request.tier);
     setReviewerNotes(request.reviewer_notes || '');
     setReviewDialogOpen(true);
   };
 
   const handleStatusUpdate = async (newStatus: 'under_review' | 'approved' | 'rejected') => {
     if (!selectedRequest) return;
 
     if (newStatus === 'approved' && !selectedTier) {
       toast.error('Please select a verification tier');
       return;
     }
 
     setSubmitting(true);
     try {
       const { error } = await supabase
         .from('verification_requests')
         .update({
           status: newStatus,
           tier: newStatus === 'approved' ? selectedTier : null,
           reviewer_notes: reviewerNotes,
           reviewed_at: new Date().toISOString(),
         })
         .eq('id', selectedRequest.id);
 
       if (error) throw error;
 
       toast.success(`Request ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'marked for review'}`);
       setReviewDialogOpen(false);
       fetchRequests();
     } catch (error) {
       console.error('Error updating request:', error);
       toast.error('Failed to update request');
     } finally {
       setSubmitting(false);
     }
   };
 
   const filteredRequests = requests.filter(r => 
     filter === 'all' ? true : r.status === filter
   );
 
   const stats = {
     pending: requests.filter(r => r.status === 'pending').length,
     under_review: requests.filter(r => r.status === 'under_review').length,
     approved: requests.filter(r => r.status === 'approved').length,
     rejected: requests.filter(r => r.status === 'rejected').length,
   };
 
   // Access control
   if (roleLoading) {
     return (
       <AppLayout>
         <div className="flex items-center justify-center min-h-[60vh]">
           <Loader2 className="h-8 w-8 animate-spin text-primary" />
         </div>
       </AppLayout>
     );
   }
 
   if (!isAdmin) {
     return <Navigate to="/dashboard" replace />;
   }
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage verification requests and user roles</p>
            </div>
            <Button onClick={handleAuditExport} disabled={exporting} variant="outline" size="sm" className="gap-2 self-start">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Exporting...' : 'Export Audit Data'}
            </Button>
          </div>
 
         {/* Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           <Card className="cursor-pointer hover:border-warning transition-colors" onClick={() => setFilter('pending')}>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <Clock className="h-8 w-8 text-warning" />
                 <div>
                   <p className="text-2xl font-bold">{stats.pending}</p>
                   <p className="text-xs text-muted-foreground">Pendente</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="cursor-pointer hover:border-info transition-colors" onClick={() => setFilter('under_review')}>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <Eye className="h-8 w-8 text-info" />
                 <div>
                   <p className="text-2xl font-bold">{stats.under_review}</p>
                   <p className="text-xs text-muted-foreground">Em Revisão</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="cursor-pointer hover:border-success transition-colors" onClick={() => setFilter('approved')}>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <CheckCircle className="h-8 w-8 text-success" />
                 <div>
                   <p className="text-2xl font-bold">{stats.approved}</p>
                   <p className="text-xs text-muted-foreground">Aprovado</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card className="cursor-pointer hover:border-destructive transition-colors" onClick={() => setFilter('rejected')}>
             <CardContent className="pt-4">
               <div className="flex items-center gap-3">
                 <XCircle className="h-8 w-8 text-destructive" />
                 <div>
                   <p className="text-2xl font-bold">{stats.rejected}</p>
                   <p className="text-xs text-muted-foreground">Rejeitado</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Filter tabs */}
         <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-4">
           <TabsList>
             <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
             <TabsTrigger value="pending">Pendente ({stats.pending})</TabsTrigger>
             <TabsTrigger value="under_review">Em Revisão ({stats.under_review})</TabsTrigger>
             <TabsTrigger value="approved">Aprovado ({stats.approved})</TabsTrigger>
             <TabsTrigger value="rejected">Rejeitado ({stats.rejected})</TabsTrigger>
           </TabsList>
         </Tabs>
 
         {/* Requests list */}
         {loading ? (
           <div className="flex items-center justify-center py-12">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         ) : filteredRequests.length === 0 ? (
           <Card>
             <CardContent className="py-12 text-center">
               <BadgeCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
               <h3 className="text-lg font-semibold mb-2">No requests found</h3>
               <p className="text-muted-foreground">
                 {filter === 'all' 
                   ? 'No verification requests have been submitted yet.'
                   : `No ${filter.replace('_', ' ')} requests.`}
               </p>
             </CardContent>
           </Card>
         ) : (
           <div className="space-y-3">
             {filteredRequests.map((request) => (
               <Card key={request.id} className="hover:border-primary/50 transition-colors">
                 <CardContent className="py-4">
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-semibold truncate">{request.full_name}</h3>
                         <VerificationStatusBadge status={request.status} size="sm" />
                         {request.tier && <VerifiedBadge tier={request.tier} size="sm" />}
                       </div>
                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                         <span className="flex items-center gap-1">
                           <Mail className="h-3.5 w-3.5" />
                           {request.email}
                         </span>
                         {request.institution && (
                           <span className="flex items-center gap-1">
                             <Building className="h-3.5 w-3.5" />
                             {request.institution}
                           </span>
                         )}
                         <span className="flex items-center gap-1">
                           <Calendar className="h-3.5 w-3.5" />
                           {format(new Date(request.submitted_at), 'MMM d, yyyy')}
                         </span>
                       </div>
                       <div className="flex flex-wrap gap-1.5 mt-2">
                         <Badge variant="outline" className="text-xs">
                           {request.contributor_type || 'clinical'}
                         </Badge>
                         {request.position && (
                           <Badge variant="secondary" className="text-xs">{request.position}</Badge>
                         )}
                         {request.years_in_practice && (
                           <Badge variant="secondary" className="text-xs">{request.years_in_practice} years</Badge>
                         )}
                       </div>
                     </div>
                     <Button onClick={() => openReviewDialog(request)}>
                       <Eye className="h-4 w-4 mr-2" />
                       Review
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
 
         {/* Review Dialog */}
         <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <BadgeCheck className="h-5 w-5" />
                 Review Verification Request
               </DialogTitle>
               <DialogDescription>
                 Review the applicant's credentials and make a decision.
               </DialogDescription>
             </DialogHeader>
 
             {selectedRequest && (
               <ScrollArea className="flex-1 pr-4">
                 <div className="space-y-6">
                   {/* Applicant Info */}
                   <div>
                     <h4 className="font-semibold mb-3 flex items-center gap-2">
                       <Users className="h-4 w-4" />
                       Applicant Information
                     </h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <Label className="text-muted-foreground">Nome Completo</Label>
                         <p className="font-medium">{selectedRequest.full_name}</p>
                       </div>
                       <div>
                         <Label className="text-muted-foreground">E-mail</Label>
                         <p className="font-medium">{selectedRequest.email}</p>
                       </div>
                       <div>
                         <Label className="text-muted-foreground">Tipo de Contribuidor</Label>
                         <p className="font-medium capitalize">{selectedRequest.contributor_type || 'Clinical'}</p>
                       </div>
                       <div>
                         <Label className="text-muted-foreground">Enviado em</Label>
                         <p className="font-medium">{format(new Date(selectedRequest.submitted_at), 'PPp')}</p>
                       </div>
                     </div>
                   </div>
 
                   {/* Professional Info */}
                   {(selectedRequest.institution || selectedRequest.position) && (
                     <div>
                       <h4 className="font-semibold mb-3 flex items-center gap-2">
                         <Building className="h-4 w-4" />
                         Professional Details
                       </h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         {selectedRequest.institution && (
                           <div>
                             <Label className="text-muted-foreground">Instituição</Label>
                             <p className="font-medium">{selectedRequest.institution}</p>
                           </div>
                         )}
                         {selectedRequest.department && (
                           <div>
                             <Label className="text-muted-foreground">Departamento</Label>
                             <p className="font-medium">{selectedRequest.department}</p>
                           </div>
                         )}
                         {selectedRequest.position && (
                           <div>
                             <Label className="text-muted-foreground">Cargo</Label>
                             <p className="font-medium">{selectedRequest.position}</p>
                           </div>
                         )}
                         {selectedRequest.years_in_practice && (
                           <div>
                             <Label className="text-muted-foreground">Years in Practice</Label>
                             <p className="font-medium">{selectedRequest.years_in_practice}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
 
                   {/* Credentials */}
                   {(selectedRequest.license_number || selectedRequest.certification_credential) && (
                     <div>
                       <h4 className="font-semibold mb-3 flex items-center gap-2">
                         <BadgeCheck className="h-4 w-4" />
                         Credentials
                       </h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         {selectedRequest.license_number && (
                           <div>
                             <Label className="text-muted-foreground">Número de Registro</Label>
                             <p className="font-medium">{selectedRequest.license_number}</p>
                           </div>
                         )}
                         {selectedRequest.license_issuing_authority && (
                           <div>
                             <Label className="text-muted-foreground">Órgão Emissor</Label>
                             <p className="font-medium">{selectedRequest.license_issuing_authority}</p>
                           </div>
                         )}
                         {selectedRequest.certification_credential && (
                           <div>
                             <Label className="text-muted-foreground">Certificação</Label>
                             <p className="font-medium">{selectedRequest.certification_credential}</p>
                           </div>
                         )}
                         {selectedRequest.certifying_body && (
                           <div>
                             <Label className="text-muted-foreground">Entidade Certificadora</Label>
                             <p className="font-medium">{selectedRequest.certifying_body}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
 
                   {/* Expertise */}
                   {(selectedRequest.expertise_areas?.length || selectedRequest.expertise_statement) && (
                     <div>
                       <h4 className="font-semibold mb-3">Especialização</h4>
                       {selectedRequest.expertise_areas && selectedRequest.expertise_areas.length > 0 && (
                         <div className="flex flex-wrap gap-1.5 mb-3">
                           {selectedRequest.expertise_areas.map((area, i) => (
                             <Badge key={i} variant="secondary">{area}</Badge>
                           ))}
                         </div>
                       )}
                       {selectedRequest.expertise_statement && (
                         <p className="text-sm text-muted-foreground">{selectedRequest.expertise_statement}</p>
                       )}
                     </div>
                   )}
 
                   {/* Publications */}
                   {(selectedRequest.publication_count || selectedRequest.notable_publications?.length) && (
                     <div>
                       <h4 className="font-semibold mb-3 flex items-center gap-2">
                         <FileText className="h-4 w-4" />
                         Publications
                       </h4>
                       {selectedRequest.publication_count && (
                         <p className="text-sm mb-2">
                           <span className="font-medium">{selectedRequest.publication_count}</span> publications
                         </p>
                       )}
                       {selectedRequest.notable_publications && selectedRequest.notable_publications.length > 0 && (
                         <ul className="text-sm text-muted-foreground space-y-1">
                           {selectedRequest.notable_publications.map((pub, i) => (
                             <li key={i} className="truncate">• {pub}</li>
                           ))}
                         </ul>
                       )}
                     </div>
                   )}
 
                   {/* Documents */}
                   {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                     <div>
                       <h4 className="font-semibold mb-3 flex items-center gap-2">
                         <FileText className="h-4 w-4" />
                         Uploaded Documents ({selectedRequest.documents.length})
                       </h4>
                       <div className="space-y-2">
                         {selectedRequest.documents.map((doc, i) => (
                           <div key={i} className="flex items-center gap-2 text-sm">
                             <FileText className="h-4 w-4 text-muted-foreground" />
                             <span className="truncate flex-1">{doc.split('/').pop()}</span>
                             <Button variant="ghost" size="sm" asChild>
                               <a href={doc} target="_blank" rel="noopener noreferrer">
                                 <ExternalLink className="h-3.5 w-3.5" />
                               </a>
                             </Button>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
 
                   {/* Review Section */}
                   <div className="border-t pt-6">
                     <h4 className="font-semibold mb-3">Decisão</h4>
                     
                     <div className="space-y-4">
                       <div>
                         <Label>Nível de Verificação</Label>
                         <Select value={selectedTier || ''} onValueChange={(v) => setSelectedTier(v as VerificationTier)}>
                           <SelectTrigger className="mt-1.5">
                             <SelectValue placeholder="Selecionar nível para aprovação" />
                           </SelectTrigger>
                           <SelectContent>
                             {TIER_OPTIONS.map((option) => (
                               <SelectItem key={option.value} value={option.value!}>
                                 <div className="flex items-center gap-2">
                                   {option.label}
                                 </div>
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
 
                       <div>
                         <Label>Notas do Revisor</Label>
                         <Textarea
                           value={reviewerNotes}
                           onChange={(e) => setReviewerNotes(e.target.value)}
                           placeholder="Adicione notas sobre sua decisão (visível apenas para admins)"
                           className="mt-1.5"
                           rows={3}
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               </ScrollArea>
             )}
 
             <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
               {selectedRequest?.status === 'pending' && (
                 <Button
                   variant="outline"
                   onClick={() => handleStatusUpdate('under_review')}
                   disabled={submitting}
                 >
                   <Eye className="h-4 w-4 mr-2" />
                   Mark Under Review
                 </Button>
               )}
               <Button
                 variant="destructive"
                 onClick={() => handleStatusUpdate('rejected')}
                 disabled={submitting}
               >
                 <XCircle className="h-4 w-4 mr-2" />
                 Reject
               </Button>
               <Button
                 onClick={() => handleStatusUpdate('approved')}
                 disabled={submitting || !selectedTier}
               >
                 {submitting ? (
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 ) : (
                   <CheckCircle className="h-4 w-4 mr-2" />
                 )}
                 Approve
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     </AppLayout>
   );
 }