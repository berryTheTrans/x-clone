export interface Post {
  id: string;
  content: string;
  mediaUrl?: string; // Base64 string for P2P simplicity
  mediaType?: 'image' | 'video';
  timestamp: number;
  authorId: string;
}

export interface UserProfile {
  id: string; // PeerID
  username: string;
  bio: string;
  avatarUrl?: string;
}

export interface P2PMessage {
  type: 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'NEW_POST';
  payload: any;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
