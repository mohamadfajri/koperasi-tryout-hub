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
      app_settings: {
        Row: {
          key: string
          tryout_enabled: boolean
          updated_at: string
        }
        Insert: {
          key: string
          tryout_enabled?: boolean
          updated_at?: string
        }
        Update: {
          key?: string
          tryout_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      jawaban_user: {
        Row: {
          created_at: string
          id: string
          is_benar: boolean | null
          jawaban: string | null
          sesi_id: string
          soal_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_benar?: boolean | null
          jawaban?: string | null
          sesi_id: string
          soal_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_benar?: boolean | null
          jawaban?: string | null
          sesi_id?: string
          soal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jawaban_user_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_tryout"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jawaban_user_soal_id_fkey"
            columns: ["soal_id"]
            isOneToOne: false
            referencedRelation: "soal"
            referencedColumns: ["id"]
          },
        ]
      }
      paket_tryout: {
        Row: {
          created_at: string
          deskripsi: string | null
          durasi_menit: number
          harga: number
          id: string
          is_aktif: boolean
          is_gratis: boolean
          judul: string
          jumlah_soal: number
          max_attempts: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          durasi_menit?: number
          harga?: number
          id?: string
          is_aktif?: boolean
          is_gratis?: boolean
          judul: string
          jumlah_soal?: number
          max_attempts?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          durasi_menit?: number
          harga?: number
          id?: string
          is_aktif?: boolean
          is_gratis?: boolean
          judul?: string
          jumlah_soal?: number
          max_attempts?: number
          updated_at?: string
        }
        Relationships: []
      }
      pembayaran: {
        Row: {
          bukti_url: string | null
          catatan_admin: string | null
          created_at: string
          id: string
          nominal: number
          paket_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bukti_url?: string | null
          catatan_admin?: string | null
          created_at?: string
          id?: string
          nominal: number
          paket_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bukti_url?: string | null
          catatan_admin?: string | null
          created_at?: string
          id?: string
          nominal?: number
          paket_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_paket_id_fkey"
            columns: ["paket_id"]
            isOneToOne: false
            referencedRelation: "paket_tryout"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sesi_tryout: {
        Row: {
          created_at: string
          id: string
          jumlah_benar: number | null
          jumlah_salah: number | null
          paket_id: string
          skor: number | null
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
          waktu_mulai: string
          waktu_selesai: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jumlah_benar?: number | null
          jumlah_salah?: number | null
          paket_id: string
          skor?: number | null
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
          waktu_mulai?: string
          waktu_selesai?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jumlah_benar?: number | null
          jumlah_salah?: number | null
          paket_id?: string
          skor?: number | null
          status?: Database["public"]["Enums"]["session_status"]
          user_id?: string
          waktu_mulai?: string
          waktu_selesai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sesi_tryout_paket_id_fkey"
            columns: ["paket_id"]
            isOneToOne: false
            referencedRelation: "paket_tryout"
            referencedColumns: ["id"]
          },
        ]
      }
      soal: {
        Row: {
          created_at: string
          id: string
          jawaban_benar: string
          nomor: number
          opsi_a: string
          opsi_b: string
          opsi_c: string
          opsi_d: string
          opsi_e: string | null
          paket_id: string
          pembahasan: string | null
          pertanyaan: string
        }
        Insert: {
          created_at?: string
          id?: string
          jawaban_benar: string
          nomor: number
          opsi_a: string
          opsi_b: string
          opsi_c: string
          opsi_d: string
          opsi_e?: string | null
          paket_id: string
          pembahasan?: string | null
          pertanyaan: string
        }
        Update: {
          created_at?: string
          id?: string
          jawaban_benar?: string
          nomor?: number
          opsi_a?: string
          opsi_b?: string
          opsi_c?: string
          opsi_d?: string
          opsi_e?: string | null
          paket_id?: string
          pembahasan?: string | null
          pertanyaan?: string
        }
        Relationships: [
          {
            foreignKeyName: "soal_paket_id_fkey"
            columns: ["paket_id"]
            isOneToOne: false
            referencedRelation: "paket_tryout"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_paid_access: {
        Args: { _paket_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      payment_status: "pending" | "approved" | "rejected"
      session_status: "in_progress" | "completed" | "abandoned"
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
      app_role: ["admin", "user"],
      payment_status: ["pending", "approved", "rejected"],
      session_status: ["in_progress", "completed", "abandoned"],
    },
  },
} as const
