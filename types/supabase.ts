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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      amenities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_available: boolean | null
          notes: string | null
          parking_spot_id: string | null
          price_override: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          parking_spot_id?: string | null
          price_override?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          parking_spot_id?: string | null
          price_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_parking_spot_id_fkey"
            columns: ["parking_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          check_in_time: string
          check_out_time: string
          created_at: string | null
          has_review: boolean | null
          id: string
          parking_spot_id: string | null
          price_per_day: number
          service_fee: number
          status: string
          total_price: number
          user_id: string | null
        }
        Insert: {
          booking_date: string
          check_in_time: string
          check_out_time: string
          created_at?: string | null
          has_review?: boolean | null
          id?: string
          parking_spot_id?: string | null
          price_per_day: number
          service_fee: number
          status: string
          total_price: number
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          check_in_time?: string
          check_out_time?: string
          created_at?: string | null
          has_review?: boolean | null
          id?: string
          parking_spot_id?: string | null
          price_per_day?: number
          service_fee?: number
          status?: string
          total_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_parking_spot_id_fkey"
            columns: ["parking_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          end_time: string
          event_type_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          start_time: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          end_time: string
          event_type_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          start_time: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string
          event_type_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          start_time?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_spot_amenities: {
        Row: {
          amenity_id: string | null
          created_at: string | null
          id: string
          parking_spot_id: string | null
        }
        Insert: {
          amenity_id?: string | null
          created_at?: string | null
          id?: string
          parking_spot_id?: string | null
        }
        Update: {
          amenity_id?: string | null
          created_at?: string | null
          id?: string
          parking_spot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_spot_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parking_spot_amenities_parking_spot_id_fkey"
            columns: ["parking_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_spot_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_primary: boolean | null
          parking_spot_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          parking_spot_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          parking_spot_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_spot_images_parking_spot_id_fkey"
            columns: ["parking_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      parking_spots: {
        Row: {
          address: string
          city: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          owner_id: string | null
          price_per_day: number
          spaces_available: number | null
          state: string
          title: string
          type: string
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          price_per_day: number
          spaces_available?: number | null
          state: string
          title: string
          type: string
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          owner_id?: string | null
          price_per_day?: number
          spaces_available?: number | null
          state?: string
          title?: string
          type?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "parking_spots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          parking_spot_id: string | null
          rating: number
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          parking_spot_id?: string | null
          rating: number
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          parking_spot_id?: string | null
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_parking_spot_id_fkey"
            columns: ["parking_spot_id"]
            isOneToOne: false
            referencedRelation: "parking_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          is_admin: boolean | null
          is_host: boolean | null
          last_name: string | null
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_host?: boolean | null
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_host?: boolean | null
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      venue_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string
          capacity: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          state: string
          venue_type_id: string | null
          zip_code: string
        }
        Insert: {
          address: string
          capacity?: number | null
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          state: string
          venue_type_id?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          capacity?: number | null
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          state?: string
          venue_type_id?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_venue_type_id_fkey"
            columns: ["venue_type_id"]
            isOneToOne: false
            referencedRelation: "venue_types"
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
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      notification_type:
        | "booking_request"
        | "booking_confirmed"
        | "booking_cancelled"
        | "payment_received"
        | "review_received"
        | "system"
      parking_type: "driveway" | "garage" | "lot" | "street"
      payment_status: "pending" | "completed" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
