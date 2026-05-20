import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();

  const [name, setName]   = useState(user?.name ?? '');
  const [bio, setBio]     = useState(user?.bio ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'İsim boş bırakılamaz.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch<any>('/users/me', {
        name: name.trim(),
        bio: bio.trim() || undefined,
      });
      updateUser({
        name: updated.name,
        bio: updated.bio,
        avatarInitials: (updated.name ?? '??').slice(0, 2).toUpperCase(),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Profil güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Text style={styles.saveBtnText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Ad */}
        <Text style={styles.fieldLabel}>Ad Soyad</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Adınızı girin"
            placeholderTextColor={Colors.textSecondary}
            maxLength={60}
            autoCorrect={false}
          />
        </View>

        {/* Kullanıcı adı (sadece göster, düzenlenemez) */}
        <Text style={styles.fieldLabel}>Kullanıcı Adı</Text>
        <View style={[styles.inputWrapper, styles.inputDisabled]}>
          <Ionicons name="at-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
          <Text style={styles.inputReadOnly}>@{user?.username}</Text>
        </View>
        <Text style={styles.fieldHint}>Kullanıcı adı değiştirilemez.</Text>

        {/* Bio */}
        <Text style={styles.fieldLabel}>Hakkımda</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Kendinizden bahsedin..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={160}
            autoCorrect={false}
            textAlignVertical="top"
          />
        </View>
        <Text style={styles.charCount}>{bio.length}/160</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  backBtn:        { width: 40 },
  headerTitle:    { color: Colors.white, fontSize: 17, fontWeight: '700' },
  saveBtn:        { width: 60, alignItems: 'flex-end' },
  saveBtnText:    { color: Colors.primary, fontSize: 16, fontWeight: '700' },
  scroll:         { padding: 20, gap: 6 },
  fieldLabel:     { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  inputWrapper:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  inputDisabled:  { opacity: 0.5 },
  inputIcon:      { marginRight: 8 },
  input:          { flex: 1, color: Colors.white, fontSize: 15 },
  inputReadOnly:  { flex: 1, color: Colors.white, fontSize: 15 },
  fieldHint:      { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },
  textAreaWrapper:{ alignItems: 'flex-start', paddingVertical: 12 },
  textArea:       { minHeight: 90 },
  charCount:      { color: Colors.textSecondary, fontSize: 11, textAlign: 'right' },
});
