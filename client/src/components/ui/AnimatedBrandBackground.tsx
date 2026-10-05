import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface AnimatedBrandBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Floating glow blob — white with low opacity, heavily blurred.
 * Creates soft glowing spots over the gradient background.
 */
function Blob({
  top,
  left,
  size,
  opacity,
  animName,
  duration,
  delay,
}: {
  top: string;
  left: string;
  size: number;
  opacity: number;
  animName: string;
  duration: number;
  delay: number;
}) {
  return (
    <div
      className="abb-blob absolute rounded-full pointer-events-none"
      style={{
        top,
        left,
        width: size,
        height: size,
        background: 'white',
        opacity,
        filter: 'blur(60px)',
        animation: `${animName} ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
      }}
      data-icod-id="src_components_ui_animatedbrandbackground_tsx_1690" />
  );
}

/**
 * Floating card shape — subtle lighter rectangle drifting over the background.
 */
function FloatingShape({
  top,
  left,
  width,
  height,
  animName,
  duration,
  delay,
}: {
  top: string;
  left: string;
  width: number;
  height: number;
  animName: string;
  duration: number;
  delay: number;
}) {
  return (
    <div
      className="abb-shape absolute rounded-[var(--radius-lg)] pointer-events-none"
      style={{
        top,
        left,
        width,
        height,
        background: 'rgba(255,255,255,0.10)',
        animation: `${animName} ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: 'transform, opacity',
      }}
      data-icod-id="src_components_ui_animatedbrandbackground_tsx_e68f" />
  );
}

export default function AnimatedBrandBackground({ className, children }: AnimatedBrandBackgroundProps) {
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.current = mql.matches;
    }
  }, []);

  const noMotion = prefersReducedMotion.current;

  return (
    <div
      className={cn('absolute inset-0 w-full h-full overflow-hidden', className)}
      data-icod-id="src_components_ui_animatedbrandbackground_tsx_3c3d">
      {/* Layer 1: Multi-layer gradient mesh using primary channel tokens */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgb(var(--primary) / 0.9) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgb(var(--primary-pressed) / 0.8) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgb(var(--primary-hover) / 0.6) 0%, transparent 55%),
            rgb(var(--primary-deep) / 1)
          `,
        }}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_7a99" />
      {/* Layer 2: Faint grid overlay — 48px cells, 1px white lines at ~0.06 opacity */}
      <div
        className="abb-grid absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255,255,255,0.06) 47px, rgba(255,255,255,0.06) 48px),
            repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(255,255,255,0.06) 47px, rgba(255,255,255,0.06) 48px)
          `,
          ...(noMotion ? {} : {
            animation: 'abb-grid-drift 20s linear infinite',
          }),
          willChange: 'transform',
        }}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_7d7a" />
      {/* Layer 3: Glowing blobs — large, heavily blurred white spots */}
      <Blob
        top="10%"
        left="5%"
        size={400}
        opacity={0.12}
        animName="abb-blob-1"
        duration={25}
        delay={0}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_100b" />
      <Blob
        top="30%"
        left="55%"
        size={350}
        opacity={0.10}
        animName="abb-blob-2"
        duration={22}
        delay={1}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_9905" />
      <Blob
        top="55%"
        left="10%"
        size={450}
        opacity={0.08}
        animName="abb-blob-3"
        duration={28}
        delay={2}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_e6fb" />
      <Blob
        top="70%"
        left="50%"
        size={300}
        opacity={0.15}
        animName="abb-blob-4"
        duration={18}
        delay={0.5}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_1cd1" />
      <Blob
        top="20%"
        left="68%"
        size={380}
        opacity={0.09}
        animName="abb-blob-5"
        duration={30}
        delay={3}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_a3d6" />
      {/* Layer 4: Floating card shapes — subtle lighter rectangles */}
      <FloatingShape
        top="15%"
        left="12%"
        width={280}
        height={24}
        animName="abb-shape-1"
        duration={20}
        delay={0}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_45c1" />
      <FloatingShape
        top="40%"
        left="65%"
        width={220}
        height={20}
        animName="abb-shape-2"
        duration={24}
        delay={1.5}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_0cdc" />
      <FloatingShape
        top="62%"
        left="20%"
        width={320}
        height={28}
        animName="abb-shape-3"
        duration={26}
        delay={0.8}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_1fc3" />
      <FloatingShape
        top="80%"
        left="58%"
        width={200}
        height={18}
        animName="abb-shape-4"
        duration={19}
        delay={2}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_b6f8" />
      <FloatingShape
        top="25%"
        left="75%"
        width={260}
        height={22}
        animName="abb-shape-5"
        duration={28}
        delay={3}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_38e8" />
      {/* Children rendered above all background layers */}
      {children && (
        <div
          className="relative z-10 w-full h-full"
          data-icod-id="src_components_ui_animatedbrandbackground_tsx_cd8d">
          {children}
        </div>
      )}
    </div>
  );
}
