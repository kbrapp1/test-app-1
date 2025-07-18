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
      asset_tags: {
        Row: {
          asset_id: string
          tag_id: string
        }
        Insert: {
          asset_id: string
          tag_id: string
        }
        Update: {
          asset_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_tags_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          mime_type: string
          name: string
          organization_id: string
          size: number
          storage_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type: string
          name: string
          organization_id: string
          size: number
          storage_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string
          size?: number
          storage_path?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_leads: {
        Row: {
          assigned_to: string | null
          captured_at: string
          chatbot_config_id: string
          contact_info: Json
          conversation_summary: string
          created_at: string
          follow_up_status: string
          id: string
          last_contacted_at: string | null
          lead_score: number
          organization_id: string
          qualification_data: Json
          qualification_status: string
          session_id: string
          source: Json
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          captured_at?: string
          chatbot_config_id: string
          contact_info?: Json
          conversation_summary?: string
          created_at?: string
          follow_up_status?: string
          id?: string
          last_contacted_at?: string | null
          lead_score?: number
          organization_id: string
          qualification_data?: Json
          qualification_status?: string
          session_id: string
          source?: Json
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          captured_at?: string
          chatbot_config_id?: string
          contact_info?: Json
          conversation_summary?: string
          created_at?: string
          follow_up_status?: string
          id?: string
          last_contacted_at?: string | null
          lead_score?: number
          organization_id?: string
          qualification_data?: Json
          qualification_status?: string
          session_id?: string
          source?: Json
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_leads_chatbot_config_id_fkey"
            columns: ["chatbot_config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_leads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_visible: boolean
          message_type: string
          metadata: Json
          processing_time_ms: number | null
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_visible?: boolean
          message_type: string
          metadata?: Json
          processing_time_ms?: number | null
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          message_type?: string
          metadata?: Json
          processing_time_ms?: number | null
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          chatbot_config_id: string
          context_data: Json
          created_at: string
          current_url: string | null
          ended_at: string | null
          id: string
          ip_address: unknown | null
          last_activity_at: string
          lead_qualification_state: Json
          referrer_url: string | null
          session_token: string
          started_at: string
          status: string
          updated_at: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          chatbot_config_id: string
          context_data?: Json
          created_at?: string
          current_url?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_activity_at?: string
          lead_qualification_state?: Json
          referrer_url?: string | null
          session_token: string
          started_at?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          chatbot_config_id?: string
          context_data?: Json
          created_at?: string
          current_url?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_activity_at?: string
          lead_qualification_state?: Json
          referrer_url?: string | null
          session_token?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_chatbot_config_id_fkey"
            columns: ["chatbot_config_id"]
            isOneToOne: false
            referencedRelation: "chatbot_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_configs: {
        Row: {
          ai_configuration: Json
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          knowledge_base: Json
          lead_qualification_questions: Json
          name: string
          operating_hours: Json
          organization_id: string
          personality_settings: Json
          updated_at: string
        }
        Insert: {
          ai_configuration?: Json
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          knowledge_base?: Json
          lead_qualification_questions?: Json
          name: string
          operating_hours?: Json
          organization_id: string
          personality_settings?: Json
          updated_at?: string
        }
        Update: {
          ai_configuration?: Json
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          knowledge_base?: Json
          lead_qualification_questions?: Json
          name?: string
          operating_hours?: Json
          organization_id?: string
          personality_settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_knowledge_items: {
        Row: {
          category: string
          chatbot_config_id: string
          content: string
          content_hash: string
          created_at: string | null
          embedding: string | null
          id: string
          intent_relevance: string[] | null
          knowledge_item_id: string
          organization_id: string
          relevance_score: number | null
          source_metadata: Json | null
          source_type: string
          source_url: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          chatbot_config_id: string
          content: string
          content_hash: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          intent_relevance?: string[] | null
          knowledge_item_id: string
          organization_id: string
          relevance_score?: number | null
          source_metadata?: Json | null
          source_type: string
          source_url?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          chatbot_config_id?: string
          content?: string
          content_hash?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          intent_relevance?: string[] | null
          knowledge_item_id?: string
          organization_id?: string
          relevance_score?: number | null
          source_metadata?: Json | null
          source_type?: string
          source_url?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_knowledge_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_knowledge_vectors: {
        Row: {
          chatbot_config_id: string
          content_hash: string
          created_at: string | null
          id: string
          knowledge_item_id: string
          metadata: Json | null
          organization_id: string
          updated_at: string | null
          vector: string
        }
        Insert: {
          chatbot_config_id: string
          content_hash: string
          created_at?: string | null
          id?: string
          knowledge_item_id: string
          metadata?: Json | null
          organization_id: string
          updated_at?: string | null
          vector: string
        }
        Update: {
          chatbot_config_id?: string
          content_hash?: string
          created_at?: string | null
          id?: string
          knowledge_item_id?: string
          metadata?: Json | null
          organization_id?: string
          updated_at?: string | null
          vector?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_knowledge_vectors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          parent_folder_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          parent_folder_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_folders_parent_folder"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generations: {
        Row: {
          aspect_ratio: string | null
          base_image_url: string | null
          cost_cents: number
          created_at: string
          dam_asset_id: string | null
          edit_type: string | null
          error_message: string | null
          estimated_cost_cents: number | null
          external_provider_id: string | null
          generation_time_seconds: number | null
          id: string
          image_height: number
          image_width: number
          metadata: Json
          model_name: string
          organization_id: string
          prompt: string
          provider_name: string
          result_image_url: string | null
          saved_to_dam: boolean
          second_image_url: string | null
          source_dam_asset_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aspect_ratio?: string | null
          base_image_url?: string | null
          cost_cents?: number
          created_at?: string
          dam_asset_id?: string | null
          edit_type?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          external_provider_id?: string | null
          generation_time_seconds?: number | null
          id?: string
          image_height?: number
          image_width?: number
          metadata?: Json
          model_name?: string
          organization_id: string
          prompt: string
          provider_name?: string
          result_image_url?: string | null
          saved_to_dam?: boolean
          second_image_url?: string | null
          source_dam_asset_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aspect_ratio?: string | null
          base_image_url?: string | null
          cost_cents?: number
          created_at?: string
          dam_asset_id?: string | null
          edit_type?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          external_provider_id?: string | null
          generation_time_seconds?: number | null
          id?: string
          image_height?: number
          image_width?: number
          metadata?: Json
          model_name?: string
          organization_id?: string
          prompt?: string
          provider_name?: string
          result_image_url?: string | null
          saved_to_dam?: boolean
          second_image_url?: string | null
          source_dam_asset_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_generations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_private: boolean
          lead_id: string
          note_type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          lead_id: string
          note_type?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          lead_id?: string
          note_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "chat_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color_class: string | null
          content: string | null
          created_at: string
          id: string
          organization_id: string
          position: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color_class?: string | null
          content?: string | null
          created_at?: string
          id?: string
          organization_id: string
          position?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color_class?: string | null
          content?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          position?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_access_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          organization_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          organization_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_access_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_domains: {
        Row: {
          created_at: string
          domain_name: string
          organization_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain_name: string
          organization_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain_name?: string
          organization_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          organization_id: string
          role: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          feature_flags: Json
          id: string
          name: string
          owner_user_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_flags?: Json
          id?: string
          name: string
          owner_user_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_flags?: Json
          id?: string
          name?: string
          owner_user_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_super_admin: boolean
          last_sign_in_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          last_sign_in_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          last_sign_in_at?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_global: boolean
          last_used_at: string | null
          name: string
          organization_id: string
          search_criteria: Json
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          last_used_at?: string | null
          name: string
          organization_id: string
          search_criteria?: Json
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          last_used_at?: string | null
          name?: string
          organization_id?: string
          search_criteria?: Json
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_audit: {
        Row: {
          action: string
          id: string
          notes: string | null
          performed_at: string
          performed_by_user_id: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by_user_id?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by_user_id?: string | null
          target_user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          primary_image_path: string
          secondary_image_path: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          primary_image_path: string
          secondary_image_path: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          primary_image_path?: string
          secondary_image_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_user_memberships: {
        Row: {
          created_at: string
          role_in_team: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_in_team?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_in_team?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_user_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      TtsPrediction: {
        Row: {
          createdAt: string
          errorMessage: string | null
          id: string
          inputText: string
          is_output_url_problematic: boolean
          organization_id: string
          output_content_type: string | null
          output_file_size: number | null
          output_storage_path: string | null
          output_url_last_error: string | null
          outputAssetId: string | null
          outputUrl: string | null
          prediction_provider: string | null
          replicatePredictionId: string
          sourceAssetId: string | null
          status: string
          updatedAt: string
          userId: string
          voiceId: string | null
        }
        Insert: {
          createdAt?: string
          errorMessage?: string | null
          id?: string
          inputText: string
          is_output_url_problematic?: boolean
          organization_id: string
          output_content_type?: string | null
          output_file_size?: number | null
          output_storage_path?: string | null
          output_url_last_error?: string | null
          outputAssetId?: string | null
          outputUrl?: string | null
          prediction_provider?: string | null
          replicatePredictionId: string
          sourceAssetId?: string | null
          status: string
          updatedAt?: string
          userId: string
          voiceId?: string | null
        }
        Update: {
          createdAt?: string
          errorMessage?: string | null
          id?: string
          inputText?: string
          is_output_url_problematic?: boolean
          organization_id?: string
          output_content_type?: string | null
          output_file_size?: number | null
          output_storage_path?: string | null
          output_url_last_error?: string | null
          outputAssetId?: string | null
          outputUrl?: string | null
          prediction_provider?: string | null
          replicatePredictionId?: string
          sourceAssetId?: string | null
          status?: string
          updatedAt?: string
          userId?: string
          voiceId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TtsPrediction_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TtsPrediction_outputAssetId_fkey"
            columns: ["outputAssetId"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TtsPrediction_sourceAssetId_fkey"
            columns: ["sourceAssetId"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organization_context: {
        Row: {
          active_organization_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_organization_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_organization_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_context_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organization_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          metadata: Json | null
          organization_id: string
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organization_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organization_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_users_in_same_org: {
        Args: { p_target_user_id: string }
        Returns: boolean
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      debug_get_all_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      find_similar_vectors: {
        Args: {
          query_organization_id: string
          query_chatbot_config_id: string
          query_vector: string
          similarity_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          organization_id: string
          chatbot_config_id: string
          knowledge_item_id: string
          vector: string
          content_hash: string
          metadata: Json
          created_at: string
          updated_at: string
          similarity: number
        }[]
      }
      get_active_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_audit_trail: {
        Args: {
          p_organization_id?: string
          p_start_date?: string
          p_end_date?: string
          p_action?: string
          p_limit?: number
        }
        Returns: {
          id: string
          user_id: string
          organization_id: string
          action: string
          details: Json
          ip_address: unknown
          user_agent: string
          session_id: string
          created_at: string
          user_email: string
          organization_name: string
        }[]
      }
      get_current_auth_uid_for_test: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_folder_path: {
        Args: { p_folder_id: string }
        Returns: {
          id: string
          name: string
          depth: number
        }[]
      }
      get_generation_summaries: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          organization_id: string
          user_id: string
          prompt_preview: string
          model_name: string
          provider_name: string
          status: string
          cost_cents: number
          generation_time_seconds: number
          saved_to_dam: boolean
          created_at: string
          updated_at: string
        }[]
      }
      get_organization_id_from_session: {
        Args: { session_id: string }
        Returns: string
      }
      get_organization_members_with_profiles: {
        Args: { target_org_id: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_user_accessible_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          organization_id: string
          organization_name: string
          role_name: string
        }[]
      }
      get_user_generation_stats: {
        Args: { target_user_id: string }
        Returns: {
          total_generations: number
          completed_generations: number
          failed_generations: number
          total_cost_cents: number
          avg_generation_time_seconds: number
          saved_to_dam_count: number
        }[]
      }
      get_users_invitation_details: {
        Args: { user_ids_to_check: string[]; p_organization_id: string }
        Returns: {
          id: string
          invited_at: string
        }[]
      }
      get_vector_stats: {
        Args: { query_organization_id: string; query_chatbot_config_id: string }
        Returns: {
          total_vectors: number
          last_updated: string
          avg_vector_age: number
          storage_size: number
        }[]
      }
      grant_super_admin: {
        Args: { target_user_id: string; notes?: string }
        Returns: boolean
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin_of_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_user_member_of_organization: {
        Args: { user_id_to_check: string; organization_id_to_check: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_organization_access: {
        Args: {
          p_user_id: string
          p_organization_id: string
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_session_id?: string
        }
        Returns: string
      }
      match_knowledge_items: {
        Args: {
          query_organization_id: string
          query_chatbot_config_id: string
          query_embedding: string
          match_threshold?: number
          match_count?: number
          intent_filter?: string
          category_filter?: string
          source_type_filter?: string
        }
        Returns: {
          id: string
          knowledge_item_id: string
          title: string
          content: string
          category: string
          tags: string[]
          source_type: string
          source_url: string
          similarity: number
        }[]
      }
      revoke_super_admin: {
        Args: { target_user_id: string; notes?: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_has_org_access: {
        Args: { org_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
