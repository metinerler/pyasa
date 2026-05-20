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
    isLiked: raw.isLiked ?? false,
    isRetweeted: raw.isRetweeted ?? false,
  };
}

function mapEvent(raw: any): Event {
  return {
    id: raw.id,
    title: raw.title,
    imageUrl: raw.imageUrl ?? undefined,
    date: raw.eventDate
      ? new Date(raw.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
      : '',
    location: raw.locationName ?? undefined,
    organizer: raw.organizer
      ? {
          name: raw.organizer.name,
          avatarInitials: (raw.organizer.name ?? '??').slice(0, 2).toUpperCase(),
          gradientColors: ['#FF6333', '#A93512'],
        }
      : undefined,
    cardGradient: ['#1f1f1f', '#39180d'],
    likesCount: 0,
    commentsCount: 0,
  };
}

function storiesFromPosts(posts: Post[]): Story[] {
  const seen = new Set<string>();
  return posts
    .map((post) => post.author)
    .filter((user) => {
      if (!user.id || seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    })
    .slice(0, 12)
    .map((user) => ({
      id: user.id,
      user,
      seen: false,
      gradientColors: ['#FF6333', '#A93512'],
    }));
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
  fetchEvents: () => Promise<void>;
  refreshAll: () => Promise<void>;
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
      const posts = raw.map(mapPost);
      set({ posts, stories: storiesFromPosts(posts) });
    } catch { /* offline */ } finally {
      set({ isLoading: false });
    }
  },

  fetchEvents: async () => {
    const raw = await api.get<any[]>('/events/upcoming');
    set({ events: raw.map(mapEvent) });
  },

  refreshAll: async () => {
    set({ isLoading: true });
    try {
      const [postsRaw, eventsRaw] = await Promise.all([
        api.get<any[]>('/posts?limit=30'),
        api.get<any[]>('/events/upcoming'),
      ]);
      const posts = postsRaw.map(mapPost);
      set({
        posts,
        stories: storiesFromPosts(posts),
        events: eventsRaw.map(mapEvent),
      });
    } catch {
      // Keep existing data if the network is unavailable.
    } finally {
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
      const post = mapPost(raw);
      set((state) => {
        const posts = [post, ...state.posts];
        return { posts, stories: storiesFromPosts(posts) };
      });
    } else {
      const raw = await api.post<any>('/posts', { content, category, locationTag });
      const post = mapPost(raw);
      set((state) => {
        const posts = [post, ...state.posts];
        return { posts, stories: storiesFromPosts(posts) };
      });
    }
  },
}));
