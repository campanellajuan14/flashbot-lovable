export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chatbots: {
        Row: {
          behavior: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          share_settings: Json | null
          updated_at: string
          user_id: string
          user_id_text: string
        }
        Insert: {
          behavior?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          share_settings?: Json | null
          updated_at?: string
          user_id: string
          user_id_text: string
        }
        Update: {
          behavior?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          share_settings?: Json | null
          updated_at?: string
          user_id?: string
          user_id_text?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          metadata: Json | null
          updated_at: string
          user_identifier: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_identifier?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_identifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          chatbot_id: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string
          user_id: string
          user_id_text: string
        }
        Insert: {
          chatbot_id: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          name: string
          updated_at?: string
          user_id: string
          user_id_text: string
        }
        Update: {
          chatbot_id?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string
          user_id?: string
          user_id_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      message_metrics: {
        Row: {
          chatbot_id: string | null
          created_at: string | null
          document_count: number | null
          has_documents: boolean | null
          id: string
          message_tokens: number | null
          query: string | null
        }
        Insert: {
          chatbot_id?: string | null
          created_at?: string | null
          document_count?: number | null
          has_documents?: boolean | null
          id?: string
          message_tokens?: number | null
          query?: string | null
        }
        Update: {
          chatbot_id?: string | null
          created_at?: string | null
          document_count?: number | null
          has_documents?: boolean | null
          id?: string
          message_tokens?: number | null
          query?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_metrics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      retrieval_metrics: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          precision: number
          response_time: number
          tokens_used: number
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          precision: number
          response_time: number
          tokens_used: number
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          precision?: number
          response_time?: number
          tokens_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_metrics_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      retrieval_settings: {
        Row: {
          chatbot_id: string
          chunk_overlap: number
          chunk_size: number
          created_at: string
          embedding_model: string
          max_results: number
          similarity_threshold: number
          updated_at: string
          use_cache: boolean
          use_hierarchical_embeddings: boolean
        }
        Insert: {
          chatbot_id: string
          chunk_overlap?: number
          chunk_size?: number
          created_at?: string
          embedding_model?: string
          max_results?: number
          similarity_threshold?: number
          updated_at?: string
          use_cache?: boolean
          use_hierarchical_embeddings?: boolean
        }
        Update: {
          chatbot_id?: string
          chunk_overlap?: number
          chunk_size?: number
          created_at?: string
          embedding_model?: string
          max_results?: number
          similarity_threshold?: number
          updated_at?: string
          use_cache?: boolean
          use_hierarchical_embeddings?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "retrieval_settings_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: true
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      temp_documents: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
          name: string
          temp_chatbot_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
          name: string
          temp_chatbot_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          temp_chatbot_id?: string
        }
        Relationships: []
      }
      user_whatsapp_config: {
        Row: {
          active_chatbot_id: string | null
          created_at: string
          id: string
          is_active: boolean
          phone_number_id: string
          secret_data: string | null
          secret_id: string
          updated_at: string
          user_id: string
          waba_id: string
          webhook_verified: boolean
          webhook_verify_token: string
        }
        Insert: {
          active_chatbot_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number_id: string
          secret_data?: string | null
          secret_id: string
          updated_at?: string
          user_id: string
          waba_id: string
          webhook_verified?: boolean
          webhook_verify_token?: string
        }
        Update: {
          active_chatbot_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number_id?: string
          secret_data?: string | null
          secret_id?: string
          updated_at?: string
          user_id?: string
          waba_id?: string
          webhook_verified?: boolean
          webhook_verify_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_whatsapp_config_active_chatbot_id_fkey"
            columns: ["active_chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_whatsapp_tokens: {
        Row: {
          created_at: string
          encrypted_token: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_token: string
          id: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_token?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_whatsapp_tokens_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_whatsapp_config"
            referencedColumns: ["secret_id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          chatbot_id: string | null
          conversation_id: string | null
          direction: string
          from_number: string
          id: string
          message_content: string
          message_type: string
          metadata: Json | null
          phone_number_id: string
          status: string | null
          timestamp: string
          to_number: string
          user_id: string
          wa_message_id: string | null
        }
        Insert: {
          chatbot_id?: string | null
          conversation_id?: string | null
          direction: string
          from_number: string
          id?: string
          message_content: string
          message_type: string
          metadata?: Json | null
          phone_number_id: string
          status?: string | null
          timestamp?: string
          to_number: string
          user_id: string
          wa_message_id?: string | null
        }
        Update: {
          chatbot_id?: string | null
          conversation_id?: string | null
          direction?: string
          from_number?: string
          id?: string
          message_content?: string
          message_type?: string
          metadata?: Json | null
          phone_number_id?: string
          status?: string | null
          timestamp?: string
          to_number?: string
          user_id?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      clear_temp_documents: {
        Args: {
          temp_id: string
        }
        Returns: undefined
      }
      extract_user_id: {
        Args: {
          user_id_value: string
        }
        Returns: string
      }
      get_retrieval_settings: {
        Args: {
          p_chatbot_id: string
        }
        Returns: {
          chatbot_id: string
          chunk_overlap: number
          chunk_size: number
          created_at: string
          embedding_model: string
          max_results: number
          similarity_threshold: number
          updated_at: string
          use_cache: boolean
          use_hierarchical_embeddings: boolean
        }
      }
      get_temp_documents: {
        Args: {
          temp_id: string
        }
        Returns: Json[]
      }
      get_user_whatsapp_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_whatsapp_messages: {
        Args: {
          page_number: number
          page_size: number
        }
        Returns: Json
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      log_retrieval_metrics: {
        Args: {
          p_chatbot_id: string
          p_precision: number
          p_response_time: number
          p_tokens_used: number
        }
        Returns: {
          chatbot_id: string
          created_at: string
          id: string
          precision: number
          response_time: number
          tokens_used: number
        }
      }
      match_documents: {
        Args: {
          query_embedding: string
          p_chatbot_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          chatbot_id: string
          name: string
          content: string
          similarity: number
          metadata: Json
          parent_name: string
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      store_temp_document: {
        Args: {
          temp_id: string
          doc: Json
        }
        Returns: undefined
      }
      update_whatsapp_active_chatbot: {
        Args: {
          chatbot_id_value: string
        }
        Returns: undefined
      }
      update_whatsapp_config_status: {
        Args: {
          is_active_value: boolean
        }
        Returns: undefined
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
