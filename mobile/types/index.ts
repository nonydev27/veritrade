export interface Transaction {
  id: number;
  transaction_code: string;
  buyer_id: number;
  seller_id: number;
  item_description: string;
  amount: number;
  status: string;
  expires_at?: string | null;
  created_at: string;
  accepted_at?: string | null;
  funded_at?: string | null;
  shipped_at?: string | null;
  completed_at?: string | null;
  rejected_at?: string | null;
  refunded_at?: string | null;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  kyc_status?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
  ts: number;
  streaming?: boolean;
}
