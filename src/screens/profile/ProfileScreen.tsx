import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../../components/common/Avatar';
import { api } from '../../api/client';

const MENU_ITEMS = [
  { id: 'edit',          icon: 'person-outline'            as const, label: 'Profili Düzenle',        subtitle: 'Profil bilgilerini güncelleyin' },
  { id: 'notifications', icon: 'notifications-outline'     as const, label: 'Bildirimler',             subtitle: 'Bildirim ayarlarını yönetin' },
  { id: 'privacy',       icon: 'shield-checkmark-outline'  as const, label: 'Gizlilik ve Güvenlik',    subtitle: 'Hesap güvenliği ayarları' },
  { id: 'premium',       icon: 'diamond-outline'           as const, label: 'Premium',                 subtitle: 'Özel içeriklere ve özelliklere erişin' },
];

export const ProfileScreen: React.FC = () => {
  const insets              = useSafeAreaInsets();
  const navigation           = useNavigation<any>();
  const { user, updateUser, logout, localAvatarUri, setLocalAvatarUri } = useAuthStore();
  const [uploading, setUploading]       = useState(false);

  if (!user) return null;

  const handleAvatarPress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf kütüphanesine erişim izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      exif: false,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const filename = asset.fileName ?? asset.uri.split('/').pop() ?? 'avatar.jpg';
    const mimeType = asset.mimeType ?? 'image/jpeg';

    // Anında local göster (Instagram/Twitter gibi)
    setLocalAvatarUri(asset.uri);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: asset.uri, name: filename, type: mimeType } as any);
      const updated = await api.postForm<any>('/users/me/avatar', form);
      if (!updated.avatarUrl) {
        throw new Error('Sunucu profil fotoğrafı adresi döndürmedi.');
      }
      updateUser({ avatarUrl: updated.avatarUrl });
      setLocalAvatarUri(null);
    } catch (e: any) {
      setLocalAvatarUri(null); // hata varsa geri al
      Alert.alert('Yükleme Başarısız', e?.message ?? 'Fotoğraf yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const getRoleBadge = () => {
    if (user.role === 'admin')   return 'Admin';
    if (user.role === 'premium') return 'Premium';
    return null;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Avatar + Info */}
      <View style={styles.profileSection}>
        {/* Tıklanabilir avatar */}
        <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarWrapper} disabled={uploading}>
          <Avatar
            initials={user.avatarInitials}
            imageUrl={localAvatarUri ?? user.avatarUrl}
            size={88}
            isPremium={user.isPremium}
          />
          <View style={styles.avatarEditBadge}>
            {uploading
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Ionicons name="camera" size={14} color={Colors.white} />}
          </View>
        </TouchableOpacity>

        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{user.name}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={20} color="#1D9BF0" />
          )}
        </View>
        <Text style={styles.handle}>@{user.username}</Text>
        {getRoleBadge() && (
          <View style={styles.roleBadge}>
            <Ionicons
              name={user.role === 'admin' ? 'shield-checkmark' : 'diamond'}
              size={12}
              color={Colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.roleText}>{getRoleBadge()}</Text>
          </View>
        )}
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user.tweetsCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Gönderi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user.followersCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Takipçi</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{user.followingCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Takip</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuRow}
            onPress={item.id === 'edit' ? () => navigation.getParent()?.navigate('EditProfile') : undefined}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutRow} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    position: 'relative',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  logoutBtn: {
    position: 'absolute',
    right: 16,
    bottom: 10,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  avatarWrapper:    { position: 'relative' },
  avatarEditBadge:  { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  displayName: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  handle: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
  },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  menuSection: {
    marginHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  menuSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  logoutText: {
    color: Colors.error,
    fontWeight: '700',
    fontSize: 15,
  },
});
