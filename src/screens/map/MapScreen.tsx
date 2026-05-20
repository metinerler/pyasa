import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Modal,
  Pressable,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

// Sheet kapalıyken görünen yükseklik: handle + tab satırı + 1 tam kart
const PEEK_H   = 200;
// Sheet tam açık yüksekliği
const SHEET_H  = 390;
// Animasyon aralığı: 0 (açık) → MAX_DRAG (kapalı/peek)
const MAX_DRAG = SHEET_H - PEEK_H; // 212

const INITIAL_REGION = {
  latitude: 40.963, longitude: 29.065,
  latitudeDelta: 0.018, longitudeDelta: 0.018,
};

const DARK_STYLE = [
  { elementType: 'geometry',              stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.stroke',    stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.fill',      stylers: [{ color: '#8899aa' }] },
  { featureType: 'road',          elementType: 'geometry', stylers: [{ color: '#2d3650' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#38435a' }] },
  { featureType: 'road.highway',  elementType: 'geometry', stylers: [{ color: '#3a4a6a' }] },
  { featureType: 'water',         elementType: 'geometry', stylers: [{ color: '#0d2a45' }] },
  { featureType: 'poi',           elementType: 'geometry', stylers: [{ color: '#1e2a40' }] },
  { featureType: 'poi.park',      elementType: 'geometry', stylers: [{ color: '#1e3320' }] },
  { featureType: 'transit',       elementType: 'geometry', stylers: [{ color: '#2a3550' }] },
];

const ACTIVITIES = [
  { id: 'kahve', label: 'Kahvedeyim',     icon: 'cafe-outline'        },
  { id: 'arac',  label: 'Araç turunda',   icon: 'car-outline'         },
  { id: 'kosu',  label: 'Koşudayım',      icon: 'fitness-outline'     },
  { id: 'kopek', label: 'Yürüyüşteyim',   icon: 'paw-outline'         },
  { id: 'park',  label: 'Park halinde',   icon: 'location-outline'    },
  { id: 'tamir', label: 'Tamircideyim',   icon: 'construct-outline'   },
  { id: 'pist',  label: 'Piste gidiyorum',icon: 'speedometer-outline' },
];
const DURATIONS = [
  { label: '30 dk', minutes: 30 },
  { label: '1 saat', minutes: 60 },
  { label: '2 saat', minutes: 120 },
  { label: 'Sonsuz', minutes: 0 },
];

const USER_MARKERS = [
  { id: '1', initials: 'CY', borderColor: '#FFD700', label: '34 VP 1907', lat: 40.965, lng: 29.062 },
  { id: '2', initials: 'AK', borderColor: '#4CD964', label: null,          lat: 40.960, lng: 29.058 },
];
const PLACE_MARKERS = [
  { id: '1', name: 'Espressolab', icon: 'cafe-outline', lat: 40.967, lng: 29.070 },
];
const NEARBY = [
  { name: 'Speed Garage Tuning', type: 'Tuning', icon: 'construct-outline', dist: '0.3km', rating: 4.9, partner: true,  offer: 'Pyasa üyelerine özel paket!' },
  { name: 'Shell Caddebostan',   type: 'Benzin', icon: 'flash-outline',     dist: '0.4km', rating: 4.5, partner: false, offer: null },
  { name: 'Car Wash Pro',        type: 'Yıkama', icon: 'water-outline',     dist: '0.6km', rating: 4.3, partner: true,  offer: null },
];
const EVENTS_MAP = [
  { name: 'Caddebostan Araba Turu', date: '25 Mayıs',  location: 'Bağdat Cad.',    icon: 'car-sport-outline', attendees: 24 },
  { name: 'Blink-182 Konseri',      date: '1 Haziran', location: 'İstanbul Arena', icon: 'musical-notes-outline', attendees: 312 },
];

function UserPin({ initials, borderColor, label, activityIcon, imageUrl }: {
  initials: string; borderColor: string; label: string | null; activityIcon?: string; imageUrl?: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      {activityIcon ? (
        <View style={[styles.walkIcon, { backgroundColor: borderColor }]}>
          <Ionicons name={activityIcon as any} size={11} color="#000" />
        </View>
      ) : label ? (
        <View style={[styles.pinLabel, { backgroundColor: borderColor }]}>
          <Text style={styles.pinLabelText}>{label}</Text>
        </View>
      ) : (
        <View style={[styles.walkIcon, { backgroundColor: borderColor }]}>
          <Ionicons name="walk" size={12} color="#000" />
        </View>
      )}
      <View style={[styles.userPin, { borderColor }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={borderColor === '#FFD700' ? ['#3a3a2e', '#2a2a1e'] : ['#1a2a1a', '#0d1f0d']}
            style={styles.userPinInner}
          >
            <Text style={styles.userPinInitials}>{initials}</Text>
          </LinearGradient>
        )}
      </View>
      <View style={[styles.pinTail, { borderTopColor: borderColor }]} />
    </View>
  );
}

function PlacePin({ name, icon }: { name: string; icon: string }) {
  return (
    <View style={styles.placePin}>
      <Ionicons name={icon as any} size={13} color={Colors.primary} />
      <Text style={styles.placePinName}>{name}</Text>
    </View>
  );
}

export const MapScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, localAvatarUri } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'mekanlar' | 'etkinlikler'>('mekanlar');
  const [showPicker, setShowPicker]     = useState(false);
  const [pickerActivity, setPickerActivity] = useState<string | null>(null);
  const [pickerDuration, setPickerDuration] = useState(60);
  const [myStatus, setMyStatus]           = useState<{ icon: string; label: string } | null>(null);
  const [myLocation, setMyLocation]       = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView>(null);

  // pan: 0 = tam açık, MAX_DRAG = kapalı (peek)
  const pan       = useRef(new Animated.Value(MAX_DRAG)).current;
  const curVal    = useRef(MAX_DRAG);
  const gestStart = useRef(MAX_DRAG);
  const expanded  = useRef(false);

  useEffect(() => {
    const id = pan.addListener(({ value }) => { curVal.current = value; });
    return () => pan.removeListener(id);
  }, [pan]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        ({ coords }) => setMyLocation({ latitude: coords.latitude, longitude: coords.longitude }),
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const springTo = (toValue: number) =>
    Animated.spring(pan, { toValue, useNativeDriver: true, damping: 22, stiffness: 240, mass: 0.8 }).start();

  const openSheet  = () => { expanded.current = true;  springTo(0); };
  const closeSheet = () => { expanded.current = false; springTo(MAX_DRAG); };
  const toggle     = () => (expanded.current ? closeSheet() : openSheet());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:      () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.stopAnimation();
        gestStart.current = curVal.current;
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(0, Math.min(MAX_DRAG, gestStart.current + g.dy));
        pan.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const projected = gestStart.current + g.dy;
        const half = MAX_DRAG / 2;
        if (g.vy < -0.4 || projected < half) { expanded.current = true;  springTo(0); }
        else                                  { expanded.current = false; springTo(MAX_DRAG); }
      },
    })
  ).current;

  return (
    /**
     * Flex column layout:
     *   MapView (absoluteFill arka plan)
     *   Header (absolute)
     *   Sosyal Harita yazısı (absolute)
     *   Keşfet butonları (absolute)
     *   Spacer (flex:1) → haritayla etkileşime izin verir
     *   Sheet → flex flow'da, container'ın dibine doğal yapışır
     *
     * Sheet translateY ile aşağı itilince container overflow:hidden
     * sayesinde sadece PEEK_H kadar görünür kalır — boşluk olmaz.
     */
    <View style={styles.container}>
      {/* HARİTA */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        customMapStyle={DARK_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled zoomEnabled scrollEnabled pitchEnabled
      >
        {USER_MARKERS.map(m => (
          <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lng }} anchor={{ x: 0.5, y: 1 }}>
            <UserPin initials={m.initials} borderColor={m.borderColor} label={m.label} />
          </Marker>
        ))}
        {PLACE_MARKERS.map(m => (
          <Marker key={m.id} coordinate={{ latitude: m.lat, longitude: m.lng }} anchor={{ x: 0.5, y: 1 }}>
            <PlacePin name={m.name} icon={m.icon} />
          </Marker>
        ))}
        {myStatus && myLocation && (
          <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 1 }}>
            <UserPin
              initials={(user?.username ?? 'BN').slice(0, 2).toUpperCase()}
              borderColor={Colors.primary}
              label={null}
              activityIcon={myStatus.icon}
              imageUrl={localAvatarUri ?? user?.avatarUrl}
            />
          </Marker>
        )}
      </MapView>

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={require('../../../assets/pyasa.png')} style={styles.headerLogo} />
        <Text style={styles.headerGreeting}>Selam, {user?.username}!</Text>
        <TouchableOpacity
          style={[styles.plusBtn, myStatus && styles.plusBtnActive]}
          onPress={() => myStatus ? setMyStatus(null) : setShowPicker(true)}
        >
          {myStatus ? (
            <Ionicons name={myStatus.icon as any} size={20} color={Colors.primary} />
          ) : (
            <Ionicons name="add" size={26} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sosyalHarita, { top: insets.top + 72 }]}>Sosyal Harita</Text>

      {/* AKTİVİTE DURUM ETİKETİ */}
      {myStatus && (
        <View style={[styles.statusBadge, { top: insets.top + 68 }]}>
          <Ionicons name={myStatus.icon as any} size={14} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.statusBadgeText}>{myStatus.label}</Text>
          <TouchableOpacity onPress={() => setMyStatus(null)} style={{ marginLeft: 6 }}>
            <Ionicons name="close-circle" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* AKTİVİTE SEÇİCİ MODAL */}
      <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Neredesin?</Text>
            <Text style={styles.pickerSub}>Konumunu paylaş, araç tutkunları seni haritada görsün</Text>

            {/* Aktiviteler */}
            <View style={styles.activityGrid}>
              {ACTIVITIES.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.activityBtn, pickerActivity === a.id && styles.activityBtnActive]}
                  onPress={() => setPickerActivity(a.id)}
                >
                  <Ionicons
                    name={a.icon as any}
                    size={28}
                    color={pickerActivity === a.id ? Colors.primary : Colors.textSecondary}
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={[styles.activityLabel, pickerActivity === a.id && styles.activityLabelActive]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Süre */}
            <Text style={styles.durationTitle}>Ne kadar süre?</Text>
            <View style={styles.durationRow}>
              {DURATIONS.map(d => (
                <TouchableOpacity
                  key={d.minutes}
                  style={[styles.durationBtn, pickerDuration === d.minutes && styles.durationBtnActive]}
                  onPress={() => setPickerDuration(d.minutes)}
                >
                  <Text style={[styles.durationLabel, pickerDuration === d.minutes && styles.durationLabelActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.shareBtn, !pickerActivity && styles.shareBtnDisabled]}
              disabled={!pickerActivity}
              onPress={() => {
                const act = ACTIVITIES.find(a => a.id === pickerActivity)!;
                setMyStatus({ icon: act.icon, label: act.label });
                setShowPicker(false);
                setPickerActivity(null);
                if (myLocation) {
                  mapRef.current?.animateToRegion(
                    { ...myLocation, latitudeDelta: 0.012, longitudeDelta: 0.012 },
                    800,
                  );
                }
              }}
            >
              <Text style={styles.shareBtnText}>Konumumu Paylaş</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SPACER — flex:1, haritayı tıklanabilir bırakır */}
      <View style={{ flex: 1 }} pointerEvents="none" />

      {/* BOTTOM SHEET — absolute YOK, flex flow'da container dibine yapışır */}
      <Animated.View style={[styles.sheet, { height: SHEET_H, transform: [{ translateY: pan }] }]}>

        {/* HANDLE AREA */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'mekanlar' && styles.tabActive]}
              onPress={() => { setActiveTab('mekanlar'); openSheet(); }}
            >
              <Text style={[styles.tabText, activeTab === 'mekanlar' && styles.tabTextActive]}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={activeTab === 'mekanlar' ? Colors.white : Colors.textSecondary}
                />{' '}
                Yakın Mekanlar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'etkinlikler' && styles.tabActive]}
              onPress={() => { setActiveTab('etkinlikler'); openSheet(); }}
            >
              <Text style={[styles.tabText, activeTab === 'etkinlikler' && styles.tabTextActive]}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={activeTab === 'etkinlikler' ? Colors.white : Colors.textSecondary}
                />{' '}
                Etkinlikler
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* İÇERİK */}
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: 12 }}
        >
          {activeTab === 'mekanlar' ? (
            NEARBY.map((loc, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName}>{loc.name}</Text>
                      {loc.partner && <View style={styles.badge}><Text style={styles.badgeText}>PARTNER</Text></View>}
                    </View>
                    <View style={styles.typeRow}>
                      <Ionicons name={loc.icon as any} size={12} color={Colors.textSecondary} />
                      <Text style={styles.cardSub}>{loc.type}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.cardDist}>{loc.dist}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="star" size={11} color="#FFD700" />
                      <Text style={styles.cardRating}>{loc.rating}</Text>
                    </View>
                  </View>
                </View>
                {loc.offer && (
                  <View style={styles.offer}>
                    <Ionicons name="gift-outline" size={13} color={Colors.primary} />
                    <Text style={styles.offerText}>{loc.offer}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            EVENTS_MAP.map((ev, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.eventEmoji}>
                    <Ionicons name={ev.icon as any} size={26} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 12 }}>
                    <Text style={styles.cardName}>{ev.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Ionicons name="location-sharp" size={11} color={Colors.primary} />
                      <Text style={styles.cardSub}>{ev.location}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="calendar-outline" size={11} color={Colors.textSecondary} />
                      <Text style={styles.cardSub}>{ev.date}  •  {ev.attendees} kişi</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.joinBtn}>
                    <Text style={styles.joinText}>Katıl</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Flex column: harita absolute, spacer flex:1, sheet dibe
  container: { flex: 1, backgroundColor: '#0d2a45' },

  // Pins
  pinLabel:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, marginBottom: 5 },
  pinLabelText:    { color: '#111', fontSize: 10, fontWeight: '800' },
  walkIcon:        { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  userPin:         { width: 46, height: 46, borderRadius: 23, borderWidth: 3, overflow: 'hidden' },
  userPinInner:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  userPinInitials: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  pinTail:         { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  placePin:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3a2510', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 20, gap: 4 },
  placePinName:    { color: Colors.white, fontSize: 11, fontWeight: '700' },

  // Header
  header:         { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, zIndex: 10 },
  headerLogo:     { width: 42, height: 42, marginRight: 12, resizeMode: 'contain' },
  headerGreeting: { flex: 1, color: Colors.white, fontSize: 17, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  plusBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(10,10,10,0.75)', alignItems: 'center', justifyContent: 'center' },
  plusBtnActive:  { backgroundColor: Colors.surfaceAlt, borderWidth: 2, borderColor: Colors.primary },
  statusBadge:    { position: 'absolute', right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 10, borderWidth: 1, borderColor: Colors.primary },
  statusBadgeText:{ color: Colors.white, fontSize: 13, fontWeight: '600' },

  // Modal / Picker
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  pickerSheet:    { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  pickerHandle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  pickerTitle:    { color: Colors.white, fontSize: 22, fontWeight: '800', paddingHorizontal: 20, marginBottom: 6 },
  pickerSub:      { color: Colors.textSecondary, fontSize: 13, paddingHorizontal: 20, marginBottom: 20, lineHeight: 18 },

  activityGrid:   { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10, marginBottom: 24 },
  activityBtn:    { width: '30%', alignItems: 'center', paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.surfaceAlt, borderWidth: 1.5, borderColor: 'transparent' },
  activityBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  activityIcon:   { marginBottom: 6 },
  activityLabel:  { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  activityLabelActive: { color: Colors.white },

  durationTitle:  { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  durationRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 24 },
  durationBtn:    { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surfaceAlt, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  durationBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  durationLabel:  { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  durationLabelActive: { color: Colors.white, fontWeight: '700' },

  shareBtn:       { marginHorizontal: 20, backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnText:   { color: Colors.white, fontSize: 16, fontWeight: '800' },
  sosyalHarita:   { position: 'absolute', left: 16, color: Colors.white, fontSize: 28, fontWeight: '800', zIndex: 10, textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },

  // Sheet — absolute YOK, flex flow'da doğal olarak dibe yapışır
  sheet:        { backgroundColor: Colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 24 },
  handleArea:   { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 10 },
  tabRow:       { flexDirection: 'row', gap: 8 },
  tab:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surfaceAlt },
  tabActive:    { backgroundColor: Colors.primary },
  tabText:      { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: Colors.white, fontWeight: '700' },
  scrollArea:   { flex: 1 },

  // Kartlar
  card:       { marginHorizontal: 14, marginBottom: 10, backgroundColor: Colors.surfaceAlt, borderRadius: 14, padding: 13 },
  cardRow:    { flexDirection: 'row', alignItems: 'center' },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
  cardName:   { color: Colors.white, fontSize: 14, fontWeight: '700' },
  typeRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardSub:    { color: Colors.textSecondary, fontSize: 12 },
  cardDist:   { color: Colors.primary, fontSize: 13, fontWeight: '700' },
  cardRating: { color: Colors.white, fontSize: 11 },
  badge:      { backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText:  { color: Colors.white, fontSize: 9, fontWeight: '800' },
  offer:      { marginTop: 8, backgroundColor: Colors.primary + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderLeftWidth: 3, borderLeftColor: Colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 },
  offerText:  { color: Colors.primary, fontSize: 12, fontWeight: '600', flex: 1 },

  eventEmoji: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  joinBtn:    { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'center' },
  joinText:   { color: Colors.white, fontSize: 13, fontWeight: '700' },
});
