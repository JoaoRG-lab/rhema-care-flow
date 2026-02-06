 /**
  * Verification and user role types
  */
 
 // ============================================
 // VERIFICATION TIER TYPES
 // ============================================
 
export type VerificationTier = 
  | 'bronze' 
  | 'silver' 
  | 'gold' 
  | 'expert' 
  | 'developer' 
  | 'partner' 
  | 'ultimate'
  | null;
 
 export type ContributorType = 'clinical' | 'developer' | 'partner';
 
 export type VerificationStatusType = 
   | 'pending' 
   | 'under_review' 
   | 'approved' 
   | 'rejected' 
   | null;
 
 // ============================================
 // VERIFICATION REQUEST TYPES
 // ============================================
 
 export interface VerificationRequest {
   id: string;
   user_id: string;
   full_name: string;
   email: string;
   contributor_type: ContributorType | null;
   institution: string | null;
   department: string | null;
   position: string | null;
   years_in_practice: number | null;
   license_number: string | null;
   license_issuing_authority: string | null;
   license_status: string | null;
   license_expiry: string | null;
   certification_credential: string | null;
   certifying_body: string | null;
   certification_date: string | null;
   certification_expiry: string | null;
   moc_status: string | null;
   institutional_email: string | null;
   orcid_id: string | null;
   expertise_areas: string[] | null;
   expertise_statement: string | null;
   publication_count: number | null;
   notable_publications: string[] | null;
   clinical_trial_roles: string | null;
   guideline_contributions: string | null;
   github_username: string | null;
   portfolio_url: string | null;
   technical_expertise: string[] | null;
   company_name: string | null;
   partnership_type: string | null;
   documents: string[] | null;
   status: VerificationStatusType;
   tier: VerificationTier;
   reviewer_notes: string | null;
   submitted_at: string;
   reviewed_at: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface VerificationStatusState {
   status: VerificationStatusType;
   tier: VerificationTier;
   contributorType: ContributorType | null;
   fullName: string | null;
   loading: boolean;
 }
 
 // ============================================
 // USER ROLE TYPES
 // ============================================
 
 export type AppRole = 'admin' | 'moderator' | 'user';
 
 export interface UserRole {
   id: string;
   user_id: string;
   role: AppRole;
   granted_by: string | null;
   created_at: string;
 }
 
 // ============================================
 // AUDIT LOG TYPES
 // ============================================
 
 export interface AuditLog {
   id: string;
   user_id: string;
   action: string;
   resource_type: string;
   resource_id: string | null;
   metadata: Record<string, unknown> | null;
   ip_address: string | null;
   user_agent: string | null;
   created_at: string;
 }
 
 export interface AuditLogInput {
   action: string;
   resourceType: string;
   resourceId?: string;
   metadata?: Record<string, unknown>;
 }