import { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

// ─── Floating background star ─────────────────────────────────────────────────
function Star({
  x, y, size, delay, duration,
}: {
  x: number; y: number; size: number; delay: number; duration: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const EASE = Easing.inOut(Easing.sin);
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(size > 3 ? 0.55 : 0.30, { duration: duration * 0.5, easing: EASE }),
          withTiming(0.08,                    { duration: duration * 0.5, easing: EASE }),
        ),
        -1,
        true,
      ),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8,  { duration: duration, easing: Easing.inOut(Easing.quad) }),
          withTiming( 8,  { duration: duration, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: size > 3 ? '#3B82F6' : '#FFFFFF',
        },
        style,
      ]}
    />
  );
}

// Deterministic pseudo-random based on seed
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x:        seededRand(i * 3)     * W,
  y:        seededRand(i * 3 + 1) * H,
  size:     seededRand(i * 3 + 2) * 3.5 + 1.5,
  delay:    Math.floor(seededRand(i * 7)     * 1200),
  duration: Math.floor(seededRand(i * 7 + 1) * 2000 + 2400),
}));


// ─── Orbit ring around the shield ────────────────────────────────────────────
function OrbitRing({
  size, opacity: opacityVal,
}: {
  size: number; opacity: SharedValue<number>;
}) {
  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 7000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: opacityVal.value,
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const r = size / 2;
  const DOT_R = 5;
  const dotPositions = [
    { angle: 0   },
    { angle: 72  },
    { angle: 144 },
    { angle: 216 },
    { angle: 288 },
  ].map(({ angle }) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: r + (r - DOT_R) * Math.cos(rad) - DOT_R,
      y: r + (r - DOT_R) * Math.sin(rad) - DOT_R,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: r,
          borderWidth: 1.5,
          borderColor: 'rgba(59,130,246,0.25)',
          borderStyle: 'dashed',
        },
        ringStyle,
      ]}
    >
      {dotPositions.map((pos, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: DOT_R * 2,
            height: DOT_R * 2,
            borderRadius: DOT_R,
            backgroundColor: i === 0 ? '#F97316' : 'rgba(59,130,246,0.5)',
          }}
        />
      ))}
    </Animated.View>
  );
}


// ─── Shield logo (pure RN views) ──────────────────────────────────────────────
function ShieldLogo({ size = 110 }: { size?: number }) {
  const s = size / 100;
  return (
    <View style={{ width: size, height: size * 1.18, alignItems: 'center', justifyContent: 'center' }}>
      {/* Shield body */}
      <LinearGradient
        colors={['#3B82F6', '#1A56DB', '#0E3A9F']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={{
          width: 76 * s,
          height: 90 * s,
          borderRadius: 10 * s,
          borderTopLeftRadius: 38 * s,
          borderTopRightRadius: 38 * s,
          borderBottomLeftRadius: 42 * s,
          borderBottomRightRadius: 42 * s,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.28)',
          transform: [{ scaleY: 1.05 }],
          overflow: 'hidden',
        }}
      >
        {/* Inner highlight at top */}
        <LinearGradient
          colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
          }}
        />

        {/* Checkmark: white left leg */}
        <View
          style={{
            position: 'absolute',
            bottom: 30 * s,
            left: 10 * s,
            width: 26 * s,
            height: 5.5 * s,
            backgroundColor: '#FFFFFF',
            borderRadius: 3 * s,
            transform: [{ rotate: '42deg' }, { translateY: 6 * s }],
          }}
        />
        {/* Checkmark: orange right leg */}
        <View
          style={{
            position: 'absolute',
            bottom: 28 * s,
            right: 6 * s,
            width: 44 * s,
            height: 5.5 * s,
            backgroundColor: '#F97316',
            borderRadius: 3 * s,
            transform: [{ rotate: '-52deg' }, { translateY: -8 * s }],
          }}
        />
        {/* Orange dot at top of right leg */}
        <View
          style={{
            position: 'absolute',
            top: 16 * s,
            right: 10 * s,
            width: 9 * s,
            height: 9 * s,
            borderRadius: 5 * s,
            backgroundColor: '#F97316',
            shadowColor: '#F97316',
            shadowOpacity: 0.8,
            shadowRadius: 4,
          }}
        />
      </LinearGradient>
    </View>
  );
}


// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: SharedValue<number> }) {
  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, barStyle]}>
        <LinearGradient
          colors={['#3B82F6', '#1A56DB', '#F97316']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}


// ─── Main splash component ────────────────────────────────────────────────────
interface Props {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: Props) {
  // Shared values
  const logoScale    = useSharedValue(0.5);
  const logoOpacity  = useSharedValue(0);
  const glowScale    = useSharedValue(0.6);
  const glowOpacity  = useSharedValue(0);
  const ringOpacity  = useSharedValue(0);
  const textOpacity  = useSharedValue(0);
  const textY        = useSharedValue(30);
  const tagOpacity   = useSharedValue(0);
  const tagY         = useSharedValue(16);
  const progress     = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    const EASE_OUT   = Easing.out(Easing.cubic);
    const EASE_BACK  = Easing.out(Easing.back(1.4));
    const EASE_SINE  = Easing.inOut(Easing.sin);

    // — Glow blooms first
    glowOpacity.value = withTiming(1,   { duration: 500, easing: EASE_OUT });
    glowScale.value   = withTiming(1.0, { duration: 700, easing: EASE_OUT });

    // — Logo pops in with back-ease
    logoOpacity.value = withDelay(80,  withTiming(1, { duration: 500, easing: EASE_OUT }));
    logoScale.value   = withDelay(80,  withTiming(1, { duration: 700, easing: EASE_BACK }));

    // — Orbit ring fades in
    ringOpacity.value = withDelay(500, withTiming(1, { duration: 500, easing: EASE_OUT }));

    // — Glow pulses subtly
    glowScale.value   = withDelay(700,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1200, easing: EASE_SINE }),
          withTiming(0.96, { duration: 1200, easing: EASE_SINE }),
        ),
        -1,
        true,
      ),
    );

    // — Brand name slides up
    textOpacity.value = withDelay(500, withTiming(1, { duration: 480, easing: EASE_OUT }));
    textY.value       = withDelay(500, withTiming(0, { duration: 480, easing: EASE_OUT }));

    // — Tagline
    tagOpacity.value  = withDelay(750, withTiming(1, { duration: 450, easing: EASE_OUT }));
    tagY.value        = withDelay(750, withTiming(0, { duration: 450, easing: EASE_OUT }));

    // — Progress bar fills
    progress.value = withDelay(900,
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
    );

    // — Fade out whole splash
    screenOpacity.value = withDelay(
      2700,
      withTiming(0, { duration: 550, easing: Easing.in(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity:   glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));
  const tagStyle  = useAnimatedStyle(() => ({
    opacity:   tagOpacity.value,
    transform: [{ translateY: tagY.value }],
  }));
  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  const ORBIT_SIZE  = 230;
  const SHIELD_SIZE = 126;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, screenStyle]} pointerEvents="none">
      <LinearGradient
        colors={['#030810', '#060C1A', '#08122A', '#060C1A', '#030810']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.container}
      >

        {/* ── Background stars ──────────────────────────────────────── */}
        {STARS.map((s, i) => (
          <Star key={i} {...s} />
        ))}

        {/* ── Glow + orbit + shield cluster ───────────────────────── */}
        <View style={styles.logoCluster}>

          {/* Outer soft glow */}
          <Animated.View style={[styles.glowOuter, glowStyle]} />
          <Animated.View style={[styles.glowInner, glowStyle]} />

          {/* Orbit ring centred on shield */}
          <View style={{ position: 'absolute', width: ORBIT_SIZE, height: ORBIT_SIZE }}>
            <OrbitRing size={ORBIT_SIZE} opacity={ringOpacity} />
          </View>

          {/* Shield */}
          <Animated.View style={logoStyle}>
            <ShieldLogo size={SHIELD_SIZE} />
          </Animated.View>

        </View>

        {/* ── Brand name ───────────────────────────────────────────── */}
        <Animated.View style={[styles.brandRow, textStyle]}>
          <Text style={styles.brandVeri}>Veri</Text>
          <Text style={styles.brandTrade}>Trade</Text>
        </Animated.View>

        {/* ── Tagline ──────────────────────────────────────────────── */}
        <Animated.Text style={[styles.tagline, tagStyle]}>
          Secure  ·  Simple  ·  Trusted
        </Animated.Text>

        {/* ── Progress bar ─────────────────────────────────────────── */}
        <View style={styles.progressWrapper}>
          <ProgressBar progress={progress} />
        </View>

      </LinearGradient>
    </Animated.View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo cluster (glow + ring + shield all centred together)
  logoCluster: {
    width: 230,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow layers
  glowOuter: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1A56DB',
    opacity: 0.10,
  },
  glowInner: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#3B82F6',
    opacity: 0.13,
  },

  // Brand name
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 28,
  },
  brandVeri: {
    fontSize: 46,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  brandTrade: {
    fontSize: 46,
    fontWeight: '800',
    color: '#F97316',
    letterSpacing: 1.2,
  },

  // Tagline
  tagline: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 10,
  },

  // Progress bar
  progressWrapper: {
    position: 'absolute',
    bottom: 62,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  progressTrack: {
    width: 160,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
});
