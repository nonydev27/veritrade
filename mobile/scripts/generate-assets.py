#!/usr/bin/env python3
"""
VeriTrade Asset Generator — pycairo edition
Produces crisp vector-rendered icons and splash assets.
"""

import cairo
import math
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')

# ── Brand colours ──────────────────────────────────────────────────────────────
DARK         = (0x06/255, 0x0C/255, 0x1A/255)
BLUE_TOP     = (0x3B/255, 0x82/255, 0xF6/255)
BLUE_MID     = (0x1A/255, 0x56/255, 0xDB/255)
BLUE_BOT     = (0x0E/255, 0x3A/255, 0x9F/255)
ORANGE       = (0xF9/255, 0x73/255, 0x16/255)
ORANGE_DARK  = (0xEA/255, 0x58/255, 0x0C/255)
WHITE        = (1.0, 1.0, 1.0)


# ── Shield path helper ─────────────────────────────────────────────────────────
def shield_path(ctx, cx, cy, r):
    """Draw a clean heraldic shield path centred at (cx, cy) with half-height r."""
    s = r / 56.0
    ctx.new_path()
    # Top-left arch → top-right arch (convex arch at the top)
    ctx.move_to(cx,          cy - 56*s)
    ctx.curve_to(cx + 14*s, cy - 52*s,  cx + 38*s, cy - 40*s,  cx + 50*s, cy - 20*s)
    # Right side tapering to bottom point
    ctx.curve_to(cx + 54*s, cy -  4*s,  cx + 52*s, cy + 18*s,  cx + 42*s, cy + 34*s)
    ctx.curve_to(cx + 28*s, cy + 50*s,  cx + 12*s, cy + 60*s,  cx,        cy + 66*s)
    # Left mirror
    ctx.curve_to(cx - 12*s, cy + 60*s,  cx - 28*s, cy + 50*s,  cx - 42*s, cy + 34*s)
    ctx.curve_to(cx - 52*s, cy + 18*s,  cx - 54*s, cy -  4*s,  cx - 50*s, cy - 20*s)
    ctx.curve_to(cx - 38*s, cy - 40*s,  cx - 14*s, cy - 52*s,  cx,        cy - 56*s)
    ctx.close_path()


# ── Background glow ────────────────────────────────────────────────────────────
def paint_bg(ctx, size):
    """Dark navy background with subtle centre glow."""
    # Base fill
    ctx.rectangle(0, 0, size, size)
    ctx.set_source_rgb(*DARK)
    ctx.fill()

    # Centre radial glow
    cx = cy = size / 2
    rg = cairo.RadialGradient(cx, cy, 0, cx, cy, size * 0.55)
    rg.add_color_stop_rgba(0.0, 0x1A/255, 0x56/255, 0xDB/255, 0.28)
    rg.add_color_stop_rgba(1.0, 0x06/255, 0x0C/255, 0x1A/255, 0.0)
    ctx.rectangle(0, 0, size, size)
    ctx.set_source(rg)
    ctx.fill()


# ── Outer ring / halo around the shield ───────────────────────────────────────
def paint_ring(ctx, cx, cy, r):
    """Subtle concentric ring for a premium look."""
    for (ring_r, alpha) in [(r * 1.42, 0.06), (r * 1.22, 0.09)]:
        rg = cairo.RadialGradient(cx, cy, ring_r * 0.7, cx, cy, ring_r)
        rg.add_color_stop_rgba(0.0, *BLUE_MID, alpha)
        rg.add_color_stop_rgba(1.0, *BLUE_MID, 0.0)
        ctx.arc(cx, cy, ring_r, 0, 2*math.pi)
        ctx.set_source(rg)
        ctx.fill()


# ── Core logo drawing function ─────────────────────────────────────────────────
def draw_logo(ctx, cx, cy, r, bg=False, bg_size=None):
    """
    Render the VeriTrade shield logo.
    cx,cy  — centre of shield
    r      — half-height of shield (controls scale)
    bg     — whether to first paint the dark background
    bg_size — canvas side length (needed when bg=True)
    """
    if bg:
        paint_bg(ctx, bg_size)

    s = r / 56.0

    # ── Outer glow ───────────────────────────────────────────────────────────
    paint_ring(ctx, cx, cy, r)

    # ── Shield fill (vertical gradient) ──────────────────────────────────────
    shield_path(ctx, cx, cy, r)
    lg = cairo.LinearGradient(cx, cy - 56*s, cx, cy + 66*s)
    lg.add_color_stop_rgb(0.0, *BLUE_TOP)
    lg.add_color_stop_rgb(0.5, *BLUE_MID)
    lg.add_color_stop_rgb(1.0, *BLUE_BOT)
    ctx.set_source(lg)
    ctx.fill_preserve()

    # ── Shield border ─────────────────────────────────────────────────────────
    ctx.set_source_rgba(1, 1, 1, 0.22)
    ctx.set_line_width(2.8 * s)
    ctx.stroke()

    # ── Inner highlight (top edge shimmer) ───────────────────────────────────
    ctx.save()
    shield_path(ctx, cx, cy, r)
    ctx.clip()
    hl = cairo.LinearGradient(cx, cy - 56*s, cx, cy - 10*s)
    hl.add_color_stop_rgba(0.0, 1, 1, 1, 0.18)
    hl.add_color_stop_rgba(1.0, 1, 1, 1, 0.0)
    ctx.rectangle(cx - r, cy - 56*s, r * 2, r * 1.0)
    ctx.set_source(hl)
    ctx.fill()
    ctx.restore()

    # ── Checkmark ─────────────────────────────────────────────────────────────
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    lw = 7.5 * s

    # Left leg (white)
    ctx.new_path()
    ctx.move_to(cx - 24*s, cy +  4*s)
    ctx.line_to(cx -  6*s, cy + 22*s)
    ctx.set_source_rgb(*WHITE)
    ctx.set_line_width(lw)
    ctx.stroke()

    # Right leg (orange) — rises up to top-right
    ctx.new_path()
    ctx.move_to(cx -  6*s, cy + 22*s)
    ctx.line_to(cx + 26*s, cy - 18*s)
    ctx.set_source_rgb(*ORANGE)
    ctx.set_line_width(lw)
    ctx.stroke()

    # Orange tip dot
    dot_r = 5.5 * s
    ctx.arc(cx + 26*s, cy - 18*s, dot_r, 0, 2*math.pi)
    rg = cairo.RadialGradient(cx + 26*s, cy - 18*s - dot_r*0.3,
                               dot_r * 0.2,
                               cx + 26*s, cy - 18*s,
                               dot_r)
    rg.add_color_stop_rgb(0.0, *WHITE)
    rg.add_color_stop_rgb(1.0, *ORANGE_DARK)
    ctx.set_source(rg)
    ctx.fill()


# ── Rounded-rect clip ─────────────────────────────────────────────────────────
def clip_rounded_rect(ctx, size, radius_frac=0.224):
    r = size * radius_frac
    x, y, w, h = 0, 0, size, size
    ctx.new_path()
    ctx.arc(x + r,     y + r,     r, math.pi,       3*math.pi/2)
    ctx.arc(x + w - r, y + r,     r, 3*math.pi/2,   0)
    ctx.arc(x + w - r, y + h - r, r, 0,             math.pi/2)
    ctx.arc(x + r,     y + h - r, r, math.pi/2,     math.pi)
    ctx.close_path()
    ctx.clip()


# ── Writers ───────────────────────────────────────────────────────────────────
def write(surface, name):
    path = os.path.join(OUT, name)
    surface.write_to_png(path)
    s = surface.get_width()
    print(f'  ✓  {name}  ({s}×{s})')


def make_icon(size=1024):
    """Square icon with rounded corners and full brand background."""
    sur = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(sur)
    clip_rounded_rect(ctx, size)
    draw_logo(ctx, size/2, size/2 + size*0.02, size * 0.44,
              bg=True, bg_size=size)
    write(sur, 'icon.png')


def make_splash_icon(size=512):
    """Transparent bg — Expo paints #060C1A behind it."""
    sur = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(sur)
    draw_logo(ctx, size/2, size/2, size * 0.40, bg=False)
    write(sur, 'splash-icon.png')


def make_favicon(size=64):
    """Small rounded-square favicon."""
    sur = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(sur)
    clip_rounded_rect(ctx, size, 0.22)
    draw_logo(ctx, size/2, size/2 + size*0.02, size * 0.44,
              bg=True, bg_size=size)
    write(sur, 'favicon.png')


def make_android_fg(size=1024):
    """Android adaptive foreground — logo centred on transparent."""
    sur = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(sur)
    # Android safe zone is ~66 % of the canvas
    draw_logo(ctx, size/2, size/2 + size*0.02, size * 0.30, bg=False)
    write(sur, 'android-icon-foreground.png')


def make_android_mono(size=1024):
    """Single-colour white shield for Android monochrome icon."""
    sur = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(sur)
    s = (size * 0.30) / 56.0
    cx, cy = size/2, size/2 + size*0.02
    shield_path(ctx, cx, cy, size * 0.30)
    ctx.set_source_rgba(1, 1, 1, 1)
    ctx.fill()
    # White checkmark
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    lw = 7.5 * s
    ctx.new_path()
    ctx.move_to(cx - 24*s, cy +  4*s)
    ctx.line_to(cx -  6*s, cy + 22*s)
    ctx.line_to(cx + 26*s, cy - 18*s)
    ctx.set_source_rgba(0, 0, 0, 1)
    ctx.set_line_width(lw)
    ctx.stroke()
    write(sur, 'android-icon-monochrome.png')


def make_android_bg(size=1024):
    """Solid brand-blue background for Android adaptive icon."""
    sur = cairo.ImageSurface(cairo.FORMAT_ARGB32, size, size)
    ctx = cairo.Context(sur)
    ctx.rectangle(0, 0, size, size)
    ctx.set_source_rgb(*BLUE_MID)
    ctx.fill()
    write(sur, 'android-icon-background.png')


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('Generating VeriTrade assets…')
    make_icon()
    make_splash_icon()
    make_favicon()
    make_android_fg()
    make_android_mono()
    make_android_bg()
    print('Done.')
