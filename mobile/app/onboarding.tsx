import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Brand } from '@/constants/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: '🔒',
    title: 'Trade Without Fear',
    subtitle: 'VeriTrade holds your money safely until both sides are satisfied. No more scams.',
    bg: Brand.primary,
  },
  {
    id: '2',
    emoji: '📦',
    title: 'Simple Escrow',
    subtitle: 'Create an escrow in seconds. Share the code with your seller. Pay only when you\'re happy.',
    bg: Brand.primaryDark,
  },
  {
    id: '3',
    emoji: '📱',
    title: 'Works on Any Phone',
    subtitle: 'No smartphone? No problem. Use our USSD service on any basic phone — dial and trade.',
    bg: Brand.accent,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  async function finish() {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/login');
  }

  function next() {
    if (index < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      finish();
    }
  }

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        {index < slides.length - 1 ? (
          <>
            <TouchableOpacity onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipTxt}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={next} style={styles.nextBtn}>
              <Text style={styles.nextTxt}>Next →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={finish} style={styles.startBtn}>
            <Text style={styles.startTxt}>Get Started 🚀</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.primary },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 80,
    paddingBottom: 40,
  },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20, backgroundColor: Brand.primary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: Brand.accent },
  btnRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 28, paddingBottom: 48,
    backgroundColor: Brand.primary,
  },
  skipBtn: { padding: 14 },
  skipTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },
  nextBtn: {
    backgroundColor: Brand.accent, paddingVertical: 14,
    paddingHorizontal: 32, borderRadius: 28,
  },
  nextTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  startBtn: {
    flex: 1, backgroundColor: Brand.accent, paddingVertical: 16,
    borderRadius: 28, alignItems: 'center',
  },
  startTxt: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
