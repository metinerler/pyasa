export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  avatarInitials: string;
  bio?: string;
  role?: 'admin' | 'premium' | 'user';
  isVerified: boolean;
  isPremium: boolean;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  locationTag?: string;
  locationDistance?: string;
  category?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  retweetsCount: number;
  isLiked: boolean;
  isRetweeted: boolean;
}

export interface Event {
  id: string;
  title: string;
  imageUrl?: string;
  date: string;
  location?: string;
  organizer?: {
    name: string;
    avatarInitials: string;
    gradientColors: string[];
  };
  cardGradient?: string[];
  likesCount?: number;
  commentsCount?: number;
}

export interface Story {
  id: string;
  user: User;
  seen: boolean;
  gradientColors: string[];
}

export interface Message {
  id: string;
  sender: User;
  receiver: User;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}
