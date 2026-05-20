import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { useFeedStore } from '../../store/feedStore';
import { PostCard } from '../../components/common/PostCard';
import { StoryCircle } from '../../components/common/StoryCircle';
import { CategoryChip } from '../../components/common/CategoryChip';
import { Avatar } from '../../components/common/Avatar';
import { Event } from '../../types';
import { api } from '../../api/client';

const CATEGORIES = [
  { label: 'Tümü', icon: 'sparkles-outline' },
  { label: 'Araba & Sürüş', icon: 'car-sport-outline' },
  { label: 'Kahve', icon: 'cafe-outline' },
  { label: 'Kitap', icon: 'book-outline' },
  { label: 'Müzik', icon: 'musical-notes-outline' },
  { label: 'Spor', icon: 'barbell-outline' },
];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

function EventCard({ event }: { event: Event }) {
  const [liked, setLiked] = useState(false);
  const gradient = (event.cardGradient ?? ['#1a1a2e', '#0f3460']) as [string, string, ...string[]];

  return (
    <TouchableOpacity style={styles.eventCard} activeOpacity={0.88}>
      <LinearGradient colors={gradient} style={styles.eventCardGradient}>
        {/* Title overlay at top */}
        <View style={styles.eventCardTop}>
          <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.eventCardLocation}>{event.location}</Text>
        </View>

        {/* Bottom bar: organizer + actions */}
        <View style={styles.eventCardBottom}>
          <View style={styles.eventCardOrganizer}>
            <LinearGradient
              colors={(event.organizer?.gradientColors ?? ['#FF6A00', '#FF0000']) as [string, string, ...string[]]}
              style={styles.eventCardAvatar}
            >
              <Text style={styles.eventCardAvatarText}>
                {event.organizer?.avatarInitials ?? '??'}
              </Text>
            </LinearGradient>
            <Text style={styles.eventCardOrgName} numberOfLines={1}>
              {event.organizer?.name ?? 'Bilinmiyor'}
            </Text>
          </View>
          <View style={styles.eventCardActions}>
            <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.eventCardAction}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={18}
                color={liked ? '#FF3B30' : Colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.eventCardAction}>
              <Ionicons name="chatbubble-outline" size={17} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.eventCardAction}>
              <Ionicons name="paper-plane-outline" size={17} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, localAvatarUri } = useAuthStore();
  const {
    posts,
    stories,
    events,
    activeTab,
    distanceKm,
    activeCategory,
    setActiveTab,
    setDistanceKm,
    setActiveCategory,
    toggleLike,
    toggleRetweet,
    addPost,
    refreshAll,
  } = useFeedStore();

  const [postText, setPostText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchUnreadNotifications = async () => {
    const result = await api.get<{ count: number }>('/notifications/unread-count');
    setUnreadNotifications(result.count);
  };

  useEffect(() => {
    void refreshAll();
    void fetchUnreadNotifications().catch(() => undefined);
  }, [refreshAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    await fetchUnreadNotifications().catch(() => undefined);
    setRefreshing(false);
  };

  const handleShare = () => {
    if (!postText.trim()) return;
    addPost(postText.trim(), undefined, undefined);
    setPostText('');
  };

  const filteredPosts = posts.filter((p) =>
    activeCategory === 'Tümü' ? true : p.category === activeCategory
  );

  // Pair events into rows of 2 for the grid
  const eventRows: Event[][] = [];
  for (let i = 0; i < events.length; i += 2) {
    eventRows.push(events.slice(i, i + 2));
  }

  const ListHeader = () => (
    <View>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          {localAvatarUri || user?.avatarUrl ? (
            <Image
              source={{ uri: localAvatarUri ?? user!.avatarUrl! }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          ) : (
            <LinearGradient colors={['#FF6A00', '#FF0000']} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>{user?.avatarInitials ?? 'PA'}</Text>
            </LinearGradient>
          )}
          <Text style={styles.headerName}>{user?.name ?? user?.username}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search" size={21} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setUnreadNotifications(0);
              navigation.navigate('Notifications');
            }}
          >
            <Ionicons name="notifications" size={21} color={Colors.white} />
            {unreadNotifications > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Anlık ── */}
      <Text style={styles.sectionTitle}>Anlık</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesScroll}
      >
        {/* Add Note */}
        <TouchableOpacity style={styles.storyItem}>
          <View style={styles.addStoryCircle}>
            <Ionicons name="add" size={26} color={Colors.white} />
          </View>
          <Text style={styles.storyLabel}>Add Note</Text>
        </TouchableOpacity>

        {stories.map((story) => (
          <StoryCircle key={story.id} story={story} />
        ))}
      </ScrollView>

      {/* ── Etkinlikler ── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Etkinlikler</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Tümünü Gör</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsGrid}>
        {eventRows.map((row, ri) => (
          <View key={ri} style={styles.eventsRow}>
            {row.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </View>
        ))}
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'global' && styles.tabActive]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>Global</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.tabActive]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>Mesafe</Text>
        </TouchableOpacity>
      </View>

      {/* Distance Filter */}
      {activeTab === 'nearby' && (
        <View style={styles.filterBox}>
          <View style={styles.filterHeader}>
            <View style={styles.filterLeft}>
              <Ionicons name="map-outline" size={15} color={Colors.primary} />
              <Text style={styles.filterLabel}>KONUM FİLTRESİ</Text>
            </View>
            <Text style={styles.filterValue}>{distanceKm === 0 ? 'Tüm Dünya' : `${distanceKm} km`}</Text>
          </View>
          <View style={styles.quickDistances}>
            {[1, 5, 10, 25, 50].map((km) => (
              <TouchableOpacity
                key={km}
                style={[styles.distChip, distanceKm === km && styles.distChipActive]}
                onPress={() => setDistanceKm(km)}
              >
                <Text style={[styles.distChipText, distanceKm === km && styles.distChipTextActive]}>
                  {km}km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Create Post */}
      <View style={styles.createPost}>
        <Avatar
          initials={user?.avatarInitials ?? 'PA'}
          imageUrl={localAvatarUri ?? user?.avatarUrl}
          size={38}
        />
        <View style={styles.createPostInput}>
          <TextInput
            style={styles.createPostText}
            placeholder="Neler oluyor?"
            placeholderTextColor={Colors.textSecondary}
            value={postText}
            onChangeText={setPostText}
            multiline
          />
          <View style={styles.createPostActions}>
            <TouchableOpacity>
              <Ionicons name="image-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="location-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, !postText.trim() && styles.shareBtnDisabled]}
              onPress={handleShare}
              disabled={!postText.trim()}
            >
              <Text style={styles.shareBtnText}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.label}
            label={cat.label}
            icon={cat.icon}
            active={activeCategory === cat.label}
            onPress={() => setActiveCategory(cat.label)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={() => toggleLike(item.id, item.isLiked)}
            onRetweet={() => toggleRetweet(item.id, item.isRetweeted)}
          />
        )}
        ListHeaderComponent={<ListHeader />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  headerName: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.surfaceAlt,
  },

  // Section
  sectionTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  seeAll: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Stories
  storiesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 64,
  },
  addStoryCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.textSecondary,
    marginBottom: 6,
  },
  storyLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  // Events grid
  eventsGrid: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  eventsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  eventCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventCardGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 12,
  },
  eventCardTop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  eventCardTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  eventCardLocation: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  eventCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 8,
  },
  eventCardOrganizer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  eventCardAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCardAvatarText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  eventCardOrgName: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  eventCardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  eventCardAction: {
    padding: 2,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: Colors.transparent,
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },

  // Filter
  filterBox: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  filterValue: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  quickDistances: { flexDirection: 'row', gap: 8 },
  distChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  distChipActive: { backgroundColor: Colors.primary },
  distChipText: { color: Colors.textSecondary, fontSize: 12 },
  distChipTextActive: { color: Colors.white, fontWeight: '600' },

  // Create Post
  createPost: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  createPostInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createPostText: {
    color: Colors.white,
    fontSize: 15,
    minHeight: 36,
  },
  createPostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  shareBtn: {
    marginLeft: 'auto',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  // Categories
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
});
