import { createClient } from '@supabase/supabase-js'

// 環境変数のチェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Supabase環境変数が設定されていません')
}

// Supabaseクライアントの作成（シングルトン）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TypeScript型定義（後で拡張）
export type Database = {
	public: {
		Tables: {
			users: {
				Row: {
					id: string
					slack_user_id: string
					slack_team_id: string
					name: string
					email: string | null
					avatar_url: string | null
					is_admin: boolean
					created_at: string
					updated_at: string
				}
				Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
				Update: Partial<Database['public']['Tables']['users']['Insert']>
			}
			events: {
				Row: {
					id: string
					creator_id: string
					title: string
					description: string | null
					slack_channel_id: string | null
					slack_message_ts: string | null
					share_link: string | null
					is_active: boolean
					created_at: string
					updated_at: string
				}
				Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
				Update: Partial<Database['public']['Tables']['events']['Insert']>
			}
			event_dates: {
				Row: {
					id: string
					event_id: string
					date_time: string
					display_order: number
					created_at: string
				}
				Insert: Omit<Database['public']['Tables']['event_dates']['Row'], 'id' | 'created_at'>
				Update: Partial<Database['public']['Tables']['event_dates']['Insert']>
			}
			responses: {
				Row: {
					id: string
					event_date_id: string
					user_id: string | null
					slack_user_id: string | null
					user_name: string
					can_attend: boolean
					created_at: string
					updated_at: string
				}
				Insert: Omit<Database['public']['Tables']['responses']['Row'], 'id' | 'created_at' | 'updated_at'>
				Update: Partial<Database['public']['Tables']['responses']['Insert']>
			}
		}
	}
}