import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Avatar } from '../../components/common/Avatar';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Message, User } from '../../types';

interface ConversationRow {
  id: string;
  participant: User;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'şimdi';
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  return `${Math.floor(hours / 24)}g`;
}

function mapUser(raw: any): User {
  return {
    id: raw?.id ?? '',
    name: raw?.name ?? '',
    username: raw?.username ?? '',
    email: raw?.email ?? '',
    avatarUrl: raw?.avatarUrl ?? undefined,
    avatarInitials: (raw?.name ?? '??').slice(0, 2).toUpperCase(),
    bio: raw?.bio,
    role: raw?.role ?? 'user',
    isVerified: raw?.isVerified ?? false,
    isPremium: raw?.isPremium ?? false,
    followersCount: raw?.followersCount ?? 0,
    followingCount: raw?.followingCount ?? 0,
    tweetsCount: raw?.postsCount ?? 0,
  };
}

export const MessagesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async () => {
    const raw = await api.get<any[]>('/messages');
    setMessages(raw.map((msg) => ({
      id: msg.id,
      sender: mapUser(msg.sender),
      receiver: mapUser(msg.receiver),
      content: msg.content,
      createdAt: msg.createdAt,
      isRead: msg.isRead,
    })));
  };

  useEffect(() => {
    void fetchMessages().catch(() => undefined);
  }, []);

  const conversations = useMemo<ConversationRow[]>(() => {
    if (!currentUser) return [];

    const byParticipant = new Map<string, ConversationRow>();
    messages.forEach((message) => {
      const participant = message.sender.id === currentUser.id ? message.receiver : message.sender;
      const current = byParticipant.get(participant.id);
      const unread = message.receiver.id === currentUser.id && !message.isRead ? 1 : 0;

      if (!current) {
        byParticipant.set(participant.id, {
          id: participant.id,
          participant,
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
          unread,
        });
        return;
      }

      current.unread += unread;
      if (new Date(message.createdAt) > new Date(current.lastMessageAt)) {
        current.lastMessage = message.content;
        current.lastMessageAt = message.createdAt;
      }
    });

    return [...byParticipant.values()].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
  }, [currentUser, messages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages().catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesajlar</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={34} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Henüz mesaj yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row}>
            <Avatar
              initials={item.participant.avatarInitials}
              imageUrl={item.participant.avatarUrl}
              size={50}
              isPremium={item.participant.isPremium}
            />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.participant.name}</Text>
                <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
              </View>
              <View style={styles.msgRow}>
                <Text style={styles.lastMsg} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  time: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMsg: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 78,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
