export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_research_pipeline: {
        Row: {
          academic_review_requested_at: string | null
          academic_reviewer_email: string | null
          ai_factcheck_passed: boolean | null
          ai_verification_notes: string | null
          ai_verification_score: number | null
          auto_approved: boolean | null
          content_type: string | null
          created_at: string
          disease_area: string | null
          evidence_grade: string | null
          evidence_level: string | null
          generated_content: string | null
          generated_summary: string | null
          generated_tags: string[] | null
          generated_title: string | null
          id: string
          judge_confidence: number | null
          judge_decision: string | null
          judge_reasoning: string | null
          priority: number | null
          requires_human_review: boolean | null
          research_sources: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          search_query: string | null
          sentinel_flagged: boolean | null
          sentinel_flags: Json | null
          sentinel_last_check: string | null
          source_count: number | null
          specialty: string | null
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_review_requested_at?: string | null
          academic_reviewer_email?: string | null
          ai_factcheck_passed?: boolean | null
          ai_verification_notes?: string | null
          ai_verification_score?: number | null
          auto_approved?: boolean | null
          content_type?: string | null
          created_at?: string
          disease_area?: string | null
          evidence_grade?: string | null
          evidence_level?: string | null
          generated_content?: string | null
          generated_summary?: string | null
          generated_tags?: string[] | null
          generated_title?: string | null
          id?: string
          judge_confidence?: number | null
          judge_decision?: string | null
          judge_reasoning?: string | null
          priority?: number | null
          requires_human_review?: boolean | null
          research_sources?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          search_query?: string | null
          sentinel_flagged?: boolean | null
          sentinel_flags?: Json | null
          sentinel_last_check?: string | null
          source_count?: number | null
          specialty?: string | null
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_review_requested_at?: string | null
          academic_reviewer_email?: string | null
          ai_factcheck_passed?: boolean | null
          ai_verification_notes?: string | null
          ai_verification_score?: number | null
          auto_approved?: boolean | null
          content_type?: string | null
          created_at?: string
          disease_area?: string | null
          evidence_grade?: string | null
          evidence_level?: string | null
          generated_content?: string | null
          generated_summary?: string | null
          generated_tags?: string[] | null
          generated_title?: string | null
          id?: string
          judge_confidence?: number | null
          judge_decision?: string | null
          judge_reasoning?: string | null
          priority?: number | null
          requires_human_review?: boolean | null
          research_sources?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          search_query?: string | null
          sentinel_flagged?: boolean | null
          sentinel_flags?: Json | null
          sentinel_last_check?: string | null
          source_count?: number | null
          specialty?: string | null
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_review_logs: {
        Row: {
          action: string
          confidence_score: number | null
          created_at: string
          decision: string | null
          evidence_grade: string | null
          evidence_level: string | null
          id: string
          metadata: Json | null
          pipeline_id: string | null
          reasoning: string | null
          reviewer_type: string
        }
        Insert: {
          action: string
          confidence_score?: number | null
          created_at?: string
          decision?: string | null
          evidence_grade?: string | null
          evidence_level?: string | null
          id?: string
          metadata?: Json | null
          pipeline_id?: string | null
          reasoning?: string | null
          reviewer_type: string
        }
        Update: {
          action?: string
          confidence_score?: number | null
          created_at?: string
          decision?: string | null
          evidence_grade?: string | null
          evidence_level?: string | null
          id?: string
          metadata?: Json | null
          pipeline_id?: string | null
          reasoning?: string | null
          reviewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_review_logs_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "ai_research_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultation_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          patient_card_id: string | null
          patient_email: string | null
          patient_notes: string | null
          patient_phone: string | null
          provider_id: string
          provider_notes: string | null
          reminder_sent: boolean | null
          scheduled_date: string
          session_type: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          patient_card_id?: string | null
          patient_email?: string | null
          patient_notes?: string | null
          patient_phone?: string | null
          provider_id: string
          provider_notes?: string | null
          reminder_sent?: boolean | null
          scheduled_date: string
          session_type?: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          patient_card_id?: string | null
          patient_email?: string | null
          patient_notes?: string | null
          patient_phone?: string | null
          provider_id?: string
          provider_notes?: string | null
          reminder_sent?: boolean | null
          scheduled_date?: string
          session_type?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_sessions_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_sessions_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_comments: {
        Row: {
          content: string
          contribution_id: string
          created_at: string
          id: string
          is_edited: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          contribution_id: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          contribution_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_comments_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "contribution_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_votes: {
        Row: {
          contribution_id: string
          created_at: string
          id: string
          is_helpful: boolean
          user_id: string
        }
        Insert: {
          contribution_id: string
          created_at?: string
          id?: string
          is_helpful?: boolean
          user_id: string
        }
        Update: {
          contribution_id?: string
          created_at?: string
          id?: string
          is_helpful?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_votes_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "knowledge_contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      education_content: {
        Row: {
          author_id: string
          category: string
          content: string
          content_type: string
          created_at: string
          diagnosis_tags: string[] | null
          external_url: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          published_at: string | null
          reading_time_minutes: number | null
          slug: string
          specialty: string | null
          summary: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category: string
          content: string
          content_type?: string
          created_at?: string
          diagnosis_tags?: string[] | null
          external_url?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number | null
          slug: string
          specialty?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          content_type?: string
          created_at?: string
          diagnosis_tags?: string[] | null
          external_url?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          published_at?: string | null
          reading_time_minutes?: number | null
          slug?: string
          specialty?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          notes: string | null
          task_category: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          task_category?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          task_category?: string | null
          user_id?: string
        }
        Relationships: []
      }
      infusion_events: {
        Row: {
          created_at: string
          drug: string
          id: string
          interval_days: number
          next_date: string
          notes: string | null
          notes_encrypted: string | null
          patient_card_id: string | null
          pre_checklist: Json | null
          pre_checklist_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drug: string
          id?: string
          interval_days: number
          next_date: string
          notes?: string | null
          notes_encrypted?: string | null
          patient_card_id?: string | null
          pre_checklist?: Json | null
          pre_checklist_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drug?: string
          id?: string
          interval_days?: number
          next_date?: string
          notes?: string | null
          notes_encrypted?: string | null
          patient_card_id?: string | null
          pre_checklist?: Json | null
          pre_checklist_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "infusion_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infusion_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_contributions: {
        Row: {
          category: Database["public"]["Enums"]["contribution_category"]
          comment_count: number
          content: string
          created_at: string
          disease_area: string | null
          helpful_count: number
          id: string
          is_featured: boolean
          resource_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["contribution_status"]
          title: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          category: Database["public"]["Enums"]["contribution_category"]
          comment_count?: number
          content: string
          created_at?: string
          disease_area?: string | null
          helpful_count?: number
          id?: string
          is_featured?: boolean
          resource_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["contribution_category"]
          comment_count?: number
          content?: string
          created_at?: string
          disease_area?: string | null
          helpful_count?: number
          id?: string
          is_featured?: boolean
          resource_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      monitoring_events: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          event_type: string
          id: string
          notes: string | null
          notes_encrypted: string | null
          patient_card_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date: string
          event_type: string
          id?: string
          notes?: string | null
          notes_encrypted?: string | null
          patient_card_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          notes_encrypted?: string | null
          patient_card_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_plans: {
        Row: {
          created_at: string
          id: string
          med_class: string
          plan_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          med_class: string
          plan_json: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          med_class?: string
          plan_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_campaigns: {
        Row: {
          campaign_type: string
          completed_at: string | null
          created_at: string
          description: string | null
          email_body: string
          email_subject: string
          id: string
          name: string
          scheduled_at: string | null
          sender_email: string
          sender_name: string
          started_at: string | null
          status: string
          target_audience: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          email_body: string
          email_subject: string
          id?: string
          name: string
          scheduled_at?: string | null
          sender_email?: string
          sender_name?: string
          started_at?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          email_body?: string
          email_subject?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          sender_email?: string
          sender_name?: string
          started_at?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_contacts: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          notes: string | null
          organization: string | null
          organization_type: string | null
          position: string | null
          status: string
          tags: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          organization?: string | null
          organization_type?: string | null
          position?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          organization?: string | null
          organization_type?: string | null
          position?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_sends: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          contact_id: string
          created_at: string
          error_message: string | null
          id: string
          opened_at: string | null
          resend_message_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          contact_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          contact_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          resend_message_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_sends_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "outreach_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_templates: {
        Row: {
          body: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          subject: string
          template_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_cards: {
        Row: {
          created_at: string
          diagnosis_tags: string[] | null
          id: string
          last_visit_date: string | null
          mrn_last4: string | null
          next_followup_date: string | null
          notes: string | null
          notes_encrypted: string | null
          patient_code: string
          risk_flags: string[] | null
          therapy_tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnosis_tags?: string[] | null
          id?: string
          last_visit_date?: string | null
          mrn_last4?: string | null
          next_followup_date?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          patient_code: string
          risk_flags?: string[] | null
          therapy_tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnosis_tags?: string[] | null
          id?: string
          last_visit_date?: string | null
          mrn_last4?: string | null
          next_followup_date?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          patient_code?: string
          risk_flags?: string[] | null
          therapy_tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          institution: string | null
          linkedin_url: string | null
          specialty: string | null
          updated_at: string
          user_id: string
          verification_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          linkedin_url?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
          verification_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          linkedin_url?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
          verification_tier?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      research_topic_queue: {
        Row: {
          articles_generated: number | null
          category: string
          created_at: string
          disease_area: string | null
          id: string
          last_processed_at: string | null
          parent_topic_id: string | null
          priority: number | null
          source: string | null
          specialty: string | null
          status: string
          topic: string
        }
        Insert: {
          articles_generated?: number | null
          category: string
          created_at?: string
          disease_area?: string | null
          id?: string
          last_processed_at?: string | null
          parent_topic_id?: string | null
          priority?: number | null
          source?: string | null
          specialty?: string | null
          status?: string
          topic: string
        }
        Update: {
          articles_generated?: number | null
          category?: string
          created_at?: string
          disease_area?: string | null
          id?: string
          last_processed_at?: string | null
          parent_topic_id?: string | null
          priority?: number | null
          source?: string | null
          specialty?: string | null
          status?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_topic_queue_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "research_topic_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_sms: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message: string
          patient_card_id: string | null
          phone_number: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          source_id: string
          source_type: string
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          patient_card_id?: string | null
          phone_number: string
          reminder_type?: string
          scheduled_for: string
          sent_at?: string | null
          source_id: string
          source_type: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          patient_card_id?: string | null
          phone_number?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          source_id?: string
          source_type?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sms_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sms_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      score_entries: {
        Row: {
          calculated_score: number | null
          created_at: string
          data_json: Json
          data_json_encrypted: string | null
          id: string
          patient_card_id: string | null
          score_type: string
          user_id: string
          visit_id: string | null
        }
        Insert: {
          calculated_score?: number | null
          created_at?: string
          data_json: Json
          data_json_encrypted?: string | null
          id?: string
          patient_card_id?: string | null
          score_type: string
          user_id: string
          visit_id?: string | null
        }
        Update: {
          calculated_score?: number | null
          created_at?: string
          data_json?: Json
          data_json_encrypted?: string | null
          id?: string
          patient_card_id?: string | null
          score_type?: string
          user_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_entries_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      sentinel_alerts: {
        Row: {
          alert_type: string
          content_id: string | null
          created_at: string
          description: string
          id: string
          is_resolved: boolean | null
          pipeline_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suggested_action: string | null
        }
        Insert: {
          alert_type: string
          content_id?: string | null
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean | null
          pipeline_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          suggested_action?: string | null
        }
        Update: {
          alert_type?: string
          content_id?: string | null
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean | null
          pipeline_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentinel_alerts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "education_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentinel_alerts_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "ai_research_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          location: string | null
          notes: string | null
          shift_date: string
          shift_type: string
          start_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          shift_date: string
          shift_type: string
          start_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          shift_date?: string
          shift_type?: string
          start_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_preferences: {
        Row: {
          auto_schedule_1h: boolean
          auto_schedule_24h: boolean
          created_at: string
          default_phone_field: string | null
          id: string
          twilio_phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_schedule_1h?: boolean
          auto_schedule_24h?: boolean
          created_at?: string
          default_phone_field?: string | null
          id?: string
          twilio_phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_schedule_1h?: boolean
          auto_schedule_24h?: boolean
          created_at?: string
          default_phone_field?: string | null
          id?: string
          twilio_phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          message: string
          name: string
          updated_at: string
          user_id: string
          variables: string[]
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          name: string
          updated_at?: string
          user_id: string
          variables?: string[]
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          name?: string
          updated_at?: string
          user_id?: string
          variables?: string[]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          certification_credential: string | null
          certification_credential_encrypted: string | null
          certification_date: string | null
          certification_expiry: string | null
          certifying_body: string | null
          clinical_trial_roles: string | null
          company_name: string | null
          contributor_type: string | null
          created_at: string
          department: string | null
          documents: string[] | null
          email: string
          email_encrypted: string | null
          expertise_areas: string[] | null
          expertise_statement: string | null
          full_name: string
          full_name_encrypted: string | null
          github_username: string | null
          guideline_contributions: string | null
          id: string
          institution: string | null
          institutional_email: string | null
          institutional_email_encrypted: string | null
          license_expiry: string | null
          license_issuing_authority: string | null
          license_number: string | null
          license_number_encrypted: string | null
          license_status: string | null
          linkedin_url: string | null
          moc_status: string | null
          notable_publications: string[] | null
          orcid_id: string | null
          orcid_id_encrypted: string | null
          partnership_type: string | null
          portfolio_url: string | null
          position: string | null
          publication_count: number | null
          reviewed_at: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["verification_status"]
          submitted_at: string
          sumsub_applicant_id: string | null
          technical_expertise: string[] | null
          tier: Database["public"]["Enums"]["verification_tier"] | null
          updated_at: string
          user_id: string
          verified_at: string | null
          years_in_practice: number | null
        }
        Insert: {
          certification_credential?: string | null
          certification_credential_encrypted?: string | null
          certification_date?: string | null
          certification_expiry?: string | null
          certifying_body?: string | null
          clinical_trial_roles?: string | null
          company_name?: string | null
          contributor_type?: string | null
          created_at?: string
          department?: string | null
          documents?: string[] | null
          email: string
          email_encrypted?: string | null
          expertise_areas?: string[] | null
          expertise_statement?: string | null
          full_name: string
          full_name_encrypted?: string | null
          github_username?: string | null
          guideline_contributions?: string | null
          id?: string
          institution?: string | null
          institutional_email?: string | null
          institutional_email_encrypted?: string | null
          license_expiry?: string | null
          license_issuing_authority?: string | null
          license_number?: string | null
          license_number_encrypted?: string | null
          license_status?: string | null
          linkedin_url?: string | null
          moc_status?: string | null
          notable_publications?: string[] | null
          orcid_id?: string | null
          orcid_id_encrypted?: string | null
          partnership_type?: string | null
          portfolio_url?: string | null
          position?: string | null
          publication_count?: number | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          sumsub_applicant_id?: string | null
          technical_expertise?: string[] | null
          tier?: Database["public"]["Enums"]["verification_tier"] | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          years_in_practice?: number | null
        }
        Update: {
          certification_credential?: string | null
          certification_credential_encrypted?: string | null
          certification_date?: string | null
          certification_expiry?: string | null
          certifying_body?: string | null
          clinical_trial_roles?: string | null
          company_name?: string | null
          contributor_type?: string | null
          created_at?: string
          department?: string | null
          documents?: string[] | null
          email?: string
          email_encrypted?: string | null
          expertise_areas?: string[] | null
          expertise_statement?: string | null
          full_name?: string
          full_name_encrypted?: string | null
          github_username?: string | null
          guideline_contributions?: string | null
          id?: string
          institution?: string | null
          institutional_email?: string | null
          institutional_email_encrypted?: string | null
          license_expiry?: string | null
          license_issuing_authority?: string | null
          license_number?: string | null
          license_number_encrypted?: string | null
          license_status?: string | null
          linkedin_url?: string | null
          moc_status?: string | null
          notable_publications?: string[] | null
          orcid_id?: string | null
          orcid_id_encrypted?: string | null
          partnership_type?: string | null
          portfolio_url?: string | null
          position?: string | null
          publication_count?: number | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          submitted_at?: string
          sumsub_applicant_id?: string | null
          technical_expertise?: string[] | null
          tier?: Database["public"]["Enums"]["verification_tier"] | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          years_in_practice?: number | null
        }
        Relationships: []
      }
      visits: {
        Row: {
          actions: string[] | null
          attachments: string[] | null
          created_at: string
          disease_activity: Json | null
          disease_activity_encrypted: string | null
          id: string
          imaging: string[] | null
          labs_ordered: string[] | null
          next_steps: string | null
          next_steps_encrypted: string | null
          patient_card_id: string
          user_id: string
          visit_date: string
        }
        Insert: {
          actions?: string[] | null
          attachments?: string[] | null
          created_at?: string
          disease_activity?: Json | null
          disease_activity_encrypted?: string | null
          id?: string
          imaging?: string[] | null
          labs_ordered?: string[] | null
          next_steps?: string | null
          next_steps_encrypted?: string | null
          patient_card_id: string
          user_id: string
          visit_date?: string
        }
        Update: {
          actions?: string[] | null
          attachments?: string[] | null
          created_at?: string
          disease_activity?: Json | null
          disease_activity_encrypted?: string | null
          id?: string
          imaging?: string[] | null
          labs_ordered?: string[] | null
          next_steps?: string | null
          next_steps_encrypted?: string | null
          patient_card_id?: string
          user_id?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      infusion_events_secure: {
        Row: {
          created_at: string | null
          drug: string | null
          id: string | null
          interval_days: number | null
          next_date: string | null
          notes: string | null
          patient_card_id: string | null
          pre_checklist: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          drug?: string | null
          id?: string | null
          interval_days?: number | null
          next_date?: string | null
          notes?: never
          patient_card_id?: string | null
          pre_checklist?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          drug?: string | null
          id?: string | null
          interval_days?: number | null
          next_date?: string | null
          notes?: never
          patient_card_id?: string | null
          pre_checklist?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "infusion_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "infusion_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_events_secure: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          event_type: string | null
          id: string | null
          notes: string | null
          patient_card_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          event_type?: string | null
          id?: string | null
          notes?: never
          patient_card_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          event_type?: string | null
          id?: string | null
          notes?: never
          patient_card_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitoring_events_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_cards_secure: {
        Row: {
          created_at: string | null
          diagnosis_tags: string[] | null
          id: string | null
          last_visit_date: string | null
          mrn_last4: string | null
          next_followup_date: string | null
          notes: string | null
          patient_code: string | null
          risk_flags: string[] | null
          therapy_tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          diagnosis_tags?: string[] | null
          id?: string | null
          last_visit_date?: string | null
          mrn_last4?: string | null
          next_followup_date?: string | null
          notes?: never
          patient_code?: string | null
          risk_flags?: string[] | null
          therapy_tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          diagnosis_tags?: string[] | null
          id?: string | null
          last_visit_date?: string | null
          mrn_last4?: string | null
          next_followup_date?: string | null
          notes?: never
          patient_code?: string | null
          risk_flags?: string[] | null
          therapy_tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      score_entries_secure: {
        Row: {
          calculated_score: number | null
          created_at: string | null
          data_json: Json | null
          id: string | null
          patient_card_id: string | null
          score_type: string | null
          user_id: string | null
          visit_id: string | null
        }
        Insert: {
          calculated_score?: number | null
          created_at?: string | null
          data_json?: never
          id?: string | null
          patient_card_id?: string | null
          score_type?: string | null
          user_id?: string | null
          visit_id?: string | null
        }
        Update: {
          calculated_score?: number | null
          created_at?: string | null
          data_json?: never
          id?: string | null
          patient_card_id?: string | null
          score_type?: string | null
          user_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_entries_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_entries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests_secure: {
        Row: {
          certification_credential: string | null
          created_at: string | null
          department: string | null
          email: string | null
          expertise_areas: string[] | null
          full_name: string | null
          id: string | null
          institution: string | null
          institutional_email: string | null
          license_number: string | null
          orcid_id: string | null
          position: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          submitted_at: string | null
          tier: Database["public"]["Enums"]["verification_tier"] | null
          updated_at: string | null
          user_id: string | null
          years_in_practice: number | null
        }
        Insert: {
          certification_credential?: never
          created_at?: string | null
          department?: string | null
          email?: never
          expertise_areas?: string[] | null
          full_name?: never
          id?: string | null
          institution?: string | null
          institutional_email?: never
          license_number?: never
          orcid_id?: never
          position?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["verification_tier"] | null
          updated_at?: string | null
          user_id?: string | null
          years_in_practice?: number | null
        }
        Update: {
          certification_credential?: never
          created_at?: string | null
          department?: string | null
          email?: never
          expertise_areas?: string[] | null
          full_name?: never
          id?: string | null
          institution?: string | null
          institutional_email?: never
          license_number?: never
          orcid_id?: never
          position?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          submitted_at?: string | null
          tier?: Database["public"]["Enums"]["verification_tier"] | null
          updated_at?: string | null
          user_id?: string | null
          years_in_practice?: number | null
        }
        Relationships: []
      }
      visits_secure: {
        Row: {
          actions: string[] | null
          attachments: string[] | null
          created_at: string | null
          disease_activity: Json | null
          id: string | null
          imaging: string[] | null
          labs_ordered: string[] | null
          next_steps: string | null
          patient_card_id: string | null
          user_id: string | null
          visit_date: string | null
        }
        Insert: {
          actions?: string[] | null
          attachments?: string[] | null
          created_at?: string | null
          disease_activity?: never
          id?: string | null
          imaging?: string[] | null
          labs_ordered?: string[] | null
          next_steps?: never
          patient_card_id?: string | null
          user_id?: string | null
          visit_date?: string | null
        }
        Update: {
          actions?: string[] | null
          attachments?: string[] | null
          created_at?: string | null
          disease_activity?: never
          id?: string | null
          imaging?: string[] | null
          labs_ordered?: string[] | null
          next_steps?: never
          patient_card_id?: string | null
          user_id?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_card_id_fkey"
            columns: ["patient_card_id"]
            isOneToOne: false
            referencedRelation: "patient_cards_secure"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      decrypt_sensitive_data: { Args: { p_encrypted: string }; Returns: string }
      encrypt_sensitive_data: { Args: { p_data: string }; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      contribution_category:
        | "clinical_pearl"
        | "guideline_summary"
        | "case_insight"
        | "resource"
      contribution_status: "pending" | "approved" | "rejected"
      verification_status: "pending" | "under_review" | "approved" | "rejected"
      verification_tier:
        | "bronze"
        | "silver"
        | "gold"
        | "expert"
        | "developer"
        | "partner"
        | "ultimate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      contribution_category: [
        "clinical_pearl",
        "guideline_summary",
        "case_insight",
        "resource",
      ],
      contribution_status: ["pending", "approved", "rejected"],
      verification_status: ["pending", "under_review", "approved", "rejected"],
      verification_tier: [
        "bronze",
        "silver",
        "gold",
        "expert",
        "developer",
        "partner",
        "ultimate",
      ],
    },
  },
} as const
