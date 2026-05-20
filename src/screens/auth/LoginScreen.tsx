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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);

  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre alanlarını doldurun.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      Alert.alert('Giriş Başarısız', e?.message ?? 'E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Image source={require('../../../assets/pyasa.png')} style={styles.logo} />
          <Text style={styles.appName}>Pyassa</Text>
          <Text style={styles.tagline}>Araç Tutkunları Platformu</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresi"
              placeholderTextColor={Colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLinkText}>
              Hesabın yok mu?{'  '}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Pyassa'ya hoş geldin!{' '}Araç tutkunları burada buluşuyor.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  scroll:           { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
  logoSection:      { alignItems: 'center', marginBottom: 48 },
  logo:             { width: 86, height: 86, marginBottom: 14, resizeMode: 'contain' },
  appName:          { color: Colors.white, fontSize: 38, fontWeight: '800' },
  tagline:          { color: Colors.textSecondary, fontSize: 15, marginTop: 6 },
  form:             { gap: 14 },
  inputWrapper:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  inputIcon:        { marginRight: 10 },
  input:            { flex: 1, color: Colors.white, fontSize: 15 },
  loginBtn:         { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText:     { color: Colors.white, fontSize: 16, fontWeight: '700' },
  registerLink:     { alignItems: 'center', paddingVertical: 10 },
  registerLinkText: { color: Colors.textSecondary, fontSize: 14 },
  footer:           { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 40, lineHeight: 20 },
});
