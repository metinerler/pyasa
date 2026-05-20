import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Post } from '../../types';
import { Avatar } from './Avatar';

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onRetweet?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onRetweet,
  onComment,
  onShare,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar
          initials={post.author.avatarInitials}
          imageUrl={post.author.avatarUrl}
          size={42}
          isPremium={post.author.isPremium}
        />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{post.author.name}</Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={15} color={Colors.verified} style={styles.verifiedIcon} />
            )}
            {post.author.isPremium && (
              <Ionicons name="diamond" size={12} color={Colors.primary} style={styles.diamondBadge} />
            )}
            <Text style={styles.handle}> @{post.author.username}</Text>
            <Text style={styles.time}> · {formatTime(post.createdAt)}</Text>
          </View>
          {post.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}

      {post.locationTag && (
        <View style={styles.locationRow}>
          <View style={styles.locationPill}>
            <Ionicons name="location" size={12} color={Colors.primary} />
            <Text style={styles.locationText}>{post.locationTag}</Text>
          </View>
          {post.locationDistance && (
            <Text style={styles.distanceText}>{post.locationDistance}</Text>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={17} color={Colors.textSecondary} />
          <Text style={styles.actionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onRetweet}>
          <Ionicons
            name="repeat-outline"
            size={17}
            color={post.isRetweeted ? Colors.success : Colors.textSecondary}
          />
          <Text style={[styles.actionCount, post.isRetweeted && { color: Colors.success }]}>
            {post.retweetsCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={17}
            color={post.isLiked ? Colors.error : Colors.textSecondary}
          />
          <Text style={[styles.actionCount, post.isLiked && { color: Colors.error }]}>
            {post.likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
          <Ionicons name="share-outline" size={17} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  verifiedIcon: {
    marginLeft: 3,
  },
  diamondBadge: {
    marginLeft: 3,
  },
  handle: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  time: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  categoryPill: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    color: Colors.text,
    fontSize: 11,
    fontWeight: '500',
  },
  moreBtn: {
    padding: 4,
  },
  content: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: Colors.surface,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  locationText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  distanceText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
