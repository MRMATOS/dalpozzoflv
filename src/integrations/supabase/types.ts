export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
          enviado_em: string | null
          fornecedor_id: string | null
          id: string
          produtos_extraidos: Json | null
          requisicao_id: string | null
          tabela_comparativa: Json | null
          user_id: string | null
        }
        Insert: {
          data?: string | null
          enviado_em?: string | null
          fornecedor_id?: string | null
          id?: string
          produtos_extraidos?: Json | null
          requisicao_id?: string | null
          tabela_comparativa?: Json | null
          user_id?: string | null
        }
        Update: {
          data?: string | null
          enviado_em?: string | null
          fornecedor_id?: string | null
          id?: string
          produtos_extraidos?: Json | null
          requisicao_id?: string | null
          tabela_comparativa?: Json | null
          user_id?: string | null
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
            referencedRelation: "requisicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      divergencias_transferencias: {
        Row: {
          criado_em: string | null
          descricao: string
          id: string
          quantidade_esperada: number | null
          quantidade_real: number | null
          resolvido: boolean | null
          resolvido_em: string | null
          resolvido_por: string | null
          tipo_divergencia: string
          transferencia_id: string | null
        }
        Insert: {
          criado_em?: string | null
          descricao: string
          id?: string
          quantidade_esperada?: number | null
          quantidade_real?: number | null
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo_divergencia: string
          transferencia_id?: string | null
        }
        Update: {
          criado_em?: string | null
          descricao?: string
          id?: string
          quantidade_esperada?: number | null
          quantidade_real?: number | null
          resolvido?: boolean | null
          resolvido_em?: string | null
          resolvido_por?: string | null
          tipo_divergencia?: string
          transferencia_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "divergencias_transferencias_transferencia_id_fkey"
            columns: ["transferencia_id"]
            isOneToOne: false
            referencedRelation: "transferencias"
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
            foreignKeyName: "escala_abastecimento_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escala_abastecimento_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
          {
            foreignKeyName: "fk_escala_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_escala_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_escala_produto"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
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
          {
            foreignKeyName: "estoque_atual_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_atual_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
        ]
      }
      estoque_cotacao: {
        Row: {
          atualizado_por: string | null
          data_atualizacao: string
          id: string
          loja: string
          produto_id: string | null
          quantidade: number
          unidade: string
        }
        Insert: {
          atualizado_por?: string | null
          data_atualizacao?: string
          id?: string
          loja: string
          produto_id?: string | null
          quantidade?: number
          unidade?: string
        }
        Update: {
          atualizado_por?: string | null
          data_atualizacao?: string
          id?: string
          loja?: string
          produto_id?: string | null
          quantidade?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "estoque_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
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
          fornecedor_nome: string | null
          id: string
          preco: number | null
          produto_id: string | null
          produto_nome: string | null
          quantidade: number | null
          tipo: string | null
          unidade: string | null
        }
        Insert: {
          cotacao_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          preco?: number | null
          produto_id?: string | null
          produto_nome?: string | null
          quantidade?: number | null
          tipo?: string | null
          unidade?: string | null
        }
        Update: {
          cotacao_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          preco?: number | null
          produto_id?: string | null
          produto_nome?: string | null
          quantidade?: number | null
          tipo?: string | null
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
          {
            foreignKeyName: "itens_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_cotacao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
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
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_pedido_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
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
            foreignKeyName: "itens_requisicao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_requisicao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
          {
            foreignKeyName: "itens_requisicao_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          id: string
          is_cd: boolean | null
          nome: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          is_cd?: boolean | null
          nome: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          id?: string
          is_cd?: boolean | null
          nome?: string
        }
        Relationships: []
      }
      pedidos_compra: {
        Row: {
          cotacao_id: string | null
          criado_em: string | null
          criado_por: string | null
          fornecedor_id: string | null
          id: string
          status: string | null
          total: number | null
          user_id: string | null
        }
        Insert: {
          cotacao_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          fornecedor_id?: string | null
          id?: string
          status?: string | null
          total?: number | null
          user_id?: string | null
        }
        Update: {
          cotacao_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          fornecedor_id?: string | null
          id?: string
          status?: string | null
          total?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "pedidos_compra_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          media_por_caixa: number | null
          nome_base: string | null
          nome_variacao: string | null
          observacoes: string | null
          ordem_exibicao: number | null
          produto: string | null
          produto_pai_id: string | null
          unidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          media_por_caixa?: number | null
          nome_base?: string | null
          nome_variacao?: string | null
          observacoes?: string | null
          ordem_exibicao?: number | null
          produto?: string | null
          produto_pai_id?: string | null
          unidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          media_por_caixa?: number | null
          nome_base?: string | null
          nome_variacao?: string | null
          observacoes?: string | null
          ordem_exibicao?: number | null
          produto?: string | null
          produto_pai_id?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          codigo_acesso: string
          created_at: string | null
          id: string
          loja: string
          nome: string
          ultimo_login: string | null
        }
        Insert: {
          ativo?: boolean | null
          codigo_acesso: string
          created_at?: string | null
          id: string
          loja: string
          nome: string
          ultimo_login?: string | null
        }
        Update: {
          ativo?: boolean | null
          codigo_acesso?: string
          created_at?: string | null
          id?: string
          loja?: string
          nome?: string
          ultimo_login?: string | null
        }
        Relationships: []
      }
      recebimentos: {
        Row: {
          criado_em: string
          finalizado_em: string | null
          finalizado_por: string | null
          fornecedor: string | null
          id: string
          iniciado_por: string | null
          modo_pesagem: string | null
          observacoes: string | null
          origem: string | null
          peso_medio_calculado: number | null
          peso_total_informado: number | null
          quantidade_pallets_informada: number | null
          status: string
          total_peso_bruto: number | null
          total_peso_liquido: number | null
          total_produtos: number | null
        }
        Insert: {
          criado_em?: string
          finalizado_em?: string | null
          finalizado_por?: string | null
          fornecedor?: string | null
          id?: string
          iniciado_por?: string | null
          modo_pesagem?: string | null
          observacoes?: string | null
          origem?: string | null
          peso_medio_calculado?: number | null
          peso_total_informado?: number | null
          quantidade_pallets_informada?: number | null
          status?: string
          total_peso_bruto?: number | null
          total_peso_liquido?: number | null
          total_produtos?: number | null
        }
        Update: {
          criado_em?: string
          finalizado_em?: string | null
          finalizado_por?: string | null
          fornecedor?: string | null
          id?: string
          iniciado_por?: string | null
          modo_pesagem?: string | null
          observacoes?: string | null
          origem?: string | null
          peso_medio_calculado?: number | null
          peso_total_informado?: number | null
          quantidade_pallets_informada?: number | null
          status?: string
          total_peso_bruto?: number | null
          total_peso_liquido?: number | null
          total_produtos?: number | null
        }
        Relationships: []
      }
      recebimentos_pallets: {
        Row: {
          id: string
          observacoes: string | null
          ordem: number
          peso_kg: number
          recebimento_id: string
          registrado_em: string
        }
        Insert: {
          id?: string
          observacoes?: string | null
          ordem: number
          peso_kg: number
          recebimento_id: string
          registrado_em?: string
        }
        Update: {
          id?: string
          observacoes?: string | null
          ordem?: number
          peso_kg?: number
          recebimento_id?: string
          registrado_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_pallets_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos_produtos: {
        Row: {
          estoque_atualizado: boolean | null
          id: string
          loja_destino: string
          pallets_utilizados: number[] | null
          peso_bruto_kg: number
          peso_liquido_kg: number
          produto_id: string | null
          produto_nome: string
          quantidade_caixas: number | null
          recebimento_id: string
          registrado_em: string
          registrado_por: string | null
          tara_caixas_kg: number | null
          tara_pallets_kg: number | null
          tipo_caixa_id: string | null
          tipo_caixa_nome: string | null
        }
        Insert: {
          estoque_atualizado?: boolean | null
          id?: string
          loja_destino: string
          pallets_utilizados?: number[] | null
          peso_bruto_kg: number
          peso_liquido_kg: number
          produto_id?: string | null
          produto_nome: string
          quantidade_caixas?: number | null
          recebimento_id: string
          registrado_em?: string
          registrado_por?: string | null
          tara_caixas_kg?: number | null
          tara_pallets_kg?: number | null
          tipo_caixa_id?: string | null
          tipo_caixa_nome?: string | null
        }
        Update: {
          estoque_atualizado?: boolean | null
          id?: string
          loja_destino?: string
          pallets_utilizados?: number[] | null
          peso_bruto_kg?: number
          peso_liquido_kg?: number
          produto_id?: string | null
          produto_nome?: string
          quantidade_caixas?: number | null
          recebimento_id?: string
          registrado_em?: string
          registrado_por?: string | null
          tara_caixas_kg?: number | null
          tara_pallets_kg?: number | null
          tipo_caixa_id?: string | null
          tipo_caixa_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
          {
            foreignKeyName: "recebimentos_produtos_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimentos_produtos_tipo_caixa_id_fkey"
            columns: ["tipo_caixa_id"]
            isOneToOne: false
            referencedRelation: "tipos_caixas"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes: {
        Row: {
          data_requisicao: string | null
          id: string
          loja: string
          status: string | null
          user_id: string | null
          usuario_id: string | null
        }
        Insert: {
          data_requisicao?: string | null
          id?: string
          loja: string
          status?: string | null
          user_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          data_requisicao?: string | null
          id?: string
          loja?: string
          status?: string | null
          user_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_requisicoes_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "sinonimos_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sinonimos_produto_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
        ]
      }
      tipos_caixas: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          tara_kg: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          tara_kg?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          tara_kg?: number
        }
        Relationships: []
      }
      transferencias: {
        Row: {
          confirmado_em: string | null
          confirmado_por: string | null
          criado_em: string
          id: string
          loja_destino: string
          loja_origem: string
          produto_id: string | null
          quantidade_requisitada: number
          quantidade_transferida: number | null
          requisicao_id: string | null
          status: string
          transferido_por: string | null
        }
        Insert: {
          confirmado_em?: string | null
          confirmado_por?: string | null
          criado_em?: string
          id?: string
          loja_destino: string
          loja_origem?: string
          produto_id?: string | null
          quantidade_requisitada?: number
          quantidade_transferida?: number | null
          requisicao_id?: string | null
          status?: string
          transferido_por?: string | null
        }
        Update: {
          confirmado_em?: string | null
          confirmado_por?: string | null
          criado_em?: string
          id?: string
          loja_destino?: string
          loja_origem?: string
          produto_id?: string | null
          quantidade_requisitada?: number
          quantidade_transferida?: number | null
          requisicao_id?: string | null
          status?: string
          transferido_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_confirmado_por_fkey"
            columns: ["confirmado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
          {
            foreignKeyName: "transferencias_requisicao_id_fkey"
            columns: ["requisicao_id"]
            isOneToOne: false
            referencedRelation: "requisicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_transferido_por_fkey"
            columns: ["transferido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      transferencias_logs: {
        Row: {
          criado_em: string | null
          id: string
          observacoes: string | null
          quantidade_anterior: number | null
          quantidade_nova: number | null
          status_anterior: string | null
          status_novo: string
          transferencia_id: string | null
          usuario_id: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: string
          observacoes?: string | null
          quantidade_anterior?: number | null
          quantidade_nova?: number | null
          status_anterior?: string | null
          status_novo: string
          transferencia_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: string
          observacoes?: string | null
          quantidade_anterior?: number | null
          quantidade_nova?: number | null
          status_anterior?: string | null
          status_novo?: string
          transferencia_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_logs_transferencia_id_fkey"
            columns: ["transferencia_id"]
            isOneToOne: false
            referencedRelation: "transferencias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at: string
          enabled: boolean
          id: string
          resource: Database["public"]["Enums"]["system_resource"]
          updated_at: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          enabled?: boolean
          id?: string
          resource: Database["public"]["Enums"]["system_resource"]
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          enabled?: boolean
          id?: string
          resource?: Database["public"]["Enums"]["system_resource"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          aprovado: boolean | null
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
          aprovado?: boolean | null
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
          aprovado?: boolean | null
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
      produtos_com_pai: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string | null
          media_por_caixa: number | null
          nome_base: string | null
          nome_variacao: string | null
          observacoes: string | null
          ordem_exibicao: number | null
          produto: string | null
          produto_pai_id: string | null
          produto_pai_id_ref: string | null
          produto_pai_nome: string | null
          unidade: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_produto_pai_id_fkey"
            columns: ["produto_pai_id"]
            isOneToOne: false
            referencedRelation: "produtos_com_pai"
            referencedColumns: ["produto_pai_id_ref"]
          },
        ]
      }
    }
    Functions: {
      aprovar_usuario: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      calcular_tara_pallets: {
        Args: { _recebimento_id: string; _pallets_utilizados: number[] }
        Returns: number
      }
      check_produto_dependencies: {
        Args: { produto_uuid: string }
        Returns: {
          has_estoque: boolean
          has_requisicoes: boolean
          has_cotacoes: boolean
          estoque_total: number
          message: string
        }[]
      }
      clear_produto_estoque: {
        Args: { produto_uuid: string }
        Returns: boolean
      }
      force_delete_fornecedor: {
        Args: { fornecedor_uuid: string }
        Returns: boolean
      }
      force_delete_produto: {
        Args: { produto_uuid: string }
        Returns: boolean
      }
      get_cd_loja: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_default_permissions_for_type: {
        Args: { user_type: string }
        Returns: {
          resource: Database["public"]["Enums"]["system_resource"]
          action: Database["public"]["Enums"]["permission_action"]
        }[]
      }
      get_transferencia_historico: {
        Args: { transferencia_uuid: string }
        Returns: {
          id: string
          tipo: string
          descricao: string
          status_anterior: string
          status_novo: string
          quantidade_anterior: number
          quantidade_nova: number
          usuario_nome: string
          criado_em: string
        }[]
      }
      get_user_loja: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_loja_new: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          resource: Database["public"]["Enums"]["system_resource"]
          action: Database["public"]["Enums"]["permission_action"]
          enabled: boolean
        }[]
      }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          ativo: boolean | null
          codigo_acesso: string
          created_at: string | null
          id: string
          loja: string
          nome: string
          ultimo_login: string | null
        }
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_cd_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_comprador_or_master: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_master_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_master: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      populate_default_permissions: {
        Args: { target_user_id: string; user_type: string }
        Returns: undefined
      }
      user_exists_in_usuarios: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_permission: {
        Args: {
          _user_id: string
          _resource: Database["public"]["Enums"]["system_resource"]
          _action: Database["public"]["Enums"]["permission_action"]
        }
        Returns: boolean
      }
      validate_user_role_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "comprador" | "estoque" | "cd"
      permission_action: "view" | "edit" | "create" | "delete"
      system_resource:
        | "dashboard"
        | "estoque"
        | "requisicoes"
        | "cotacao"
        | "gestao_cd"
        | "configuracoes"
        | "historico_requisicoes"
        | "historico_pedidos"
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
      app_role: ["master", "comprador", "estoque", "cd"],
      permission_action: ["view", "edit", "create", "delete"],
      system_resource: [
        "dashboard",
        "estoque",
        "requisicoes",
        "cotacao",
        "gestao_cd",
        "configuracoes",
        "historico_requisicoes",
        "historico_pedidos",
      ],
    },
  },
} as const
