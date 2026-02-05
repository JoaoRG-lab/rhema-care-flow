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
          patient_card_id: string | null
          pre_checklist: Json | null
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
          patient_card_id?: string | null
          pre_checklist?: Json | null
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
          patient_card_id?: string | null
          pre_checklist?: Json | null
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
        ]
      }
      monitoring_events: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          event_type: string
          id: string
          notes: string | null
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
      patient_cards: {
        Row: {
          created_at: string
          diagnosis_tags: string[] | null
          id: string
          last_visit_date: string | null
          mrn_last4: string | null
          next_followup_date: string | null
          notes: string | null
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
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          institution?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      score_entries: {
        Row: {
          calculated_score: number | null
          created_at: string
          data_json: Json
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
            foreignKeyName: "score_entries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
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
      visits: {
        Row: {
          actions: string[] | null
          created_at: string
          disease_activity: Json | null
          id: string
          imaging: string[] | null
          labs_ordered: string[] | null
          next_steps: string | null
          patient_card_id: string
          user_id: string
          visit_date: string
        }
        Insert: {
          actions?: string[] | null
          created_at?: string
          disease_activity?: Json | null
          id?: string
          imaging?: string[] | null
          labs_ordered?: string[] | null
          next_steps?: string | null
          patient_card_id: string
          user_id: string
          visit_date?: string
        }
        Update: {
          actions?: string[] | null
          created_at?: string
          disease_activity?: Json | null
          id?: string
          imaging?: string[] | null
          labs_ordered?: string[] | null
          next_steps?: string | null
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
