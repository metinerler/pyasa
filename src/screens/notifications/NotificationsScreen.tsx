import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api/client';
import { Colors } from '../../theme/colors';
import { Avatar } from '../../components/common/Avatar';

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  type: 'like' | 'retweet' | 'message' | 'event';
  isRead: boolean;
  createdAt: string;
  actor?: {
    name?: string;
    avatarUrl?: string;
  };
}

const ICONS: Record<NotificationItem['type'], string> = {
  like: 'heart',
  retweet: 'repeat-outline',
  message: 'mail-outline',
  event: 'calendar-outline',
};

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'şimdi';
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  return `${Math.floor(hours / 24)}g`;
}

export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    const raw = await api.get<any[]>('/notifications');
    setItems(raw);
  };

  useEffect(() => {
    void fetchNotifications().then(() => api.post('/notifications/read-all')).catch(() => undefined);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications().catch(() => undefined);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={36} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Henüz bildirim yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, !item.isRead && styles.rowUnread]}>
            <Avatar
              initials={(item.actor?.name ?? item.title).slice(0, 2).toUpperCase()}
              imageUrl={item.actor?.avatarUrl}
              size={46}
            />
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Ionicons name={ICONS[item.type] as any} size={15} color={Colors.primary} />
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
              {item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40 },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowUnread: { backgroundColor: Colors.primary + '10' },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemTitle: { color: Colors.white, fontSize: 14, fontWeight: '700', flex: 1 },
  time: { color: Colors.textSecondary, fontSize: 12 },
  body: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 74 },
  empty: { alignItems: 'center', paddingVertical: 52, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
});
