export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          gig_id: string
          id: string
          status: Database["public"]["Enums"]["application_status"]
          worker_id: string
        }
        Insert: {
          created_at?: string
          gig_id: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          worker_id: string
        }
        Update: {
          created_at?: string
          gig_id?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          actor_id: string | null
          created_at: string
          event: string
          gig_id: string | null
          id: number
          match_id: string | null
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event: string
          gig_id?: string | null
          id?: never
          match_id?: string | null
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event?: string
          gig_id?: string | null
          id?: never
          match_id?: string | null
          payload?: Json
        }
        Relationships: []
      }
      billable_events: {
        Row: {
          amount: number
          created_at: string
          event_type: string
          id: number
          match_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          event_type?: string
          id?: never
          match_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          event_type?: string
          id?: never
          match_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billable_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          detail: string
          id: number
          match_id: string
          opener_id: string
          reason: string
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: never
          match_id: string
          opener_id: string
          reason: string
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          created_at?: string
          detail?: string
          id?: never
          match_id?: string
          opener_id?: string
          reason?: string
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opener_id_fkey"
            columns: ["opener_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gigs: {
        Row: {
          area: string
          created_at: string
          description: string
          duration: string
          employer_id: string
          expires_at: string
          id: string
          lat: number
          lng: number
          pay: number
          slots: number
          status: Database["public"]["Enums"]["gig_status"]
          title: string
          type: Database["public"]["Enums"]["gig_type"]
          when_label: string
        }
        Insert: {
          area: string
          created_at?: string
          description?: string
          duration?: string
          employer_id: string
          expires_at?: string
          id?: string
          lat: number
          lng: number
          pay: number
          slots?: number
          status?: Database["public"]["Enums"]["gig_status"]
          title: string
          type: Database["public"]["Enums"]["gig_type"]
          when_label: string
        }
        Update: {
          area?: string
          created_at?: string
          description?: string
          duration?: string
          employer_id?: string
          expires_at?: string
          id?: string
          lat?: number
          lng?: number
          pay?: number
          slots?: number
          status?: Database["public"]["Enums"]["gig_status"]
          title?: string
          type?: Database["public"]["Enums"]["gig_type"]
          when_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "gigs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          uses_left: number
        }
        Insert: {
          code: string
          created_at?: string
          uses_left?: number
        }
        Update: {
          code?: string
          created_at?: string
          uses_left?: number
        }
        Relationships: []
      }
      match_pins: {
        Row: {
          attempts: number
          issued_at: string
          locked_until: string | null
          match_id: string
          pin_hash: string
        }
        Insert: {
          attempts?: number
          issued_at?: string
          locked_until?: string | null
          match_id: string
          pin_hash: string
        }
        Update: {
          attempts?: number
          issued_at?: string
          locked_until?: string | null
          match_id?: string
          pin_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_pins_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          application_id: string
          arrived_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          employer_id: string
          gig_id: string
          id: string
          pin_issued_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          worker_id: string
        }
        Insert: {
          application_id: string
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          employer_id: string
          gig_id: string
          id?: string
          pin_issued_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          worker_id: string
        }
        Update: {
          application_id?: string
          arrived_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          employer_id?: string
          gig_id?: string
          id?: string
          pin_issued_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_gig_id_fkey"
            columns: ["gig_id"]
            isOneToOne: false
            referencedRelation: "gigs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: number
          match_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: never
          match_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: never
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: Database["public"]["Enums"]["app_role"]
          area: string | null
          business_name: string | null
          cancel_count: number
          created_at: string
          employer_verified: boolean
          full_name: string
          id: string
          jobs_completed: number
          lat: number | null
          lng: number | null
          no_show_count: number
          onboarded: boolean
          rating_count: number
          rating_sum: number
          skills: string[]
        }
        Insert: {
          active_role?: Database["public"]["Enums"]["app_role"]
          area?: string | null
          business_name?: string | null
          cancel_count?: number
          created_at?: string
          employer_verified?: boolean
          full_name?: string
          id: string
          jobs_completed?: number
          lat?: number | null
          lng?: number | null
          no_show_count?: number
          onboarded?: boolean
          rating_count?: number
          rating_sum?: number
          skills?: string[]
        }
        Update: {
          active_role?: Database["public"]["Enums"]["app_role"]
          area?: string | null
          business_name?: string | null
          cancel_count?: number
          created_at?: string
          employer_verified?: boolean
          full_name?: string
          id?: string
          jobs_completed?: number
          lat?: number | null
          lng?: number | null
          no_show_count?: number
          onboarded?: boolean
          rating_count?: number
          rating_sum?: number
          skills?: string[]
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          match_id: string
          ratee_id: string
          rater_id: string
          stars: number
          tags: string[]
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          match_id: string
          ratee_id: string
          rater_id: string
          stars: number
          tags?: string[]
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          match_id?: string
          ratee_id?: string
          rater_id?: string
          stars?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_ratee_id_fkey"
            columns: ["ratee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_stale_gigs: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "worker" | "employer"
      application_status: "APPLIED" | "SELECTED" | "REJECTED" | "WITHDRAWN"
      dispute_status: "OPEN" | "RESOLVED"
      gig_status:
        | "POSTED"
        | "MATCHED"
        | "COMPLETED"
        | "CLOSED"
        | "CANCELLED"
        | "EXPIRED"
      gig_type: "Cleaning" | "Laundry" | "Delivery" | "Errands"
      match_status:
        | "MATCHED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "NO_SHOW"
        | "CANCELLED"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["worker", "employer"],
      application_status: ["APPLIED", "SELECTED", "REJECTED", "WITHDRAWN"],
      dispute_status: ["OPEN", "RESOLVED"],
      gig_status: [
        "POSTED",
        "MATCHED",
        "COMPLETED",
        "CLOSED",
        "CANCELLED",
        "EXPIRED",
      ],
      gig_type: ["Cleaning", "Laundry", "Delivery", "Errands"],
      match_status: [
        "MATCHED",
        "IN_PROGRESS",
        "COMPLETED",
        "NO_SHOW",
        "CANCELLED",
      ],
    },
  },
} as const

