import type { ReactNode } from 'react';
import { LayoutGrid } from 'lucide-react';

export interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Split-screen auth layout: teal brand panel on the left (desktop),
 * white form area on the right. Collapses to compact header on mobile.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-screen w-full"
      data-icod-id="src_components_layout_authlayout_tsx_root">
      {/* Left panel — desktop only */}
      <div
        className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden bg-primary"
        data-icod-id="src_components_layout_authlayout_tsx_left_panel">
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)`,
          }}
          data-icod-id="src_components_layout_authlayout_tsx_grid_pattern" />

        <div
          className="relative z-10 max-w-md px-8 text-center"
          data-icod-id="src_components_layout_authlayout_tsx_hero_content">
          <div
            className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-card/20"
            data-icod-id="src_components_layout_authlayout_tsx_logo_bg">
            <LayoutGrid
              className="h-6 w-6 text-primary-foreground"
              data-icod-id="src_components_layout_authlayout_tsx_logo_icon" />
          </div>
          <h1
            className="text-xl font-semibold text-primary-foreground leading-tight"
            data-icod-id="src_components_layout_authlayout_tsx_headline">
            Plan, track, and deliver work in one place
          </h1>
          <p
            className="mt-3 text-sm text-primary-foreground/80"
            data-icod-id="src_components_layout_authlayout_tsx_subheadline">
            GridFlow brings your team's tasks, timelines, and collaboration into a single intuitive workspace.
          </p>
        </div>
      </div>
      {/* Mobile header bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 flex h-20 items-center justify-center py-5 bg-primary"
        data-icod-id="src_components_layout_authlayout_tsx_mobile_header">
        <span
          className="text-lg font-bold text-primary-foreground"
          data-icod-id="src_components_layout_authlayout_tsx_mobile_logo">GridFlow</span>
      </div>
      {/* Right panel / form area */}
      <div
        className="flex w-full md:w-1/2 flex-col items-center justify-center bg-card pt-[80px] md:pt-0"
        data-icod-id="src_components_layout_authlayout_tsx_right_panel">
        {children}
      </div>
    </div>
  );
}
