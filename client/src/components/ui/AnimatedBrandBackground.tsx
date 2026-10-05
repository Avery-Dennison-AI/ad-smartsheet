import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

export interface AnimatedBrandBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * CSS keyframes injected once globally via a module-level style element.
 * All animations use only transform + opacity for GPU compositing.
 */
const ABB_STYLE_ID = 'abb-keyframes-style';

const KEYFRAMES_CSS = `
@keyframes abb-grid-drift {
  from { transform: translateY(0); }
  to   { transform: translateY(48px); }
}

@keyframes abb-blob-1 {
  from { transform: translate(0, 0) rotate(0deg); }
  to   { transform: translate(30px, -20px) rotate(3deg); }
}

@keyframes abb-blob-2 {
  from { transform: translate(0, 0) rotate(0deg); }
  to   { transform: translate(-25px, 15px) rotate(-2deg); }
}

@keyframes abb-blob-3 {
  from { transform: translate(0, 0) rotate(0deg); }
  to   { transform: translate(20px, 25px) rotate(4deg); }
}

@keyframes abb-blob-4 {
  from { transform: translate(0, 0) rotate(0deg); }
  to   { transform: translate(-15px, -30px) rotate(-3deg); }
}

@keyframes abb-blob-5 {
  from { transform: translate(0, 0) rotate(0deg); }
  to   { transform: translate(35px, 10px) rotate(2deg); }
}

@media (prefers-reduced-motion: reduce) {
  [class^="abb-"] {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`;

function ensureStyles(): void {
  if (typeof document === 'undefined') return;
  if (!document.getElementById(ABB_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = ABB_STYLE_ID;
    style.textContent = KEYFRAMES_CSS;
    document.head.appendChild(style);
  }
}

/**
 * Floating abstract shape — rounded rectangle resembling a spreadsheet row/card.
 * White at low opacity, drifting on independent loops.
 */
function Blob({
  top,
  left,
  width,
  height,
  opacity,
  animName,
  duration,
  delay,
}: {
  top: string;
  left: string;
  width: number;
  height: number;
  opacity: number;
  animName: string;
  duration: number;
  delay: number;
}) {
  return (
    <div
      className={cn('abb-blob absolute rounded-[var(--radius-lg)] bg-white pointer-events-none motion-reduce:animate-none')}
      style={{
        top,
        left,
        width,
        height,
        opacity,
        animation: `${animName} ${duration}s ease-in-out infinite alternate`,
        animationDelay: `${delay}s`,
        willChange: 'transform',
      }}
      data-icod-id="src_components_ui_animatedbrandbackground_tsx_88cf" />
  );
}

export default function AnimatedBrandBackground({ className, children }: AnimatedBrandBackgroundProps) {
  const injected = useRef(false);

  useEffect(() => {
    if (!injected.current) {
      ensureStyles();
      injected.current = true;
    }
  }, []);

  return (
    <div
      className={cn('absolute inset-0 w-full h-full overflow-hidden', className)}
      data-icod-id="animated_brand_background_root"
    >
      {/* Layer 1: Gradient mesh base using primary tokens */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgb(var(--primary) / 1) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, rgb(var(--primary-pressed) / 1) 0%, transparent 55%),
            linear-gradient(160deg, #0d0002 0%, rgb(var(--primary-pressed) / 1) 40%, rgb(var(--primary) / 1) 70%, #0d0002 100%)
          `,
        }}
        data-icod-id="animated_brand_background_gradient"
      />
      {/* Layer 2: Faint grid overlay — 48px cells, 1px white lines at ~0.07 opacity */}
      <div
        className={cn('abb-grid absolute inset-0 pointer-events-none motion-reduce:animate-none')}
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255,255,255,0.07) 47px, rgba(255,255,255,0.07) 48px),
            repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(255,255,255,0.07) 47px, rgba(255,255,255,0.07) 48px)
          `,
          animation: 'abb-grid-drift 20s linear infinite',
          willChange: 'transform',
        }}
        data-icod-id="animated_brand_background_grid"
      />
      {/* Layer 3: Floating abstract shapes */}
      <Blob
        top="12%"
        left="8%"
        width={320}
        height={28}
        opacity={0.06}
        animName="abb-blob-1"
        duration={25}
        delay={0}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_a0eb" />
      <Blob
        top="35%"
        left="60%"
        width={260}
        height={24}
        opacity={0.05}
        animName="abb-blob-2"
        duration={22}
        delay={1}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_52de" />
      <Blob
        top="58%"
        left="15%"
        width={380}
        height={32}
        opacity={0.07}
        animName="abb-blob-3"
        duration={28}
        delay={2}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_2f84" />
      <Blob
        top="75%"
        left="55%"
        width={220}
        height={20}
        opacity={0.04}
        animName="abb-blob-4"
        duration={18}
        delay={0.5}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_563a" />
      <Blob
        top="22%"
        left="72%"
        width={300}
        height={36}
        opacity={0.08}
        animName="abb-blob-5"
        duration={30}
        delay={3}
        data-icod-id="src_components_ui_animatedbrandbackground_tsx_f90d" />
      {/* Children rendered above the background layers */}
      {children && (
        <div
          className="relative z-10 w-full h-full"
          data-icod-id="src_components_ui_animatedbrandbackground_tsx_48ea">
          {children}
        </div>
      )}
    </div>
  );
}
