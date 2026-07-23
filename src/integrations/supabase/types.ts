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
      hero_slides: {
        Row: {
          active: boolean
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          link_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          link_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          link_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          items: Json
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          shipping_address: Json
          shipping_inr: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_inr: number
          total_inr: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipping_address: Json
          shipping_inr?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_inr: number
          total_inr: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          shipping_address?: Json
          shipping_inr?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_inr?: number
          total_inr?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_inquiries: {
        Row: {
          address: string
          budget: string | null
          created_at: string
          experience: string
          id: string
          interested: boolean
          locality: string | null
          name: string
          phone: string
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          address: string
          budget?: string | null
          created_at?: string
          experience: string
          id?: string
          interested?: boolean
          locality?: string | null
          name: string
          phone: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          budget?: string | null
          created_at?: string
          experience?: string
          id?: string
          interested?: boolean
          locality?: string | null
          name?: string
          phone?: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          compare_at_price_inr: number | null
          created_at: string
          description: string
          fabric: string | null
          featured: boolean
          id: string
          images: string[]
          in_stock: boolean
          name: string
          occasion: string | null
          origin: string | null
          price_inr: number
          saree_type: string | null
          slug: string
          state_id: string | null
          updated_at: string
          variants: Json
          work: string | null
        }
        Insert: {
          compare_at_price_inr?: number | null
          created_at?: string
          description?: string
          fabric?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name: string
          occasion?: string | null
          origin?: string | null
          price_inr: number
          saree_type?: string | null
          slug: string
          state_id?: string | null
          updated_at?: string
          variants?: Json
          work?: string | null
        }
        Update: {
          compare_at_price_inr?: number | null
          created_at?: string
          description?: string
          fabric?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          in_stock?: boolean
          name?: string
          occasion?: string | null
          origin?: string | null
          price_inr?: number
          saree_type?: string | null
          slug?: string
          state_id?: string | null
          updated_at?: string
          variants?: Json
          work?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          brand_name: string
          color_accent: string
          color_bg: string
          color_primary: string
          id: number
          logo_url: string | null
          map_svg_url: string | null
          tagline: string
          updated_at: string
        }
        Insert: {
          brand_name?: string
          color_accent?: string
          color_bg?: string
          color_primary?: string
          id?: number
          logo_url?: string | null
          map_svg_url?: string | null
          tagline?: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          color_accent?: string
          color_bg?: string
          color_primary?: string
          id?: number
          logo_url?: string | null
          map_svg_url?: string | null
          tagline?: string
          updated_at?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          hero_image_url: string | null
          id: string
          name: string
          saree_types: string[]
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          hero_image_url?: string | null
          id?: string
          name: string
          saree_types?: string[]
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          hero_image_url?: string | null
          id?: string
          name?: string
          saree_types?: string[]
          slug?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          message: string
          name: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          message: string
          name: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          message?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      wishlist: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "customer"
      order_status:
        | "pending"
        | "paid"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "failed"
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
      app_role: ["admin", "customer"],
      order_status: [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
      ],
    },
  },
} as const
