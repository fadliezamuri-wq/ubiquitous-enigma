"""Generates the score + sound effects for the "Si Duri" video.

Times are in seconds on the final (transition-adjusted) timeline:
Pembukaan 0-6, Kesepian 5.5-13.5, Ribut 13-19, Pagi 18.5-26.5, Penutup 26-31.
Run: python3 scripts/make_music.py  ->  public/si-duri-music.wav
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
LEN = 31.0
buf = np.zeros(int(SR * LEN))
rng = np.random.default_rng(3)

NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def hz(name):
    n, octv = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE[n] + 12 * (octv + 1) - 69) / 12)


def add(sig, t):
    i = int(t * SR)
    j = min(i + len(sig), len(buf))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def pluck(f, t, dur=1.2, amp=0.18):
    tt = np.arange(int(dur * SR)) / SR
    s = sum(np.sin(2 * np.pi * k * f * tt) * np.exp(-tt * (2.5 + k * 1.8)) / k for k in range(1, 7))
    s *= np.minimum(tt / 0.004, 1)
    add(s * amp, t)


def bell(f, t, dur=2.0, amp=0.12):
    tt = np.arange(int(dur * SR)) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 3)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * 6)) * np.exp(-tt * 2.2)
    add(s * amp * np.minimum(tt / 0.002, 1), t)


def pad(notes, t0, t1, amp=0.05):
    tt = np.arange(int((t1 - t0) * SR)) / SR
    env = np.minimum(np.minimum(tt / 0.6, 1), np.minimum((t1 - t0 - tt) / 0.6, 1))
    s = sum(np.sin(2 * np.pi * hz(n) * d * tt) for n in notes for d in (0.997, 1.003))
    add(s * env * amp / len(notes), t0)


def lowpass_noise(dur, cutoff, amp):
    n = int(dur * SR)
    spec = np.fft.rfft(rng.standard_normal(n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec[freqs > cutoff] = 0
    s = np.fft.irfft(spec, n)
    return s / (np.abs(s).max() + 1e-9) * amp


CHORDS = {
    "C": ["C3", "E3", "G3", "C4"], "G": ["G2", "D3", "G3", "B3"], "Am": ["A2", "E3", "A3", "C4"],
    "F": ["F2", "C3", "F3", "A3"], "Dm": ["D3", "F3", "A3", "D4"], "E": ["E3", "G#3", "B3", "E4"],
}


def arpeggio(chords, t0, beat, amp=0.16):
    t = t0
    for c in chords:
        notes = CHORDS[c]
        pattern = [0, 2, 1, 3, 2, 1, 3, 2]
        for k, p in enumerate(pattern):
            pluck(hz(notes[p]) * (2 if p == 3 else 1), t + k * beat / 2, amp=amp * (1.2 if k == 0 else 1))
        pad([n[:-1] + str(int(n[-1]) + 1) for n in notes[:3]], t, t + beat * 4, amp=0.035)
        t += beat * 4
    return t


def melody(notes, t0, beat, amp=0.1):
    t = t0
    for n, d in notes:
        if n != "-":
            bell(hz(n), t, dur=1.4, amp=amp)
        t += d * beat


BEAT = 0.6
# 1) Opening + friends playing: bright, bouncy (0 - 9.8s)
arpeggio(["C", "G", "Am", "F"], 0.0, BEAT)
melody([("E5", 1), ("G5", 1), ("A5", 1), ("G5", 1), ("E5", 1), ("D5", 1), ("C5", 2),
        ("D5", 1), ("E5", 1), ("G5", 1), ("E5", 1), ("D5", 2), ("-", 2)], 0.0, BEAT)
# 2) Lonely: slow minor (9.8 - 13.2s)
pad(["A3", "C4", "E4"], 9.6, 11.6, amp=0.07)
pad(["D3", "F3", "A3"], 11.4, 13.4, amp=0.07)
melody([("E5", 2), ("C5", 1), ("B4", 1.5), ("A4", 2)], 9.8, BEAT, amp=0.08)
# 3) Storm (13 - 19s): rain, wind, rumble, thunder, thump
rain = lowpass_noise(6.5, 6000, 0.05)
rain *= np.minimum(np.arange(len(rain)) / SR / 0.8, 1) * np.minimum((len(rain) / SR - np.arange(len(rain)) / SR) / 0.8, 1)
add(rain, 12.8)
wind = lowpass_noise(6.0, 500, 0.12) * (0.6 + 0.4 * np.sin(np.arange(int(6 * SR)) / SR * 2.1))
add(wind, 13.0)
pad(["A1", "E2", "A2"], 13.0, 16.8, amp=0.12)
for t, a in ((14.85, 0.5), (15.68, 0.35)):
    th = lowpass_noise(2.2, 180, a) * np.exp(-np.arange(int(2.2 * SR)) / SR * 2.2)
    add(th, t)
tt = np.arange(int(0.6 * SR)) / SR
add((np.sin(2 * np.pi * (70 - 30 * tt) * tt) * np.exp(-tt * 9) * 0.7) + lowpass_noise(0.6, 900, 0.25) * np.exp(-tt * 18), 16.87)
for k, f in enumerate([880, 660, 990]):  # dizzy stars
    bell(f, 17.4 + k * 0.35, dur=0.6, amp=0.05)
# 4) Morning: warm, rising (18.6 - 24.7s)
pad(["F3", "A3", "C4"], 18.6, 21.0, amp=0.06)
t = arpeggio(["F", "C"], 20.0, BEAT, amp=0.13)
arpeggio(["G"], t, BEAT * 0.5, amp=0.14)
for k in range(10):  # aroma sparkles
    bell(hz("C6") * 2 ** ([0, 4, 7, 12, 7, 4][k % 6] / 12), 20.0 + k * 0.4, dur=0.8, amp=0.035)
# crown fanfare
for k, n in enumerate(["C5", "E5", "G5", "C6"]):
    bell(hz(n), 24.75 + k * 0.08, dur=2.5, amp=0.12)
# 5) Finale (25 - 31s)
arpeggio(["C", "G", "Am", "F"], 25.0, BEAT * 0.75, amp=0.15)
melody([("C5", 1), ("E5", 1), ("G5", 1), ("C6", 2), ("G5", 1), ("A5", 1), ("G5", 1), ("E5", 2), ("C5", 3)], 25.0, BEAT * 0.75)
bell(hz("C5"), 29.0, dur=2.0, amp=0.1)

fade = np.ones_like(buf)
n = int(1.5 * SR)
fade[-n:] = np.linspace(1, 0, n)
buf *= fade
buf = np.tanh(buf * 1.4) * 0.8
stereo = np.stack([buf, np.roll(buf, 220)], axis=1)
out = Path(__file__).resolve().parent.parent / "public" / "si-duri-music.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
print("wrote", out)
