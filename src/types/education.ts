 /**
  * Education content types for patient education management
  */
 
 export type ContentType = 'article' | 'video' | 'infographic' | 'guide' | 'faq';
 
 export interface EducationContent {
   id: string;
   title: string;
   slug: string;
   summary: string | null;
   content: string;
   content_type: ContentType;
   category: string;
   diagnosis_tags: string[];
   reading_time_minutes: number | null;
   featured_image_url: string | null;
   external_url: string | null;
   is_published: boolean;
   is_featured: boolean;
   view_count: number;
   author_id: string;
   created_at: string;
   updated_at: string;
   published_at: string | null;
 }
 
 export interface CreateEducationContentInput {
   title: string;
   summary?: string;
   content: string;
   content_type: ContentType;
   category: string;
   diagnosis_tags?: string[];
   reading_time_minutes?: number;
   featured_image_url?: string;
   external_url?: string;
   is_published?: boolean;
   is_featured?: boolean;
 }
 
 export interface UpdateEducationContentInput extends Partial<CreateEducationContentInput> {
   id: string;
 }
 
 export const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
   { value: 'article', label: 'Article', icon: 'FileText' },
   { value: 'video', label: 'Video', icon: 'Video' },
   { value: 'infographic', label: 'Infographic', icon: 'Image' },
   { value: 'guide', label: 'Guide', icon: 'BookOpen' },
   { value: 'faq', label: 'FAQ', icon: 'HelpCircle' },
 ];
 
 export const EDUCATION_CATEGORIES = [
   'Disease Overview',
   'Treatment Options',
   'Lifestyle & Wellness',
   'Medication Guide',
   'Managing Symptoms',
   'Exercise & Physical Therapy',
   'Nutrition & Diet',
   'Mental Health',
   'Living with Arthritis',
   'Research & Clinical Trials',
 ] as const;
 
 export type EducationCategory = typeof EDUCATION_CATEGORIES[number];