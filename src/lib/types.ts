export const EMBEDDING_MODEL = 'human-3.3.6-mobileface-256-v1';
export interface Pokemon { id: number; name: string; sprite: string | null }
export interface Member { id: string; name: string; pokemon: Pokemon; embedding: number[]; createdAt: number; model: string }
export interface Capture { memberId: string; capturedAt: number }
export interface SuperadminAccount {
  email: string;
  permanent: boolean;
  superadmin: boolean;
  eligible: boolean;
  delegated: boolean;
}
export interface GameData {
  superadmin: boolean;
  members: Member[];
  captures: Capture[];
}
