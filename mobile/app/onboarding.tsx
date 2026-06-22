import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, FlatList, StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand } from '@/constants/theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: 'shield-checkmark' as const,
    iconColor: '#60A5FA',
    title: 'Trade Without Fear',
    subtitle: 'VeriTrade holds your money safely until both sides are satisfied. No more scams.',
    bg: ['#0E3A9F', '#1A56DB'],
  },
  {
    id: '2',
    icon: 'cube-outline' as const,
    iconColor: '#A78BFA',
    title: 'Simple Escrow',
    subtitle: 'Create an escrow in seconds. Share the code with your seller. Pay only when satisfied.',
    bg: ['#1A56DB', '#0E3A9F'],
  },
  {
    id: '3',
    icon: 'phone-portrait-outline' as const,
    iconColor: '#FCD34D',
    title: 'Works on Any Phone',
    subtitle: 'No smartphone? No problem. Use our USSD service on any basic phone — dial and trade.',
    bg: ['#EA580C', '#F97316'],
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

  const slide = slides[index];

  return (
    <View style={[styles.root, { backgroundColor: slide.bg[0] }]}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg[0] }]}>
            {/* Glass icon card */}
            <BlurView intensity={20} tint="light" style={styles.iconCard}>
              <Ionicons name={item.icon} size={72} color={item.iconColor} />
            </BlurView>
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

      {/* Buttons — glass */}
      <BlurView intensity={24} tint="dark" style={styles.btnBar}>
        {index < slides.length - 1 ? (
          <>
            <TouchableOpacity onPress={finish} style={styles.skipBtn}>
              <Text style={styles.skipTxt}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={next} style={styles.nextBtn}>
              <Text style={styles.nextTxt}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={finish} style={styles.startBtn}>
            <Ionicons name="rocket-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.startTxt}>Get Started</Text>
          </TouchableOpacity>
        )}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slide: {
    width, flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, paddingTop: 80, paddingBottom: 40,
  },
  iconCard: {
    width: 140, height: 140, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 26 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  dotActive: { width: 24, backgroundColor: Brand.accent },
  btnBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 28, paddingBottom: 48, paddingTop: 16,
    overflow: 'hidden',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
  },
  skipBtn: { padding: 14 },
  skipTxt: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Brand.accent, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 28,
  },
  nextTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  startBtn: {
    flex: 1, flexDirection: 'row', backgroundColor: Brand.accent,
    paddingVertical: 16, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  startTxt: { color: '#fff', fontWeight: '800', fontSize: 17 },
});
