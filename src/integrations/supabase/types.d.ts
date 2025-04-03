export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chatbot_permissions: {
        Row: {
          chatbot_id: string | null
          created_at: string | null
          id: string
          permission: string | null
          user_id: string | null
        }
        Insert: {
          chatbot_id?: string | null
          created_at?: string | null
          id?: string
          permission?: string | null
          user_id?: string | null
        }
        Update: {
          chatbot_id?: string | null
          created_at?: string | null
          id?: string
          permission?: string | null
          user_id?: string | null
        }
      }
      chatbots: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
      }
      documents: {
        Row: {
          chatbot_id: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          name: string | null
        }
        Insert: {
          chatbot_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          chatbot_id?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
        }
      }
       user_whatsapp_config: {
        Row: {
          id: string
          user_id: string
          phone_number_id: string
          waba_id: string
          secret_id: string
          is_active: boolean
          webhook_verified: boolean
          active_chatbot_id: string | null
          created_at: string
          updated_at: string
          webhook_verify_token: string
        }
        Insert: {
          user_id: string
          phone_number_id: string
          waba_id: string
          secret_id: string
          is_active: boolean
          webhook_verified: boolean
          active_chatbot_id: string | null
          created_at: string
          updated_at: string
          webhook_verify_token: string
        }
        Update: {
          user_id: string
          phone_number_id: string
          waba_id: string
          secret_id: string
          is_active: boolean
          webhook_verified: boolean
          active_chatbot_id: string | null
          created_at: string
          updated_at: string
          webhook_verify_token: string
        }
      }
      whatsapp_messages: {
        Row: {
          id: string
          user_id: string
          phone_number_id: string
          chatbot_id?: string
          conversation_id?: string
          wa_message_id?: string
          from_number: string
          to_number: string
          message_type: string
          message_content: string
          direction: 'inbound' | 'outbound'
          status?: string
          timestamp: string
          metadata?: Record<string, any>;
        }
        Insert: {
          user_id: string
          phone_number_id: string
          chatbot_id?: string
          conversation_id?: string
          wa_message_id?: string
          from_number: string
          to_number: string
          message_type: string
          message_content: string
          direction: 'inbound' | 'outbound'
          status?: string
          timestamp: string
          metadata?: Record<string, any>;
        }
        Update: {
          user_id: string
          phone_number_id: string
          chatbot_id?: string
          conversation_id?: string
          wa_message_id?: string
          from_number: string
          to_number: string
          message_type: string
          message_content: string
          direction: 'inbound' | 'outbound'
          status?: string
          timestamp: string
          metadata?: Record<string, any>;
        }
      }
    },
    Views: {
      [_ Walrus Columns]: {
        Row: {
          walrus: string | null
        }
        Insert: {
          walrus?: string | null
        }
        Update: {
          walrus?: string | null
        }
      }
    },
    Functions: {
      binary_quantize: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_retrieval_settings: {
        Args: {
          p_chatbot_id: string
        }
        Returns: {
          chatbot_id: string
          embedding_model: string
          created_at: string
          updated_at: string
          use_cache: boolean
          use_hierarchical_embeddings: boolean
          chunk_overlap: number
          chunk_size: number
          max_results: number
          similarity_threshold: number
        }[]
      }
      get_user_whatsapp_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_whatsapp_config_status: {
        Args: {
          is_active_value: boolean
        }
        Returns: undefined
      }
      update_whatsapp_active_chatbot: {
        Args: {
          chatbot_id_value: string
        }
        Returns: undefined
      }
      get_whatsapp_messages: {
        Args: {
          page_number: number
          page_size: number
        }
        Returns: Json
      }
      ivfflat_invlist_options: {
        Args: {
          index_oid: number
          column_oid: number
          options: string[]
        }
        Returns: string
      }
      vector_avg: {
        Args: {
          vectors: string[]
        }
        Returns: string
      }
      vector_dims: {
        Args: {
          vector: string
        }
        Returns: number
      }
      vector_norm: {
        Args: {
          vector: string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          vector: string
        }
        Returns: string
      }
      vector_send: {
        Args: {
          vector: string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          typmod: number
        }
        Returns: string
      }
    },
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn"
      key_status: "default" | "valid" | "invalid" | "expired"
      key_type: "aead-ietf" | "aead-det" | "hmacsha256" | "hmacsha512" | "kdf" | "secretstream" | "secretbox" | "auth"
      otp_transport_type: "email" | "phone"
      saml_attribute_type: "Text" | "Integer" | "Boolean"
      update_status: "pending" | "verifying" | "verified" | "expired"
    },
    CompositeTypes: {
      
    }
  }
}
