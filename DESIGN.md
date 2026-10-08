---
name: "Quartz Monochrome"
description: "No chromatic color at all. Five steps of grey on a paper-white canvas, generous 16px radii, oversized whitespace, one humanist sans for everything. The discipline is the brand."
tags: [minimal, monochrome, light, premium, modern]
colors:
  primary:   "#0F0F11"
  secondary: "#6F6F75"
  tertiary:  "#A8A8AE"
  neutral:   "#FAFAF8"
  surface:   "#FFFFFF"
typography:
  display: Geist
  body:    Geist
  mono:    "Geist Mono"
  scale:
    hero: "4.75rem / 1.05 / 500 / -0.04em"
    h1:   "2.75rem / 1.08 / 500 / -0.032em"
    h2:   "1.5rem / 1.3 / 500 / -0.018em"
    body: "1.0625rem / 1.65 / 400 / -0.005em"
radius:
  sm: 10px
  md: 14px
  lg: 16px
  pill: 9999px
shadows:
  card:   "0 1px 2px rgba(15, 15, 17, 0.04), 0 8px 24px -12px rgba(15, 15, 17, 0.08)"
  button: "0 1px 2px rgba(15, 15, 17, 0.06)"
borders:
  card:    "1px solid rgba(15, 15, 17, 0.06)"
  divider: "rgba(15, 15, 17, 0.08)"
buttons:
  primary:
    background: #0F0F11
    color: #FAFAF8
    border: 1px solid #0F0F11
    shape: pill
    padding: 12px 24px
    font: 500 / 0.9375rem / -0.005em
    shadow: 0 1px 2px rgba(15, 15, 17, 0.06)
  secondary:
    background: #FFFFFF
    color: #0F0F11
    border: 1px solid rgba(15, 15, 17, 0.10)
    shape: pill
    padding: 12px 24px
    font: 500 / 0.9375rem / -0.005em
  outline:
    background: transparent
    color: #0F0F11
    border: 1px solid rgba(15, 15, 17, 0.16)
    shape: pill
    padding: 11px 23px
    font: 500 / 0.9375rem / -0.005em
  ghost:
    background: transparent
    color: #6F6F75
    border: none
    shape: pill
    padding: 11px 6px
    font: 500 / 0.9375rem / -0.005em
    hover: underline
charts:
  variant: line
  stroke_width: 2
  gridlines: false
  highlight: last
  dot_marker: true
  axis_color: "#A8A8AE"
  palette: ["#0F0F11"]
fonts_url: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
dependencies: ["lucide-react"]
---

# Quartz Monochrome

## AI Build Instructions

> **Read this section before writing any code.** The rules below
> are non-negotiable. Every value used in the UI must come from this
> file's frontmatter — never substitute, approximate, or invent new
> colors, fonts, radii, or shadows. If a value is missing, ask the
> user before adding one.

### 1 · Your role

You are building UI for a project that has adopted **Quartz Monochrome** as its
design system. Treat `DESIGN.md` as the single source of truth.
Your job is to translate the user's product requirements into
components and pages that look like they were designed by the same
person who authored this file.

### 2 · Token compliance

- Pull every color, font family, radius, shadow, and spacing value
  from the frontmatter at the top of this file.
- Use semantic roles (e.g. `primary`, `accent`, `muted`) — never
  hard-code hex values that bypass the system.
- When a token can be expressed as a CSS variable, declare it once
  in your global stylesheet and reference it everywhere downstream.
- The Google Fonts `<link>` is provided in the Typography section.
  Add it to `<head>` before any component renders.

### 3 · Component recipes

Use these recipes verbatim when building the corresponding component.

#### Buttons

Four variants are defined. Pick one — never blend variants or invent a fifth.

- **Primary** — pill shape, bg `#0F0F11`, text `#FAFAF8`, border `1px solid #0F0F11`, padding `12px 24px`, weight `500`, shadow `0 1px 2px rgba(15, 15, 17, 0.06)`.
- **Secondary** — pill shape, bg `#FFFFFF`, text `#0F0F11`, border `1px solid rgba(15, 15, 17, 0.10)`, padding `12px 24px`, weight `500`.
- **Outline** — pill shape, text `#0F0F11`, border `1px solid rgba(15, 15, 17, 0.16)`, padding `11px 23px`, weight `500`.
- **Ghost** — pill shape, text `#6F6F75`, padding `11px 6px`, weight `500`.

Reach for **primary** as the single dominant CTA per screen.
**Secondary** for the supporting action. **Outline** for tertiary
actions in toolbars. **Ghost** for inline links and table actions.

#### Cards

- Background: `#FFFFFF`
- Border: `1px solid rgba(15, 15, 17, 0.06)`
- Shadow: `0 1px 2px rgba(15, 15, 17, 0.04), 0 8px 24px -12px rgba(15, 15, 17, 0.08)`
- Radius: `radius.lg` (`16px`)
- Internal padding: `20px` for compact cards, `24–28px` for content cards.

#### Charts

- Bar/line variant: `line`
- No gridlines — let the bars/lines carry the data.
- Highlight strategy: `last` — emphasize a single bar/point per chart.
- Use the declared palette in order: `#0F0F11`.

#### Typography pairings

- **Display (`Geist`)** — h1, h2, hero headlines, brand wordmarks.
- **Body (`Geist`)** — paragraphs, labels, button text, form inputs.
- **Mono (`Geist Mono`)** — code, eyebrows, metadata, numerals in tables.

### 4 · Hard constraints

Never do any of the following without explicit instruction from the user:

- Introduce a new color, font, radius, or shadow that isn't declared above.
- Mix this system with another (e.g. don't paste in Material or Bootstrap defaults).
- Use generic gradient defaults (purple→blue, peach→pink) — they break the system's voice.
- Reach for emoji icons. Use a consistent icon library and size icons in line with body type.
- Add motion that exceeds the system's restraint — keep transitions short (≤200ms) and subtle.

### 5 · Before you finish — verify

Run through this checklist for every screen you produce:

- [ ] Every color used appears in the Colors table above.
- [ ] Headlines use the display font; body copy uses the body font.
- [ ] Buttons match one of the declared variants exactly (shape, padding, weight).
- [ ] Border-radius values come from `radius.sm` / `radius.md` / `radius.lg` / `radius.pill`.
- [ ] Cards and dividers use the declared border + shadow tokens.
- [ ] No values were invented; if you needed something missing, you stopped and asked.

---

## Overview
Quartz Monochrome is the discipline of removing color until only structure remains. The entire system is five steps of grey on a paper-white canvas — no blue, no accent, no warm tertiary. One humanist sans (Geist) is used for everything. Corner radii are generous (16px). Whitespace is the loudest element on the page.

The system disappears so the content can speak. For writing platforms, design portfolios, premium reading apps, design libraries, anything where the page should feel like a glass case around the work.

## Color
A five-step greyscale. No chroma anywhere.

| Token | Hex | Use |
|-------|-----|-----|
| Ink | #0F0F11 | Primary text, primary CTA fill |
| Mid | #6F6F75 | Secondary text |
| Light | #A8A8AE | Tertiary text, axis labels |
| Canvas | #FAFAF8 | Page background |
| Surface | #FFFFFF | Card surface |

The canvas is **#FAFAF8** — paper-white with the faintest warm bias so the page doesn't feel sterile. The surface is pure white, one notch up.

## Typography
**One family: Geist.** Display, body, mono variant — all Geist. The single-family decision is itself the system.

| Role | Size | Weight | Tracking |
|------|------|--------|----------|
| Hero | 4.75rem | 500 | -0.04em |
| H1 | 2.75rem | 500 | -0.032em |
| H2 | 1.5rem | 500 | -0.018em |
| Body | 1.0625rem | 400 | -0.005em / 1.65 |

Display weight is **500, never 700**. The system is quiet — bold type would break the discipline.

## Geometry
- **Radii: 10 / 14 / 16, plus pill.** Generous and soft. Never sharp.
- **Section gap: 128px** desktop, 80px mobile. Whitespace is the discipline.
- **12-column grid** with 32px gutters. Wide gutters reinforce the calm.

## Buttons
All pills. Four variants share the same vertical rhythm.

- **Primary** — solid ink pill, canvas-tone label. The single loud element on the page.
- **Secondary** — surface white pill, ink label, hairline border.
- **Outline** — bare hairline pill.
- **Ghost** — bare mid-grey label, hover underline.

There is no danger / success / warning button. The system has no semantic color.

## Cards
Surface white on canvas, 1px ink hairline at 6% opacity, 14px corner radius, single soft layered shadow. Padding 32px minimum. Cards have generous internal whitespace — the same discipline as the page.

## Charts & Data
Single ink line at 2px stroke, no gridlines, end-of-line dot marker. Axis labels in light grey at 11px. The chart is a hairline drawing, not a marketing visualization.

## Do's and Don'ts
- ✅ One family for everything — Geist. The single-family decision IS the brand.
- ✅ Display weight 500. Never go up to 700.
- ✅ Whitespace is the loudest element. Section gaps of 128px are not optional.
- ✅ Generous 14-16px radii. Soft modern, never sharp.
- ❌ No chromatic color. No blue link, no green checkmark, no red error. The system is monochrome.
- ❌ No second font. The discipline of one family is the entire identity.
- ❌ No display weight above 500. Bold breaks the calm.
- ❌ No drop shadow heavier than the spec. The shadow is a whisper.

---

## Tokens

> Generated from the same source the live preview renders from.
> Treat the values below as the contract — never substitute approximations.

### Colors

| Role      | Value |
|-----------|-------|
| primary   | `#0F0F11` |
| secondary | `#6F6F75` |
| tertiary  | `#A8A8AE` |
| neutral   | `#FAFAF8` |
| surface   | `#FFFFFF` |

### Typography

- **Display:** Geist
- **Body:** Geist
- **Mono:** Geist Mono

| Role | size / leading / weight / tracking |
|------|------------------------------------|
| Hero | 4.75rem / 1.05 / 500 / -0.04em |
| H1   | 2.75rem / 1.08 / 500 / -0.032em |
| H2   | 1.5rem / 1.3 / 500 / -0.018em |
| Body | 1.0625rem / 1.65 / 400 / -0.005em |

### Radius

- sm: `10px`
- md: `14px`
- lg: `16px`
- pill: `9999px`

### Shadows

- **card:** `0 1px 2px rgba(15, 15, 17, 0.04), 0 8px 24px -12px rgba(15, 15, 17, 0.08)`
- **button:** `0 1px 2px rgba(15, 15, 17, 0.06)`

### Borders

- **card:** `1px solid rgba(15, 15, 17, 0.06)`
- **divider:** `rgba(15, 15, 17, 0.08)`

### Buttons

Four variants, each fully tokenized. The preview renders from these exact values.

#### Primary

| Property | Value |
|----------|-------|
| shape | `pill` |
| background | `#0F0F11` |
| color | `#FAFAF8` |
| border | `1px solid #0F0F11` |
| padding | `12px 24px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |
| shadow | `0 1px 2px rgba(15, 15, 17, 0.06)` |

#### Secondary

| Property | Value |
|----------|-------|
| shape | `pill` |
| background | `#FFFFFF` |
| color | `#0F0F11` |
| border | `1px solid rgba(15, 15, 17, 0.10)` |
| padding | `12px 24px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |

#### Outline

| Property | Value |
|----------|-------|
| shape | `pill` |
| background | `transparent` |
| color | `#0F0F11` |
| border | `1px solid rgba(15, 15, 17, 0.16)` |
| padding | `11px 23px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |

#### Ghost

| Property | Value |
|----------|-------|
| shape | `pill` |
| background | `transparent` |
| color | `#6F6F75` |
| border | `none` |
| padding | `11px 6px` |
| fontWeight | `500` |
| fontSize | `0.9375rem` |
| tracking | `-0.005em` |
| hoverHint | `underline` |

### Charts

| Property | Value |
|----------|-------|
| variant | `line` |
| strokeWidth | `2` |
| gridlines | `false` |
| highlight | `last` |
| dotMarker | `true` |
| axisColor | `#A8A8AE` |
| palette | `#0F0F11` |

---

## Pro tokens

> Production-fidelity tokens. States, density, motion, elevation,
> content rules and a measured WCAG contract — derived from the
> resting tokens unless explicitly authored.

### States

#### Button

- **hover** — shadow: `0 4px 12px -2px rgba(15,23,42,0.18)`, filter: `brightness(0.97)`
- **focus** — outline: `2px solid rgba(168, 168, 174, 0.5)`, outline-offset: `2px`
- **active** — shadow: `0 1px 2px rgba(15,23,42,0.1)`, transform: `scale(0.98)`
- **disabled** — opacity: `0.4`, filter: `saturate(0.5)`
- **loading** — opacity: `0.7`
- **selected** — bg: `#A8A8AE`, color: `#FFFFFF`

#### Input

- **hover** — border: `1px solid rgba(168, 168, 174, 0.5)`
- **focus** — border: `1.5px solid #A8A8AE`, shadow: `0 0 0 4px rgba(168, 168, 174, 0.15)`
- **disabled** — bg: `rgba(15, 15, 17, 0.04)`, opacity: `0.4`
- **error** — border: `1.5px solid #DC2626`, shadow: `0 0 0 4px rgba(220,38,38,0.15)`

#### Card

- **hover** — shadow: `0 12px 28px -12px rgba(15,23,42,0.18)`, transform: `translateY(-2px)`
- **selected** — bg: `rgba(168, 168, 174, 0.04)`, border: `1.5px solid #A8A8AE`
- **dragging** — shadow: `0 20px 48px -16px rgba(15,23,42,0.3)`, transform: `scale(1.02) rotate(-0.5deg)`, opacity: `0.9`

#### Tab

- **hover** — bg: `rgba(168, 168, 174, 0.06)`, color: `#A8A8AE`
- **focus** — outline: `2px solid rgba(168, 168, 174, 0.5)`, outline-offset: `2px`
- **selected** — color: `#A8A8AE`, border: `0 0 2px 0 solid #A8A8AE`

### Density

| Mode | padding × | row × | body | radius × | Use for |
|------|-----------|-------|------|----------|---------|
| compact | 0.72 | 0.78 | 0.8125rem | 0.85 | Information-dense — tables, IDEs, dashboards |
| comfortable | 1 | 1 | 0.9375rem | — | Default — most product UI |
| spacious | 1.35 | 1.3 | 1rem | 1.15 | Editorial — marketing, long-form, settings |

### Motion

**Signature — Quiet ease.** 240 ms ease-out for all standard transitions. Reliable, invisible — motion stays out of the way.

```css
transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
```

| Token | Value |
|-------|-------|
| duration.instant | `80ms` |
| duration.fast | `160ms` |
| duration.base | `240ms` |
| duration.slow | `380ms` |
| easing.standard | `cubic-bezier(0.4, 0, 0.2, 1)` |
| easing.decelerate | `cubic-bezier(0.0, 0, 0.2, 1)` |
| easing.accelerate | `cubic-bezier(0.4, 0, 1, 1)` |
| easing.spring | `cubic-bezier(0.34, 1.4, 0.64, 1)` |

### Elevation

Five-level scale, system-specific recipe.

| Level | Shadow | Recipe |
|-------|--------|--------|
| level0 | `none` | Flat — hairline border separates. |
| level1 | `0 1px 2px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)` | List rows, resting cards. |
| level2 | `0 4px 12px -2px rgba(15,23,42,0.1), 0 2px 6px rgba(15,23,42,0.06)` | Hover cards, popover. |
| level3 | `0 12px 32px -8px rgba(15,23,42,0.16), 0 4px 12px rgba(15,23,42,0.08)` | Sheets, side panels. |
| level4 | `0 28px 64px -16px rgba(15,23,42,0.28), 0 8px 24px rgba(15,23,42,0.12)` | Modals — scrim required. |

### Content

- **measure:** `68ch` (max line length for body prose)
- **paragraph spacing:** `1.2em`
- **list indent:** `1.5em`
- **list gap:** `0.5em`
- **link:** color `#A8A8AE`, underline `hover`
- **blockquote:** border `3px solid rgba(168, 168, 174, 0.6)`, padding `0.5em 0 0.5em 1.25em`
- **code:** background `rgba(15, 15, 17, 0.06)`, color `#0F0F11`
