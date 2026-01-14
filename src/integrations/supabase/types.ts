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
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          achievement_count: number | null
          activity_type: string | null
          average_heartrate: number | null
          average_pace: number | null
          average_speed: number | null
          calories: number | null
          created_at: string | null
          description: string | null
          distance: number | null
          elapsed_time: number | null
          elevation_gain: number | null
          gear_id: string | null
          id: string
          kudos_count: number | null
          max_heartrate: number | null
          max_speed: number | null
          moving_time: number | null
          name: string | null
          start_date: string | null
          strava_id: number | null
          suffer_score: number | null
          user_id: string
          workout_type: number | null
        }
        Insert: {
          achievement_count?: number | null
          activity_type?: string | null
          average_heartrate?: number | null
          average_pace?: number | null
          average_speed?: number | null
          calories?: number | null
          created_at?: string | null
          description?: string | null
          distance?: number | null
          elapsed_time?: number | null
          elevation_gain?: number | null
          gear_id?: string | null
          id?: string
          kudos_count?: number | null
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time?: number | null
          name?: string | null
          start_date?: string | null
          strava_id?: number | null
          suffer_score?: number | null
          user_id: string
          workout_type?: number | null
        }
        Update: {
          achievement_count?: number | null
          activity_type?: string | null
          average_heartrate?: number | null
          average_pace?: number | null
          average_speed?: number | null
          calories?: number | null
          created_at?: string | null
          description?: string | null
          distance?: number | null
          elapsed_time?: number | null
          elevation_gain?: number | null
          gear_id?: string | null
          id?: string
          kudos_count?: number | null
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time?: number | null
          name?: string | null
          start_date?: string | null
          strava_id?: number | null
          suffer_score?: number | null
          user_id?: string
          workout_type?: number | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_leaderboard: {
        Row: {
          id: string
          month: number
          rank: number | null
          rank_change: number | null
          total_distance: number | null
          total_runs: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          id?: string
          month: number
          rank?: number | null
          rank_change?: number | null
          total_distance?: number | null
          total_runs?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          id?: string
          month?: number
          rank?: number | null
          rank_change?: number | null
          total_distance?: number | null
          total_runs?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievements: boolean | null
          id: string
          leaderboard_changes: boolean | null
          new_blog_posts: boolean | null
          new_races: boolean | null
          training_reminders: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements?: boolean | null
          id?: string
          leaderboard_changes?: boolean | null
          new_blog_posts?: boolean | null
          new_races?: boolean | null
          training_reminders?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements?: boolean | null
          id?: string
          leaderboard_changes?: boolean | null
          new_blog_posts?: boolean | null
          new_races?: boolean | null
          training_reminders?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          current_streak: number | null
          display_name: string | null
          follower_count: number | null
          friend_count: number | null
          id: string
          longest_streak: number | null
          measurement_preference: string | null
          monthly_distance_goal: number | null
          premium: boolean | null
          sex: string | null
          strava_access_token: string | null
          strava_id: string | null
          strava_refresh_token: string | null
          strava_token_expires_at: string | null
          total_distance: number | null
          total_runs: number | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          follower_count?: number | null
          friend_count?: number | null
          id?: string
          longest_streak?: number | null
          measurement_preference?: string | null
          monthly_distance_goal?: number | null
          premium?: boolean | null
          sex?: string | null
          strava_access_token?: string | null
          strava_id?: string | null
          strava_refresh_token?: string | null
          strava_token_expires_at?: string | null
          total_distance?: number | null
          total_runs?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          follower_count?: number | null
          friend_count?: number | null
          id?: string
          longest_streak?: number | null
          measurement_preference?: string | null
          monthly_distance_goal?: number | null
          premium?: boolean | null
          sex?: string | null
          strava_access_token?: string | null
          strava_id?: string | null
          strava_refresh_token?: string | null
          strava_token_expires_at?: string | null
          total_distance?: number | null
          total_runs?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      race_participants: {
        Row: {
          id: string
          race_id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          id?: string
          race_id: string
          registered_at?: string
          user_id: string
        }
        Update: {
          id?: string
          race_id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_participants_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          distance_type: string
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string | null
          name: string
          race_date: string
          registration_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          distance_type: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          name: string
          race_date: string
          registration_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          distance_type?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string | null
          name?: string
          race_date?: string
          registration_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_weeks: number
          goal_distance: string
          id: string
          is_published: boolean | null
          level: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks: number
          goal_distance: string
          id?: string
          is_published?: boolean | null
          level: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number
          goal_distance?: string
          id?: string
          is_published?: boolean | null
          level?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_weeks: {
        Row: {
          focus: string | null
          id: string
          plan_id: string
          week_number: number
        }
        Insert: {
          focus?: string | null
          id?: string
          plan_id: string
          week_number: number
        }
        Update: {
          focus?: string | null
          id?: string
          plan_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_workouts: {
        Row: {
          day_of_week: number
          distance_km: number | null
          duration_minutes: number | null
          id: string
          notes: string | null
          week_id: string
          workout_type: string
        }
        Insert: {
          day_of_week: number
          distance_km?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          week_id: string
          workout_type: string
        }
        Update: {
          day_of_week?: number
          distance_km?: number | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          week_id?: string
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_workouts_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "training_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_training_progress: {
        Row: {
          completed_at: string
          id: string
          plan_id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          plan_id: string
          user_id: string
          workout_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          plan_id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_training_progress_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "training_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          id: string | null
          longest_streak: number | null
          total_distance: number | null
          total_runs: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          id?: string | null
          longest_streak?: number | null
          total_distance?: number | null
          total_runs?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          id?: string | null
          longest_streak?: number | null
          total_distance?: number | null
          total_runs?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
