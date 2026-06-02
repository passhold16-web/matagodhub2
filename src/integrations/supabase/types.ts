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
      banned_users: {
        Row: {
          banned_by: string
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      builds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          pokemon_ids: number[]
          team_data: Json | null
          tier: string
          updated_at: string
          user_id: string
          votes_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          pokemon_ids: number[]
          team_data?: Json | null
          tier: string
          updated_at?: string
          user_id: string
          votes_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          pokemon_ids?: number[]
          team_data?: Json | null
          tier?: string
          updated_at?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          category: Database["public"]["Enums"]["forum_category"]
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["forum_category"]
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["forum_category"]
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          pinned: boolean
          published: boolean
          summary: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          published?: boolean
          summary: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          published?: boolean
          summary?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          id: string
          challenger_id: string
          opponent_id: string | null
          format: string
          prize_pd: number
          status: string
          meet_day: string | null
          meet_time: string | null
          meet_timezone: string | null
          meet_channel: string | null
          meet_city: string | null
          meet_confirmed_at: string | null
          meet_at: string | null
          challenger_result_winner_id: string | null
          opponent_result_winner_id: string | null
          winner_id: string | null
          loser_id: string | null
          counts_for_ranking: boolean
          dispute_reason: string | null
          dispute_proof_path: string | null
          dispute_reported_by: string | null
          dispute_resolved_at: string | null
          dispute_resolved_by: string | null
          cancelled_by: string | null
          cancel_reason: string | null
          accepted_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      challenge_messages: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: { challenge_id: string; user_id: string; content: string; id?: string; created_at?: string }
        Update: Record<string, unknown>
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
          username: string
          wins: number
          losses: number
          pokemmo_nick: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          created_at: string
          description: string
          id: string
          pokemmo_nick: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          pokemmo_nick: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          pokemmo_nick?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          contact_url: string | null
          created_at: string
          description: string | null
          event_date: string
          format: string | null
          id: string
          max_players: number
          name: string
          prize: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_url?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          format?: string | null
          id?: string
          max_players?: number
          name: string
          prize?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_url?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          format?: string | null
          id?: string
          max_players?: number
          name?: string
          prize?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          build_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          build_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          build_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_build_id_fkey"
            columns: ["build_id"]
            isOneToOne: false
            referencedRelation: "builds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_challenge: { Args: { p_challenge_id: string }; Returns: Database["public"]["Tables"]["challenges"]["Row"] }
      cancel_challenge_inactivity: { Args: { p_challenge_id: string }; Returns: Database["public"]["Tables"]["challenges"]["Row"] }
      confirm_challenge_meet: {
        Args: {
          p_challenge_id: string
          p_meet_day: string
          p_meet_time: string
          p_meet_timezone: string
          p_meet_channel: string
          p_meet_city: string
        }
        Returns: Database["public"]["Tables"]["challenges"]["Row"]
      }
      ensure_user_profile: {
        Args: Record<string, never>
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
      get_email_for_username: { Args: { _username: string }; Returns: string }
      open_challenge_dispute: {
        Args: { p_challenge_id: string; p_reason: string; p_proof_path: string }
        Returns: Database["public"]["Tables"]["challenges"]["Row"]
      }
      report_challenge_result: {
        Args: { p_challenge_id: string; p_winner_id: string }
        Returns: Database["public"]["Tables"]["challenges"]["Row"]
      }
      resolve_challenge_dispute: {
        Args: { p_challenge_id: string; p_winner_id: string; p_counts_for_ranking?: boolean }
        Returns: Database["public"]["Tables"]["challenges"]["Row"]
      }
      scored_challenges_today_between: { Args: { u1: string; u2: string }; Returns: number }
      has_app_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_banned: { Args: { _user_id: string }; Returns: boolean }
      set_user_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      forum_category: "estrategia" | "pve" | "eventos" | "offtopic"
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
      forum_category: ["estrategia", "pve", "eventos", "offtopic"],
    },
  },
} as const
