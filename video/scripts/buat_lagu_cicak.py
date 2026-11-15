"""Hasilkan lagu "Cicak Comel Menari" daripada src/lagu-cicak.json.

Guna: python3 scripts/buat_lagu_cicak.py src/lagu-cicak.json public/lagu-cicak.wav
Melodi lirik dimainkan oleh suara sintetik lembut "ooh" + loceng, atas
gendang, bass dan kord. Tiada vokal sebenar (tiada TTS nyanyian di sini).
"""
import json
import sys
import wave

import numpy as np

song = json.load(open(sys.argv[1]))
SR = 44100
BEAT = 60 / song["bpm"]
BAR = BEAT * 4
EIGHTH = BEAT / 2
DUR = song["bars"] * BAR + 1.0
n = int(SR * DUR)
out = np.zeros(n)
rng = np.random.default_rng(7)


def add(sig, start):
    i = int(start * SR)
    if i >= n:
        return
    j = min(n, i + len(sig))
    out[i:j] += sig[: j - i]


def tt(length):
    return np.arange(int(length * SR)) / SR


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def kick():
    t = tt(0.35)
    f = 50 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.8


def snare():
    t = tt(0.2)
    return (rng.uniform(-1, 1, len(t)) * 0.5 + np.sin(2 * np.pi * 190 * t) * 0.3) * np.exp(-t * 22) * 0.45


def clap():
    t = tt(0.18)
    e = np.exp(-t * 30) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 30) * (t > 0.012)
    return rng.uniform(-1, 1, len(t)) * e * 0.35


def hat():
    t = tt(0.05)
    return rng.uniform(-1, 1, len(t)) * np.exp(-t * 90) * 0.12


def pluck(freq, length, vol, decay=0.15):
    t = tt(length)
    w = 2 * np.abs(2 * ((freq * t) % 1) - 1) - 1
    return w * np.clip(t / 0.004, 0, 1) * np.exp(-t / decay) * vol


def chip(freq, length, vol):
    t = tt(length)
    w = np.sign(np.sin(2 * np.pi * freq * t))
    return w * np.exp(-t / 0.07) * vol


def voice(freq, length, vol):
    """Suara 'ooh' lembut: harmonik dibentuk ala vokal + vibrato."""
    t = tt(length)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.15, 0, 1)
    ph = 2 * np.pi * freq * np.cumsum(vib) / SR
    weights = [1.0, 0.55, 0.25, 0.14, 0.06, 0.04]
    w = sum(a * np.sin((k + 1) * ph) for k, a in enumerate(weights))
    att = np.clip(t / 0.025, 0, 1)
    rel = np.clip((length - t) / 0.06, 0, 1)
    return w * att * rel * vol


def bell(freq, length, vol):
    t = tt(length)
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2.76 * t)) * np.exp(-t / 0.25) * vol


CHORD = {
    "C": ([60, 64, 67], 36),
    "G": ([55, 59, 62], 43),
    "F": ([53, 57, 60], 41),
    "Am": ([57, 60, 64], 45),
}
chorus_bars = {ln["bar"] for ln in song["lines"] if ln["part"] == "chorus"}

for b, name in enumerate(song["chords"]):
    bt = b * BAR
    notes, root = CHORD[name]
    last = b == song["bars"] - 1
    for k in range(4):
        add(kick(), bt + k * BEAT)
        if k in (1, 3):
            add(clap() if b in chorus_bars else snare(), bt + k * BEAT)
        for h in range(2):
            add(hat(), bt + k * BEAT + h * EIGHTH + EIGHTH / 2)
        if last and k > 0:
            continue
        add(pluck(midi(root), BEAT * 0.45, 0.3), bt + k * BEAT)
        add(pluck(midi(root + 12), BEAT * 0.3, 0.18, 0.1), bt + k * BEAT + EIGHTH)
        for nn in notes:
            add(chip(midi(nn), BEAT * 0.22, 0.035), bt + k * BEAT + EIGHTH)
    if last:
        for nn in notes + [72]:
            add(bell(midi(nn + 12), 2.0, 0.06), bt)
            add(voice(midi(nn), 1.8, 0.05), bt)

# melodi intro (bar 0-1) & outro (bar 18) dengan loceng
riff = [72, 76, 79, 76, 74, 71, 74, 79, 72, 76, 79, 81, 79, 76, 74, 72]
for i, m in enumerate(riff):
    add(bell(midi(m), 0.5, 0.12), i * EIGHTH)
    add(bell(midi(m), 0.5, 0.12), 18 * BAR + i * EIGHTH)

# melodi lirik
for line in song["lines"]:
    pos = line["bar"] * BAR
    for text, note, ln in line["syl"]:
        length = ln * EIGHTH
        add(voice(midi(note), length * 0.95, 0.16), pos)
        add(bell(midi(note + 12), min(length, 0.4), 0.05), pos)
        if text.startswith("Hop"):
            add(clap() * 0.8, pos)
        if text.startswith("wing"):
            t = tt(length)
            buzz = np.sin(2 * np.pi * (1300 + 500 * np.sin(2 * np.pi * 9 * t)) * t) * np.exp(-t / 0.3) * 0.04
            add(buzz, pos)
        pos += length

fade = int(1.0 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out = out / np.max(np.abs(out)) * 0.88
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
print("ok", sys.argv[2], round(DUR, 1), "s")
