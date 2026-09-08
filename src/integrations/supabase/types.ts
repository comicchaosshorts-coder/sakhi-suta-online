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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      admin_notification_reads: {
        Row: {
          admin_id: string
          notification_id: string
          read_at: string
        }
        Insert: {
          admin_id: string
          notification_id: string
          read_at?: string
        }
        Update: {
          admin_id?: string
          notification_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          amount_inr: number
          created_at: string
          customer_name: string | null
          id: string
          item_count: number
          order_id: string | null
          order_status: string | null
          payment_status: string | null
          type: string
        }
        Insert: {
          amount_inr?: number
          created_at?: string
          customer_name?: string | null
          id?: string
          item_count?: number
          order_id?: string | null
          order_status?: string | null
          payment_status?: string | null
          type: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          customer_name?: string | null
          id?: string
          item_count?: number
          order_id?: string | null
          order_status?: string | null
          payment_status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          coupon_code: string
          coupon_id: string
          created_at: string
          discount_inr: number
          id: string
          order_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          coupon_code: string
          coupon_id: string
          created_at?: string
          discount_inr?: number
          id?: string
          order_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          coupon_code?: string
          coupon_id?: string
          created_at?: string
          discount_inr?: number
          id?: string
          order_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          archived: boolean
          audience: string
          campaign_id: string | null
          code: string
          combine_with_auto: boolean
          combine_with_campaign: boolean
          combine_with_returning: boolean
          created_at: string
          created_by: string | null
          description: string
          end_at: string | null
          fixed_inr: number
          id: string
          max_cart_inr: number | null
          max_discount_inr: number | null
          min_cart_inr: number
          name: string
          per_customer_limit: number
          percent: number
          priority: number
          product_ids: string[]
          saree_types: string[]
          start_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          archived?: boolean
          audience?: string
          campaign_id?: string | null
          code: string
          combine_with_auto?: boolean
          combine_with_campaign?: boolean
          combine_with_returning?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          end_at?: string | null
          fixed_inr?: number
          id?: string
          max_cart_inr?: number | null
          max_discount_inr?: number | null
          min_cart_inr?: number
          name?: string
          per_customer_limit?: number
          percent?: number
          priority?: number
          product_ids?: string[]
          saree_types?: string[]
          start_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          archived?: boolean
          audience?: string
          campaign_id?: string | null
          code?: string
          combine_with_auto?: boolean
          combine_with_campaign?: boolean
          combine_with_returning?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          end_at?: string | null
          fixed_inr?: number
          id?: string
          max_cart_inr?: number | null
          max_discount_inr?: number | null
          min_cart_inr?: number
          name?: string
          per_customer_limit?: number
          percent?: number
          priority?: number
          product_ids?: string[]
          saree_types?: string[]
          start_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "discount_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_campaigns: {
        Row: {
          active: boolean
          audience: string
          created_at: string
          description: string
          end_at: string | null
          fixed_inr: number
          id: string
          max_discount_inr: number | null
          min_subtotal_inr: number
          name: string
          overrides_other_discounts: boolean
          percent: number
          priority: number
          product_ids: string[]
          saree_types: string[]
          stackable: boolean
          start_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string
          created_at?: string
          description?: string
          end_at?: string | null
          fixed_inr?: number
          id?: string
          max_discount_inr?: number | null
          min_subtotal_inr?: number
          name: string
          overrides_other_discounts?: boolean
          percent?: number
          priority?: number
          product_ids?: string[]
          saree_types?: string[]
          stackable?: boolean
          start_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string
          created_at?: string
          description?: string
          end_at?: string | null
          fixed_inr?: number
          id?: string
          max_discount_inr?: number | null
          min_subtotal_inr?: number
          name?: string
          overrides_other_discounts?: boolean
          percent?: number
          priority?: number
          product_ids?: string[]
          saree_types?: string[]
          stackable?: boolean
          start_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      discount_settings: {
        Row: {
          auto_enabled: boolean
          auto_end_at: string | null
          auto_max_discount_inr: number | null
          auto_min_subtotal_inr: number
          auto_percent: number
          auto_product_ids: string[]
          auto_saree_types: string[]
          auto_start_at: string | null
          id: number
          returning_enabled: boolean
          returning_end_at: string | null
          returning_max_discount_inr: number | null
          returning_min_orders: number
          returning_min_subtotal_inr: number
          returning_percent: number
          returning_product_ids: string[]
          returning_saree_types: string[]
          returning_start_at: string | null
          stack_auto_with_campaign: boolean
          stack_auto_with_coupon: boolean
          stack_auto_with_returning: boolean
          stack_campaign_with_coupon: boolean
          stack_returning_with_campaign: boolean
          stack_returning_with_coupon: boolean
          updated_at: string
        }
        Insert: {
          auto_enabled?: boolean
          auto_end_at?: string | null
          auto_max_discount_inr?: number | null
          auto_min_subtotal_inr?: number
          auto_percent?: number
          auto_product_ids?: string[]
          auto_saree_types?: string[]
          auto_start_at?: string | null
          id?: number
          returning_enabled?: boolean
          returning_end_at?: string | null
          returning_max_discount_inr?: number | null
          returning_min_orders?: number
          returning_min_subtotal_inr?: number
          returning_percent?: number
          returning_product_ids?: string[]
          returning_saree_types?: string[]
          returning_start_at?: string | null
          stack_auto_with_campaign?: boolean
          stack_auto_with_coupon?: boolean
          stack_auto_with_returning?: boolean
          stack_campaign_with_coupon?: boolean
          stack_returning_with_campaign?: boolean
          stack_returning_with_coupon?: boolean
          updated_at?: string
        }
        Update: {
          auto_enabled?: boolean
          auto_end_at?: string | null
          auto_max_discount_inr?: number | null
          auto_min_subtotal_inr?: number
          auto_percent?: number
          auto_product_ids?: string[]
          auto_saree_types?: string[]
          auto_start_at?: string | null
          id?: number
          returning_enabled?: boolean
          returning_end_at?: string | null
          returning_max_discount_inr?: number | null
          returning_min_orders?: number
          returning_min_subtotal_inr?: number
          returning_percent?: number
          returning_product_ids?: string[]
          returning_saree_types?: string[]
          returning_start_at?: string | null
          stack_auto_with_campaign?: boolean
          stack_auto_with_coupon?: boolean
          stack_auto_with_returning?: boolean
          stack_campaign_with_coupon?: boolean
          stack_returning_with_campaign?: boolean
          stack_returning_with_coupon?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          banner_type: string
          button_link: string | null
          button_text: string | null
          caption: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          link_url: string | null
          mobile_image_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          banner_type?: string
          button_link?: string | null
          button_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          link_url?: string | null
          mobile_image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          banner_type?: string
          button_link?: string | null
          button_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          link_url?: string | null
          mobile_image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          order_id: string
          previous_status: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          order_id: string
          previous_status?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          order_id?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          archived: boolean
          coupon_code: string | null
          created_at: string
          discount_breakdown: Json
          discount_inr: number
          id: string
          items: Json
          paid_at: string | null
          payment_status: string
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
          archived?: boolean
          coupon_code?: string | null
          created_at?: string
          discount_breakdown?: Json
          discount_inr?: number
          id?: string
          items: Json
          paid_at?: string | null
          payment_status?: string
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
          archived?: boolean
          coupon_code?: string | null
          created_at?: string
          discount_breakdown?: Json
          discount_inr?: number
          id?: string
          items?: Json
          paid_at?: string | null
          payment_status?: string
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
      promo_content: {
        Row: {
          active: boolean
          created_at: string
          display_order: number
          id: string
          kind: string
          link_url: string | null
          subtext: string | null
          text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          kind: string
          link_url?: string | null
          subtext?: string | null
          text: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_order?: number
          id?: string
          kind?: string
          link_url?: string | null
          subtext?: string | null
          text?: string
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
          promo_banner_url: string | null
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
          promo_banner_url?: string | null
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
          promo_banner_url?: string | null
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
      reserve_coupon: {
        Args: {
          _coupon_id: string
          _discount_inr: number
          _order_id: string
          _user_id: string
        }
        Returns: string
      }
      settle_coupon_redemption: {
        Args: { _order_id: string; _status: string }
        Returns: undefined
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
        | "confirmed"
        | "processing"
        | "packed"
        | "in_transit"
        | "refunded"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
        "confirmed",
        "processing",
        "packed",
        "in_transit",
        "refunded",
      ],
    },
  },
} as const
