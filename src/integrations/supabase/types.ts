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
      areas_exposicao: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          loja: string | null
          nome: string
          tipo: string | null
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          loja?: string | null
          nome: string
          tipo?: string | null
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          loja?: string | null
          nome?: string
          tipo?: string | null
        }
        Relationships: []
      }
      cotacoes: {
        Row: {
          data: string | null
          fornecedor_id: string | null
          id: string
          requisicao_id: string | null
        }
        Insert: {
          data?: string | null
          fornecedor_id?: string | null
          id?: string
          requisicao_id?: string | null
        }
        Update: {
          data?: string | null
          fornecedor_id?: string | null
          id?: string
          requisicao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_abastecimento: {
        Row: {
          area_id: string | null
          escala1: number | null
          escala2: number | null
          escala3: number | null
          id: string
          produto_id: string | null
        }
        Insert: {
          area_id?: string | null
          escala1?: number | null
          escala2?: number | null
          escala3?: number | null
          id?: string
          produto_id?: string | null
        }
        Update: {
          area_id?: string | null
          escala1?: number | null
          escala2?: number | null
          escala3?: number | null
          id?: string
          produto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escala_abastecimento_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_exposicao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escala_abastecimento_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_escala_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_atual: {
        Row: {
          atualizado_em: string | null
          id: string
          loja: string | null
          produto_id: string | null
          quantidade: number | null
        }
        Insert: {
          atualizado_em?: string | null
          id?: string
          loja?: string | null
          produto_id?: string | null
          quantidade?: number | null
        }
        Update: {
          atualizado_em?: string | null
          id?: string
          loja?: string | null
          produto_id?: string | null
          quantidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_atual_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          id?: string
          nome: string
          telefone?: string | null
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      itens_cotacao: {
        Row: {
          cotacao_id: string | null
          id: string
          preco: number | null
          produto_id: string | null
          quantidade: number | null
          unidade: string | null
        }
        Insert: {
          cotacao_id?: string | null
          id?: string
          preco?: number | null
          produto_id?: string | null
          quantidade?: number | null
          unidade?: string | null
        }
        Update: {
          cotacao_id?: string | null
          id?: string
          preco?: number | null
          produto_id?: string | null
          quantidade?: number | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_cotacao_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_pedido: {
        Row: {
          id: string
          pedido_id: string | null
          preco: number | null
          produto_id: string | null
          quantidade: number | null
          tipo: string | null
          unidade: string | null
        }
        Insert: {
          id?: string
          pedido_id?: string | null
          preco?: number | null
          produto_id?: string | null
          quantidade?: number | null
          tipo?: string | null
          unidade?: string | null
        }
        Update: {
          id?: string
          pedido_id?: string | null
          preco?: number | null
          produto_id?: string | null
          quantidade?: number | null
          tipo?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_requisicao: {
        Row: {
          escala: number | null
          id: string
          multiplicador: number | null
          produto_id: string | null
          quantidade: number | null
          quantidade_calculada: number | null
          requisicao_id: string | null
        }
        Insert: {
          escala?: number | null
          id?: string
          multiplicador?: number | null
          produto_id?: string | null
          quantidade?: number | null
          quantidade_calculada?: number | null
          requisicao_id?: string | null
        }
        Update: {
          escala?: number | null
          id?: string
          multiplicador?: number | null
          produto_id?: string | null
          quantidade?: number | null
          quantidade_calculada?: number | null
          requisicao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_requisicao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_requisicao_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      pedidos_compra: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          fornecedor_id: string | null
          id: string
          status: string | null
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          fornecedor_id?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          fornecedor_id?: string | null
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome_base: string | null
          observacoes: string | null
          produto: string | null
          unidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_base?: string | null
          observacoes?: string | null
          produto?: string | null
          unidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_base?: string | null
          observacoes?: string | null
          produto?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      requisoes: {
        Row: {
          data_requisicao: string | null
          id: string
          loja: string
          status: string | null
          usuario_id: string | null
        }
        Insert: {
          data_requisicao?: string | null
          id?: string
          loja: string
          status?: string | null
          usuario_id?: string | null
        }
        Update: {
          data_requisicao?: string | null
          id?: string
          loja?: string
          status?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      sinonimos_produto: {
        Row: {
          id: string
          produto_id: string | null
          sinonimo: string
        }
        Insert: {
          id?: string
          produto_id?: string | null
          sinonimo: string
        }
        Update: {
          id?: string
          produto_id?: string | null
          sinonimo?: string
        }
        Relationships: [
          {
            foreignKeyName: "sinonimos_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          codigo_acesso: string
          criado_em: string | null
          id: string
          loja: string
          nome: string
          tipo: string
          ultimo_login: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_acesso: string
          criado_em?: string | null
          id?: string
          loja: string
          nome: string
          tipo: string
          ultimo_login?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_acesso?: string
          criado_em?: string | null
          id?: string
          loja?: string
          nome?: string
          tipo?: string
          ultimo_login?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
