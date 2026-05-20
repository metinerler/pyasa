import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { useFeedStore } from '../../store/feedStore';
import { EventCircle } from '../../components/common/EventCircle';

export const EventsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { events } = useFeedStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Etkinlikler</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={26} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.eventCard}>
            <View style={styles.eventImagePlaceholder}>
              <Ionicons name="speedometer-outline" size={34} color={Colors.primary} />
            </View>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <View style={styles.eventMeta}>
              <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.eventDate}>{item.date}</Text>
            </View>
            {item.location && (
              <View style={styles.eventMeta}>
                <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                <Text style={styles.eventDate}>{item.location}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View style={styles.upcoming}>
            <Text style={styles.upcomingTitle}>Yaklaşan</Text>
            <FlatList
              data={events}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <EventCircle event={item} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            />
          </View>
        }
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
  upcoming: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  upcomingTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  eventCard: {
    flex: 1,
    margin: 6,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  eventImagePlaceholder: {
    height: 80,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  eventTitle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  eventDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
