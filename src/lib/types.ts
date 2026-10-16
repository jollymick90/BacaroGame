export const EMBEDDING_MODEL = 'human-3.3.6-mobileface-256-v1';
export interface Pokemon { id: number; name: string; sprite: string | null }
export interface Member { id: string; name: string; pokemon: Pokemon; embedding: number[]; createdAt: number; model: string }
export interface Capture { memberId: string; capturedAt: number }
export interface GameData { members: Member[]; captures: Capture[] }
