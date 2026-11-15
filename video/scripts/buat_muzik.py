"""Hasilkan muzik tarian comel (120 BPM, 16 saat) untuk video Buah Menari.

Guna: python3 scripts/buat_muzik.py public/muzik-tarian.wav
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
DUR = 16.0
n = int(SR * DUR)
out = np.zeros(n)
t_all = np.arange(n) / SR


def add(sig, start):
    i = int(start * SR)
    j = min(n, i + len(sig))
    out[i:j] += sig[: j - i]


def env(length, attack=0.005, decay=0.2):
    t = np.arange(int(length * SR)) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def kick():
    t = np.arange(int(0.35 * SR)) / SR
    f = 50 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9


def snare():
    t = np.arange(int(0.2 * SR)) / SR
    rng = np.random.default_rng(1)
    return (rng.uniform(-1, 1, len(t)) * 0.5 + np.sin(2 * np.pi * 190 * t) * 0.3) * np.exp(-t * 22) * 0.6


def hat():
    t = np.arange(int(0.05 * SR)) / SR
    rng = np.random.default_rng(2)
    return rng.uniform(-1, 1, len(t)) * np.exp(-t * 90) * 0.18


def tone(freq, length, vol, kind="square", decay=0.25):
    t = np.arange(int(length * SR)) / SR
    if kind == "square":
        w = np.sign(np.sin(2 * np.pi * freq * t)) * 0.5 + np.sin(2 * np.pi * freq * t) * 0.5
    elif kind == "tri":
        w = 2 * np.abs(2 * ((freq * t) % 1) - 1) - 1
    else:
        w = np.sin(2 * np.pi * freq * t)
    return w * env(length, decay=decay) * vol


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


# Corak kord: C - G - Am - F (setiap bar = 4 ketukan)
chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
bass_roots = [36, 43, 45, 41]
melody = [
    [72, None, 76, 79, 76, None, 74, 72],
    [71, None, 74, 79, 74, None, 71, 67],
    [72, None, 76, 81, 79, 76, 74, 72],
    [69, 72, 77, None, 76, 74, 72, None],
]

bars = int(DUR / (BEAT * 4))
for b in range(bars):
    bt = b * BEAT * 4
    c = b % 4
    for k in range(4):
        add(kick(), bt + k * BEAT)
        if k in (1, 3):
            add(snare(), bt + k * BEAT)
        for h in range(2):
            add(hat(), bt + k * BEAT + h * BEAT / 2 + BEAT / 4)
        # bass melompat
        add(tone(midi(bass_roots[c]), BEAT * 0.45, 0.28, "tri", 0.15), bt + k * BEAT)
        add(tone(midi(bass_roots[c] + 12), BEAT * 0.3, 0.18, "tri", 0.1), bt + k * BEAT + BEAT / 2)
        # kord "chip" off-beat
        for note in chords[c]:
            add(tone(midi(note), BEAT * 0.25, 0.05, "square", 0.08), bt + k * BEAT + BEAT / 2)
    if b >= 2:  # melodi masuk selepas 2 bar intro
        for s, note in enumerate(melody[c]):
            if note is not None:
                add(tone(midi(note), BEAT * 0.45, 0.12, "sine", 0.3), bt + s * BEAT / 2)
                add(tone(midi(note + 12), BEAT * 0.3, 0.03, "square", 0.1), bt + s * BEAT / 2)

# fade out hujung
fade = int(1.0 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = out / np.max(np.abs(out)) * 0.85
pcm = (out * 32767).astype(np.int16)

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[1])
