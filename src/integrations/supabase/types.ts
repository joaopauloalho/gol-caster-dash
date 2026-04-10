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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          city: string
          created_at: string
          date: string
          flag_a: string
          flag_b: string
          group_name: string
          id: number
          match_number: number
          stage: string
          team_a: string
          team_b: string
          time: string
        }
        Insert: {
          city: string
          created_at?: string
          date: string
          flag_a?: string
          flag_b?: string
          group_name: string
          id?: number
          match_number: number
          stage: string
          team_a: string
          team_b: string
          time: string
        }
        Update: {
          city?: string
          created_at?: string
          date?: string
          flag_a?: string
          flag_b?: string
          group_name?: string
          id?: number
          match_number?: number
          stage?: string
          team_a?: string
          team_b?: string
          time?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          amount: number
          avatar_url: string | null
          birth_date: string
          bonus_points: number
          city: string
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
          payment_confirmed: boolean
          plan: string
          referral_code: string
          referred_by: string | null
          state: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          amount?: number
          avatar_url?: string | null
          birth_date: string
          bonus_points?: number
          city?: string
          cpf: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          payment_confirmed?: boolean
          plan?: string
          referral_code?: string
          referred_by?: string | null
          state?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          amount?: number
          avatar_url?: string | null
          birth_date?: string
          bonus_points?: number
          city?: string
          cpf?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          payment_confirmed?: boolean
          plan?: string
          referral_code?: string
          referred_by?: string | null
          state?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_status: string
          plan: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_status?: string
          plan?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_status?: string
          plan?: string
          user_id?: string
        }
        Relationships: []
      }
      // Manually added — not auto-generated
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: number
          home_score: number | null
          away_score: number | null
          winner_pick: string | null
          goal_first_half: boolean | null
          goal_second_half: boolean | null
          has_red_card: boolean | null
          has_penalty: boolean | null
          first_to_score: string | null
          possession_winner: string | null
          points_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: number
          home_score?: number | null
          away_score?: number | null
          winner_pick?: string | null
          goal_first_half?: boolean | null
          goal_second_half?: boolean | null
          has_red_card?: boolean | null
          has_penalty?: boolean | null
          first_to_score?: string | null
          possession_winner?: string | null
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: number
          home_score?: number | null
          away_score?: number | null
          winner_pick?: string | null
          goal_first_half?: boolean | null
          goal_second_half?: boolean | null
          has_red_card?: boolean | null
          has_penalty?: boolean | null
          first_to_score?: string | null
          possession_winner?: string | null
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          id: string
          provider: string
          event_id: string
          event_type: string
          status: string
          user_id: string | null
          payload: Json
          processed_at: string
        }
        Insert: {
          id?: string
          provider?: string
          event_id: string
          event_type?: string
          status?: string
          user_id?: string | null
          payload?: Json
          processed_at?: string
        }
        Update: {
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tournament_predictions: {
        Row: {
          id: string
          user_id: string
          champion: string | null
          finalist_1: string | null
          finalist_2: string | null
          semi_1: string | null
          semi_2: string | null
          semi_3: string | null
          semi_4: string | null
          top_scorer: string | null
          brazil_scorer: string | null
          young_player: string | null
          brazil_phase: string | null
          locked: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          champion?: string | null
          finalist_1?: string | null
          finalist_2?: string | null
          semi_1?: string | null
          semi_2?: string | null
          semi_3?: string | null
          semi_4?: string | null
          top_scorer?: string | null
          brazil_scorer?: string | null
          young_player?: string | null
          brazil_phase?: string | null
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          champion?: string | null
          finalist_1?: string | null
          finalist_2?: string | null
          semi_1?: string | null
          semi_2?: string | null
          semi_3?: string | null
          semi_4?: string | null
          top_scorer?: string | null
          brazil_scorer?: string | null
          young_player?: string | null
          brazil_phase?: string | null
          locked?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      participants_public_view: {
        Row: {
          user_id: string
          username: string | null
          full_name: string
          state: string
          city: string
          bonus_points: number
          plan: string
          favorite_team: string | null
          is_test_user: boolean
        }
      }
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
