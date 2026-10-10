export interface SafeUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isPrivate: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  audience: 'public' | 'followers';
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: SafeUser;
  hasLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: SafeUser;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  updatedAt: string;
  otherParticipant: SafeUser;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  deliveryStatus: 'sent' | 'delivered' | 'read';
  createdAt: string;
}

export interface AISource {
  title?: string;
  uri?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  toolUsed?: 'search' | 'maps' | 'none';
  sources?: AISource[];
  searchQueries?: string[];
  timestamp: string;
}
