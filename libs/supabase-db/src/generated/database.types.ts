export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
      api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'api_keys_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'api_keys_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'api_keys_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      credit_ledgers: {
        Row: {
          amount_credits: number
          amount_usd: number | null
          created_at: string
          event_type: Database['public']['Enums']['credit_event_type']
          id: string
          metadata: Json
          tenant_id: string
        }
        Insert: {
          amount_credits: number
          amount_usd?: number | null
          created_at?: string
          event_type: Database['public']['Enums']['credit_event_type']
          id?: string
          metadata?: Json
          tenant_id: string
        }
        Update: {
          amount_credits?: number
          amount_usd?: number | null
          created_at?: string
          event_type?: Database['public']['Enums']['credit_event_type']
          id?: string
          metadata?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'credit_ledgers_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'credit_ledgers_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'credit_ledgers_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      tenants: {
        Row: {
          app_installed: boolean
          created_at: string
          id: string
          shop_domain: string
          updated_at: string
        }
        Insert: {
          app_installed?: boolean
          created_at?: string
          id?: string
          shop_domain: string
          updated_at?: string
        }
        Update: {
          app_installed?: boolean
          created_at?: string
          id?: string
          shop_domain?: string
          updated_at?: string
        }
        Relationships: []
      }
      tryon_job_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          job_id: string
          metadata: Json
          occurred_at: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          job_id: string
          metadata?: Json
          occurred_at?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          job_id?: string
          metadata?: Json
          occurred_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tryon_job_events_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'tryon_job_timing_v'
            referencedColumns: ['job_id']
          },
          {
            foreignKeyName: 'tryon_job_events_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'tryon_jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tryon_job_events_job_id_fkey'
            columns: ['job_id']
            isOneToOne: false
            referencedRelation: 'tryon_jobs_enriched_v'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tryon_job_events_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_job_events_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_job_events_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      tryon_jobs: {
        Row: {
          created_at: string
          credits_charged: number
          customer_id: string | null
          failure_reason_message: string | null
          failure_reason_normalized: string | null
          id: string
          idempotency_key: string | null
          model: Database['public']['Enums']['tryon_model']
          product_id: string
          provider_job_id: string | null
          result_url: string | null
          shop_domain: string
          shopify_product_handle: string | null
          status: Database['public']['Enums']['tryon_job_status']
          tenant_id: string
          updated_at: string
          user_image_hash: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          credits_charged?: number
          customer_id?: string | null
          failure_reason_message?: string | null
          failure_reason_normalized?: string | null
          id?: string
          idempotency_key?: string | null
          model?: Database['public']['Enums']['tryon_model']
          product_id: string
          provider_job_id?: string | null
          result_url?: string | null
          shop_domain: string
          shopify_product_handle?: string | null
          status?: Database['public']['Enums']['tryon_job_status']
          tenant_id: string
          updated_at?: string
          user_image_hash: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          credits_charged?: number
          customer_id?: string | null
          failure_reason_message?: string | null
          failure_reason_normalized?: string | null
          id?: string
          idempotency_key?: string | null
          model?: Database['public']['Enums']['tryon_model']
          product_id?: string
          provider_job_id?: string | null
          result_url?: string | null
          shop_domain?: string
          shopify_product_handle?: string | null
          status?: Database['public']['Enums']['tryon_job_status']
          tenant_id?: string
          updated_at?: string
          user_image_hash?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      user_images: {
        Row: {
          created_at: string
          customer_id: string | null
          expires_at: string
          id: string
          image_hash: string
          storage_url: string
          tenant_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          expires_at: string
          id?: string
          image_hash: string
          storage_url: string
          tenant_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          expires_at?: string
          id?: string
          image_hash?: string
          storage_url?: string
          tenant_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_images_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'user_images_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'user_images_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      global_tryon_daily_v: {
        Row: {
          active_tenants: number | null
          completed_jobs: number | null
          created_day_utc: string | null
          failed_jobs: number | null
          in_flight_jobs: number | null
          provider_expired_jobs: number | null
          terminal_success_rate_pct: number | null
          total_jobs: number | null
        }
        Relationships: []
      }
      global_tryon_failure_reason_v: {
        Row: {
          failure_reason: string | null
          failures_last_24h: number | null
          failures_last_7d: number | null
          failures_total: number | null
        }
        Relationships: []
      }
      global_tryon_model_performance_v: {
        Row: {
          avg_lifecycle_seconds_completed: number | null
          completed_jobs: number | null
          failed_jobs: number | null
          model: Database['public']['Enums']['tryon_model'] | null
          terminal_success_rate_pct: number | null
          total_jobs: number | null
        }
        Relationships: []
      }
      global_tryon_overview_v: {
        Row: {
          active_tenants_last_30d: number | null
          avg_lifecycle_seconds_completed: number | null
          completed_jobs: number | null
          failed_jobs: number | null
          in_flight_jobs: number | null
          jobs_last_24h: number | null
          jobs_last_7d: number | null
          p95_lifecycle_seconds_completed: number | null
          provider_expired_jobs: number | null
          tenants_with_jobs: number | null
          terminal_success_rate_pct: number | null
          total_jobs: number | null
        }
        Relationships: []
      }
      tenant_credit_snapshot_v: {
        Row: {
          available_credits: number | null
          completed_consumed_count: number | null
          failed_charged_count: number | null
          in_flight_reserved_count: number | null
          refunded_credits: number | null
          reserved_or_spent_credits: number | null
          shop_domain: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
      tenant_tryon_daily_v: {
        Row: {
          avg_lifecycle_seconds_completed: number | null
          charged_jobs: number | null
          completed_jobs: number | null
          created_day_utc: string | null
          failed_jobs: number | null
          in_flight_jobs: number | null
          provider_expired_jobs: number | null
          shop_domain: string | null
          tenant_id: string | null
          terminal_success_rate_pct: number | null
          total_jobs: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      tenant_tryon_model_performance_v: {
        Row: {
          avg_lifecycle_seconds_completed: number | null
          completed_jobs: number | null
          failed_jobs: number | null
          model: Database['public']['Enums']['tryon_model'] | null
          shop_domain: string | null
          tenant_id: string | null
          terminal_success_rate_pct: number | null
          total_jobs: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      tenant_tryon_overview_v: {
        Row: {
          available_credits: number | null
          avg_lifecycle_seconds_completed: number | null
          completed_consumed_count: number | null
          completed_jobs: number | null
          failed_charged_count: number | null
          failed_jobs: number | null
          in_flight_jobs: number | null
          in_flight_reserved_count: number | null
          jobs_last_24h: number | null
          jobs_last_7d: number | null
          p95_lifecycle_seconds_completed: number | null
          provider_expired_jobs: number | null
          refunded_credits: number | null
          reserved_or_spent_credits: number | null
          shop_domain: string | null
          tenant_id: string | null
          terminal_success_rate_pct: number | null
          total_jobs: number | null
        }
        Relationships: []
      }
      tryon_job_timing_v: {
        Row: {
          api_request_received_at: string | null
          api_to_storage_ms: number | null
          end_to_end_to_client_ms: number | null
          input_images_uploaded_at: string | null
          job_id: string | null
          model: Database['public']['Enums']['tryon_model'] | null
          provider_poll_completed_at: string | null
          provider_poll_ms: number | null
          provider_poll_started_at: string | null
          provider_result_persist_started_at: string | null
          provider_result_persisted_at: string | null
          provider_submit_ms: number | null
          provider_submit_started_at: string | null
          provider_submit_succeeded_at: string | null
          result_delivered_to_client_at: string | null
          shop_domain: string | null
          status: Database['public']['Enums']['tryon_job_status'] | null
          storage_persist_ms: number | null
          tenant_id: string | null
          upload_ms: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      tryon_jobs_enriched_v: {
        Row: {
          created_at: string | null
          created_day_utc: string | null
          credits_charged: number | null
          failure_reason_message: string | null
          failure_reason_normalized: string | null
          id: string | null
          is_completed: boolean | null
          is_credits_charged: boolean | null
          is_failed: boolean | null
          is_in_flight: boolean | null
          is_provider_expired: boolean | null
          lifecycle_seconds: number | null
          model: Database['public']['Enums']['tryon_model'] | null
          product_id: string | null
          provider_job_id: string | null
          shop_domain: string | null
          status: Database['public']['Enums']['tryon_job_status'] | null
          tenant_id: string | null
          updated_at: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_day_utc?: never
          credits_charged?: number | null
          failure_reason_message?: string | null
          failure_reason_normalized?: string | null
          id?: string | null
          is_completed?: never
          is_credits_charged?: never
          is_failed?: never
          is_in_flight?: never
          is_provider_expired?: never
          lifecycle_seconds?: never
          model?: Database['public']['Enums']['tryon_model'] | null
          product_id?: string | null
          provider_job_id?: string | null
          shop_domain?: string | null
          status?: Database['public']['Enums']['tryon_job_status'] | null
          tenant_id?: string | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_day_utc?: never
          credits_charged?: number | null
          failure_reason_message?: string | null
          failure_reason_normalized?: string | null
          id?: string | null
          is_completed?: never
          is_credits_charged?: never
          is_failed?: never
          is_in_flight?: never
          is_provider_expired?: never
          lifecycle_seconds?: never
          model?: Database['public']['Enums']['tryon_model'] | null
          product_id?: string | null
          provider_job_id?: string | null
          shop_domain?: string | null
          status?: Database['public']['Enums']['tryon_job_status'] | null
          tenant_id?: string | null
          updated_at?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_credit_snapshot_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenant_tryon_overview_v'
            referencedColumns: ['tenant_id']
          },
          {
            foreignKeyName: 'tryon_jobs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      reserve_credit_for_job: {
        Args: { p_job_id: string; p_source?: string; p_tenant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      credit_event_type: 'topup' | 'debit_tryon' | 'refund' | 'adjustment'
      tryon_job_status: 'queued' | 'processing' | 'completed' | 'failed' | 'provider_expired'
      tryon_model: 'normal' | 'advanced'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      credit_event_type: ['topup', 'debit_tryon', 'refund', 'adjustment'],
      tryon_job_status: ['queued', 'processing', 'completed', 'failed', 'provider_expired'],
      tryon_model: ['normal', 'advanced'],
    },
  },
} as const
