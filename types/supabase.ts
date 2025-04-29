export type Bookstore = {
  id: string
  number: number
  prefecture: string
  prefecture_number: number
  city: string
  registered_name: string
  name: string
  opening_hour: string | null
  establishment_year: string | null
  address: string
  special_edition: boolean
  close_info: string | null
}

export type UpdateLog = {
  id: string
  created_at: string
  status: 'success' | 'error'
  message: string
  error_details: string | null
}

export type Database = {
  public: {
    Tables: {
      bookstores: {
        Row: Bookstore
        Insert: Omit<Bookstore, 'id'>
        Update: Partial<Omit<Bookstore, 'id'>>
      }
      update_logs: {
        Row: UpdateLog
        Insert: Omit<UpdateLog, 'id' | 'created_at'>
        Update: Partial<Omit<UpdateLog, 'id' | 'created_at'>>
      }
    }
  }
} 