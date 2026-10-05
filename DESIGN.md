---
name: Kinetic Retail Ops
colors:
  surface: "#f7fafe"
  surface-dim: "#d7dade"
  surface-bright: "#f7fafe"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f1f4f8"
  surface-container: "#ebeef2"
  surface-container-high: "#e5e8ec"
  surface-container-highest: "#e0e3e7"
  on-surface: "#181c1f"
  on-surface-variant: "#424656"
  inverse-surface: "#2d3134"
  inverse-on-surface: "#eef1f5"
  outline: "#727687"
  outline-variant: "#c2c6d8"
  surface-tint: "#0054d6"
  primary: "#0050cb"
  on-primary: "#ffffff"
  primary-container: "#0066ff"
  on-primary-container: "#f8f7ff"
  inverse-primary: "#b3c5ff"
  secondary: "#a53c00"
  on-secondary: "#ffffff"
  secondary-container: "#fd6000"
  on-secondary-container: "#521a00"
  tertiary: "#4c5973"
  on-tertiary: "#ffffff"
  tertiary-container: "#64728c"
  on-tertiary-container: "#f6f7ff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#dae1ff"
  primary-fixed-dim: "#b3c5ff"
  on-primary-fixed: "#001849"
  on-primary-fixed-variant: "#003fa4"
  secondary-fixed: "#ffdbce"
  secondary-fixed-dim: "#ffb598"
  on-secondary-fixed: "#370e00"
  on-secondary-fixed-variant: "#7e2c00"
  tertiary-fixed: "#d6e3ff"
  tertiary-fixed-dim: "#b9c7e4"
  on-tertiary-fixed: "#0d1c32"
  on-tertiary-fixed-variant: "#39475f"
  background: "#f7fafe"
  on-background: "#181c1f"
  surface-variant: "#e0e3e7"
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: "800"
    lineHeight: 48px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: "800"
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: "600"
    lineHeight: 24px
    letterSpacing: 0em
  metric-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 40px
    letterSpacing: -0.03em
  metric-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 34px
    letterSpacing: -0.02em
  metric-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: "700"
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
    letterSpacing: 0.04em
  code-badge:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xxs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
---

## Brand & Style

This design system establishes a high-velocity, modern operating aesthetic tailored for fast-paced commercial retail, convenience kiosks, bakeries, and multi-branch point-of-sale environments. The brand personality blends institutional reliability with intense operational agility: precise, frictionless, approachable, and responsive under peak service loads.

The visual style fuses **Corporate Modern** with **Tactile SaaS Precision**. It utilizes a dual-atmosphere paradigm:

- A grounded, authoritative deep slate canvas for navigation and peripheral structure, eliminating eye fatigue during prolonged shift work.
- An ultra-crisp, high-efficiency light workspace across checkout registers, inventory logs, and metrics dashboards.
- Dynamic visual accents drawn from the intersecting geometry of the brandmark: an electric, high-contrast cyan-blue signaling speed and connectivity, paired with a vibrant catalytic orange reserved for primary transactions, immediate commitments, and revenue alerts.

The aesthetic projects confidence and zero latency, ensuring terminal operators and multi-unit managers experience absolute visual clarity.

## Colors

The system relies on a high-visibility semantic distribution:

- **Primary (`#0066FF`)**: The electric blue anchor. Drives brand presence, active tabs, keyboard shortcut indicators, search focuses, and data visualization highlights.
- **Secondary (`#FF6100`)**: The action trigger orange. Reserved strictly for primary conversion actions, closing transactions ("Iniciar sesión", "Completar pago"), critical stock callouts, and urgency alerts.
- **Tertiary (`#0A192F`)**: Deep navy slate. Functions as the shell container for side navigation panels, persistent command menus, and dark-mode brand anchors.
- **Neutral (`#F4F7FB`)**: The balanced, cool canvas gray. Provides optical separation from pure white (`#FFFFFF`) operational tiles and transaction register cards.

### Extended Functional Tokens

- **Surface Level 0 (App Shell)**: `#0A192F` (navigation) / `#F4F7FB` (workspace canvas).
- **Surface Level 1 (Cards & Registers)**: `#FFFFFF`.
- **Border Default**: `#E2E8F0` with soft opacity tints (`rgba(226, 232, 240, 0.8)`).
- **Text Primary**: `#0F172A` on light surfaces; `#FFFFFF` on navy surfaces.
- **Text Secondary**: `#64748B` on light surfaces; `#94A3B8` on navy surfaces.
- **Success / Positive**: `#10B981` (Cash drawer open, intake positive).
- **Warning / Attention**: `#F59E0B` (Stock low, alerts pending).
- **Danger / Negative**: `#EF4444` (Out of stock, cash deficit).

## Typography

The type scale combines **Plus Jakarta Sans** for structural headers and POS numerical tallies with **Inter** for dense transactional UI, tabular receipt streams, and input fields.

- **Numerics & Currencies**: All monetary figures, order counts, and cash tallies utilize **Plus Jakarta Sans** with proportional tabular figures (`tnum`) enabled via font features. This guarantees consistent vertical alignment in POS cart panels and drawer counts.
- **Section Badges & Keys**: Category chips, barcode hints, and function shortcut keys (e.g., `F2`, `F6`, `F10`) render in uppercase `code-badge` styling with elevated letter spacing to enable instantaneous recognition in chaotic counter conditions.
- **Hierarchy Anchors**: Titles on light operational workspaces pair bold weights with subtle desaturated subtitles (`#64748B`) to keep cashier focus on operational lines.

## Layout & Spacing

The design system operates on an adaptable 8px baseline rhythm (with 4px substeps for compact table cells and POS rows).

### Structural Architecture

- **Sidebar-Docked App Shell**: A persistent 240px–260px dark navy (`#0A192F`) structural column on the left, collapsible to 64px icon-only rail on tablets.
- **Split Checkout Grid (POS Register View)**:
  - Left / Main Column (65%–70% width): Global item lookup, barcode stream, fast-key product catalog, and grid tiles.
  - Right Rail (30%–35% width, min 360px): Active ticket, receipt line items, client selectors, payment breakdown, and totalizer actions.
- **Dashboard Grid**: A 12-column responsive fluid grid utilizing `gutter-lg` (24px) on wide displays (>1280px) and collapsing to 4 columns on small screen tablets (<768px).

### Breakpoints & Adaptive Behaviors

- **Desktop (>1280px)**: Persistent expanded sidebar, multi-panel transaction staging, full dashboard metric cards in 4-column rows.
- **Tablet / POS Terminal (768px – 1279px)**: Compact sidebar, stacked checkout with sliding panel for checkout totals, 2-column KPI clusters.
- **Mobile (<767px)**: Fullscreen tabbed views switching between "Venta" (Cart) and "Catálogo" (Items), bottom sheet payment summaries, fixed bottom checkout button.

## Elevation & Depth

Visual hierarchy uses a refined combination of crisp surface contrast, hairline borders, and tinted micro-shadows that keep the workspace feeling light, fast, and physical.

### Surface Hierarchy

- **Level 0 (Canvas Base)**: `#F4F7FB` — Sets an effortless neutral plane.
- **Level 1 (Card & Shell Surfaces)**: `#FFFFFF`. Sharp, white, framed with `1px solid #E2E8F0`.
- **Level 2 (Active Panels & Modals)**: `#FFFFFF` with elevated blur to lift cash tenders and checkout selectors.
- **Level 3 (Dark Navigation Anchor)**: `#0A192F` to `#101E33` gradient — Delivers depth behind white workspaces.

### Shadow Scale

- **Flat Border (Zero-elevation items)**: `0 0 0 1px #E2E8F0`
- **Elevation Sm (Cards & Input fields)**: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`
- **Elevation Md (Floating Totals, Dropdowns, Hovered Tiles)**: `0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`
- **Elevation Lg (Payment Modal, Cashout Drawers)**: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`
- **Accent Glow (Focus & Shortcut triggers)**: `0 0 0 3px rgba(0, 102, 255, 0.2)`
- **Action Button Shadow**: Primary orange buttons utilize `0 4px 14px 0 rgba(255, 97, 0, 0.35)` to command focal precedence over the white workspace.

## Shapes

The design system implements **Rounded (Level 2)** geometry:

- Standard interactive elements (input fields, table action buttons, item quantity steppers) employ `0.5rem` (8px) corner radii.
- Workspace cards, terminal registers, customer info blocks, and dashboard KPI pods utilize `rounded-lg` (`1rem` / 16px) or `rounded-xl` (`1.5rem` / 24px) for outer viewport containment.
- Status badges, operational tag pills, and keyboard shortcut chips maintain continuous soft corners to balance the strict linear grid of retail data.

## Components

### Buttons

- **Primary Checkout Button**: Background `#FF6100`, text `#FFFFFF`, font weight 700 (**Plus Jakarta Sans**), 48px height on POS screens for easy touch interactions. Includes hover state `#E65700` and focused ring `rgba(255, 97, 0, 0.3)`.
- **System Action Button**: Background `#0066FF`, text `#FFFFFF`, used for navigation confirmations, adds, and inventory creation.
- **Secondary / Ghost**: White background, `1px solid #E2E8F0`, text `#0F172A`, hover `#F8FAFC`.
- **Key Shortcut Hints**: Small secondary badges inset inside buttons displaying hotkeys (e.g., `F10`) styled in `#64748B` with an `#E2E8F0` pill boundary.

### Cards & KPI Tiles

White `#FFFFFF` container with `rounded-lg`, framed with `1px solid #E9EEF4`.

- **Metric Card Pattern**: Header contains micro uppercase label (`#64748B`), an alert/category icon within an organic light-tinted badge (e.g. light orange, cyan, or emerald background), an expansive bold metric (`28px–36px`), and an inline bottom micro-sparkline or sub-metric status text.

### Form Inputs & Barcode Bar

- Height: 44px for regular dashboard views; 48px on POS lookup bars.
- Border: `1px solid #CBD5E1`, border-radius: `0.5rem`.
- Focus state: Border transitions to `#0066FF` with `0 0 0 3px rgba(0, 102, 255, 0.15)`.
- Prepend/Append Slots: Integrated quick-clear triggers, scanning icons, and hotkey hints (`Ctrl+K` or `F2`).

### Chips & Status Badges

- **Active / Success**: `#ECFDF5` background, `#047857` text, `4px` inner indicator dot.
- **Alert / Low Stock**: `#FFF7ED` background, `#C2410C` text, warning chevron or bell indicator.
- **Info / Draft**: `#EFF6FF` background, `#1D4ED8` text.
- **Keyboard Tag**: Background `#F1F5F9`, border `#CBD5E1`, text `#475569`, monospace tracking.

### POS Ticket List

Clean alternating or bordered rows, single-click quantity editing, and inline item deletion. Summary block at bottom pinned with heavy weight tabular pricing: subtotal, taxes, and high-contrast total with double-scale currency sizing.

### Sidebar Navigation Link

- **Normal**: Text `#94A3B8`, background transparent, `0.5rem` radius, smooth hover transitioning to text `#FFFFFF` and background `rgba(255, 255, 255, 0.06)`.
- **Active**: Background `linear-gradient(90deg, rgba(0, 102, 255, 0.25) 0%, rgba(0, 102, 255, 0.08) 100%)`, text `#FFFFFF`, left accent border `#0066FF` (3px thickness).
