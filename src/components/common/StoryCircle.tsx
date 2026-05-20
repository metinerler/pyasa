import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Story } from '../../types';
import { Avatar } from './Avatar';

interface StoryCircleProps {
  story: Story;
  onPress?: () => void;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({ story, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View
        style={[
          styles.ring,
          story.seen && styles.ringSeenBorder,
        ]}
      >
        <Avatar
          initials={story.user.avatarInitials}
          imageUrl={story.user.avatarUrl}
          size={56}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {story.user.username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 14,
    width: 68,
  },
  ring: {
    borderWidth: 2.5,
    borderColor: Colors.primary,
    borderRadius: 32,
    padding: 2,
    marginBottom: 5,
  },
  ringSeenBorder: {
    borderColor: Colors.textMuted,
  },
  name: {
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
});
