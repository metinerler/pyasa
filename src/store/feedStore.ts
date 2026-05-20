import { create } from 'zustand';
import { api } from '../api/client';
import { Post, Story, Event } from '../types';

function mapUser(raw: any) {
  return {
    id: raw?.id ?? '',
    name: raw?.name ?? '',
    username: raw?.username ?? '',
    email: raw?.email ?? '',
    avatarUrl: raw?.avatarUrl ?? undefined,
    avatarInitials: (raw?.name ?? '??').slice(0, 2).toUpperCase(),
    isVerified: raw?.isVerified ?? false,
    isPremium: raw?.isPremium ?? false,
    role: raw?.role ?? 'user',
    followersCount: raw?.followersCount ?? 0,
    followingCount: raw?.followingCount ?? 0,
    tweetsCount: raw?.postsCount ?? 0,
  };
}

function mapPost(raw: any): Post {
  return {
    id: raw.id,
    author: mapUser(raw.author),
    content: raw.content,
    imageUrl: raw.imageUrl,
    category: raw.category,
    locationTag: raw.locationTag,
    createdAt: raw.createdAt,
    likesCount: raw.likesCount ?? 0,
    commentsCount: raw.commentsCount ?? 0,
    retweetsCount: raw.retweetsCount ?? 0,
    isLiked: false,
    isRetweeted: false,
  };
}

interface AddPostImage { uri: string; name: string; type: string; }

interface FeedState {
  posts: Post[];
  stories: Story[];
  events: Event[];
  isLoading: boolean;
  activeTab: 'global' | 'nearby';
  distanceKm: number;
  activeCategory: string;
  fetchPosts: () => Promise<void>;
  setActiveTab: (tab: 'global' | 'nearby') => void;
  setDistanceKm: (km: number) => void;
  setActiveCategory: (category: string) => void;
  toggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>;
  toggleRetweet: (postId: string, currentlyRetweeted: boolean) => Promise<void>;
  addPost: (content: string, category?: string, locationTag?: string, image?: AddPostImage) => Promise<void>;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  stories: [],
  events: [],
  isLoading: false,
  activeTab: 'global',
  distanceKm: 10,
  activeCategory: 'Tümü',

  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const raw = await api.get<any[]>('/posts?limit=30');
      set({ posts: raw.map(mapPost) });
    } catch { /* offline */ } finally {
      set({ isLoading: false });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setDistanceKm: (km) => set({ distanceKm: km }),
  setActiveCategory: (category) => set({ activeCategory: category }),

  toggleLike: async (postId, currentlyLiked) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !currentlyLiked, likesCount: currentlyLiked ? p.likesCount - 1 : p.likesCount + 1 }
          : p,
      ),
    }));
    try {
      await api.post(`/posts/${postId}/${currentlyLiked ? 'unlike' : 'like'}`);
    } catch {
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: currentlyLiked, likesCount: currentlyLiked ? p.likesCount + 1 : p.likesCount - 1 }
            : p,
        ),
      }));
    }
  },

  toggleRetweet: async (postId, currentlyRetweeted) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isRetweeted: !currentlyRetweeted, retweetsCount: currentlyRetweeted ? p.retweetsCount - 1 : p.retweetsCount + 1 }
          : p,
      ),
    }));
    if (!currentlyRetweeted) await api.post(`/posts/${postId}/retweet`).catch(() => {});
  },

  addPost: async (content, category, locationTag, image) => {
    if (image) {
      const form = new FormData();
      form.append('content', content);
      if (category) form.append('category', category);
      if (locationTag) form.append('locationTag', locationTag);
      form.append('image', { uri: image.uri, name: image.name, type: image.type } as any);
      const raw = await api.postForm<any>('/posts', form);
      set((state) => ({ posts: [mapPost(raw), ...state.posts] }));
    } else {
      const raw = await api.post<any>('/posts', { content, category, locationTag });
      set((state) => ({ posts: [mapPost(raw), ...state.posts] }));
    }
  },
}));

