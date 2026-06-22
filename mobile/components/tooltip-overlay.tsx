import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

interface Step {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: 'shield-checkmark',
    color: Brand.primary,
    title: 'Welcome to VeriTrade 👋',
    body: 'Ghana\'s secure escrow platform. Your money is held safely until both buyer and seller are happy.',
  },
  {
    icon: 'lock-closed-outline',
    color: Brand.primary,
    title: 'Create an Escrow',
    body: 'Tap "New Escrow" to start a protected trade. Share the code with your buyer or seller.',
  },
  {
    icon: 'receipt-outline',
    color: Brand.accent,
    title: 'Track Your Trades',
    body: 'See all your transactions in "My Trades". Confirm delivery or raise a dispute with one tap.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    color: '#8B5CF6',
    title: 'Meet VeriBot 🤖',
    body: 'Got a dispute or question? Open the Bot tab. VeriBot judges disputes fairly and answers your questions.',
  },
  {
    icon: 'keypad-outline',
    color: Brand.success,
    title: 'No Smartphone? No Problem',
    body: 'Use the USSD tab to trade from any basic phone. Dial *384*1# — works on all Ghanaian networks.',
  },
];

interface Props {
  visible: boolean;
  onDone: () => void;
}

export default function TooltipOverlay({ visible, onDone }: Props) {
  const [step, setStep] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) animate();
  }, [visible, step]);

  function animate() {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
    ]).start();
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onDone();
    }
  }

  const current = STEPS[step];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Dimmed backdrop */}
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]}
              />
            ))}
          </View>

          {/* Icon */}
          <LinearGradient
            colors={[current.color, current.color + 'CC']}
            style={styles.iconCircle}
          >
            <Ionicons name={current.icon} size={36} color="#fff" />
          </LinearGradient>

          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.body}>{current.body}</Text>

          {/* Step counter */}
          <Text style={styles.counter}>{step + 1} of {STEPS.length}</Text>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onDone} style={styles.skipBtn}>
              <Text style={styles.skipTxt}>Skip all</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={next} activeOpacity={0.85}>
              <LinearGradient
                colors={[current.color, current.color + 'BB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextTxt}>
                  {step === STEPS.length - 1 ? "Let's go!" : 'Next'}
                </Text>
                <Ionicons
                  name={step === STEPS.length - 1 ? 'rocket-outline' : 'arrow-forward'}
                  size={16} color="#fff" style={{ marginLeft: 6 }}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(6,12,26,0.75)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 40, paddingHorizontal: 20,
  },
  card: {
    width: '100%', backgroundColor: '#0D1A3A',
    borderRadius: 28, padding: 28,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
  },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 20, backgroundColor: Brand.primary },
  dotDone: { backgroundColor: 'rgba(255,255,255,0.5)' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 10,
  },
  body: {
    fontSize: 15, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 23, marginBottom: 12,
  },
  counter: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 24 },
  btnRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', width: '100%',
  },
  skipBtn: { padding: 12 },
  skipTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: 28,
  },
  nextTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
