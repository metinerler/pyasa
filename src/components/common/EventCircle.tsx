import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../../theme/colors';
import { Event } from '../../types';

interface EventCircleProps {
  event: Event;
  onPress?: () => void;
}

export const EventCircle: React.FC<EventCircleProps> = ({ event, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.circle}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{event.title.slice(0, 2)}</Text>
          </View>
        )}
        <View style={styles.ring} />
      </View>
      <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    position: 'relative',
    marginBottom: 6,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  ring: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  title: {
    color: Colors.text,
    fontSize: 11,
    textAlign: 'center',
  },
});
