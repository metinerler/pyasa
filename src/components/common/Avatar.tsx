import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

interface AvatarProps {
  initials?: string;
  imageUrl?: string;
  size?: number;
  isPremium?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials = '?',
  imageUrl,
  size = 44,
  isPremium = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // URL değişince hata state'ini sıfırla
  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const showImage = imageUrl && !imgError;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
          onError={() => setImgError(true)}
          cachePolicy="disk"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
            {initials.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Ionicons name="diamond" size={10} color={Colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.background,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
