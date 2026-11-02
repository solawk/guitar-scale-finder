import { TUNING, FRETS, SCALE_TYPES, pitchClass, noteName, scaleNotes } from './music.js';

export const CHORD_TYPES = Object.freeze([
  { id: 'major', suffix: '', name: 'Major', intervals: [0, 4, 7] },
  { id: 'minor', suffix: 'm', name: 'Minor', intervals: [0, 3, 7] },
  { id: 'power', suffix: '5', name: 'Power chord', intervals: [0, 7] },
  { id: 'dim', suffix: 'dim', name: 'Diminished', intervals: [0, 3, 6] },
  { id: 'aug', suffix: 'aug', name: 'Augmented', intervals: [0, 4, 8] },
  { id: 'sus2', suffix: 'sus2', name: 'Suspended 2nd', intervals: [0, 2, 7] },
  { id: 'sus4', suffix: 'sus4', name: 'Suspended 4th', intervals: [0, 5, 7] },
  { id: '7', suffix: '7', name: 'Dominant 7th', intervals: [0, 4, 7, 10] },
  { id: 'maj7', suffix: 'maj7', name: 'Major 7th', intervals: [0, 4, 7, 11] },
  { id: 'min7', suffix: 'm7', name: 'Minor 7th', intervals: [0, 3, 7, 10] },
  { id: 'half-dim7', suffix: 'm7♭5', name: 'Half-diminished 7th', intervals: [0, 3, 6, 10] },
  { id: 'dim7', suffix: 'dim7', name: 'Diminished 7th', intervals: [0, 3, 6, 9] },
  { id: 'min-maj7', suffix: 'm(maj7)', name: 'Minor major 7th', intervals: [0, 3, 7, 11] },
  { id: '6', suffix: '6', name: 'Major 6th', intervals: [0, 4, 7, 9] },
  { id: 'min6', suffix: 'm6', name: 'Minor 6th', intervals: [0, 3, 7, 9] },
  { id: 'add9', suffix: 'add9', name: 'Major add 9', intervals: [0, 2, 4, 7] },
  { id: 'min-add9', suffix: 'm(add9)', name: 'Minor add 9', intervals: [0, 2, 3, 7] },
  { id: '9', suffix: '9', name: 'Dominant 9th', intervals: [0, 2, 4, 7, 10] },
  { id: 'maj9', suffix: 'maj9', name: 'Major 9th', intervals: [0, 2, 4, 7, 11] },
  { id: 'min9', suffix: 'm9', name: 'Minor 9th', intervals: [0, 2, 3, 7, 10] },
  { id: '7sus4', suffix: '7sus4', name: 'Dominant 7 sus4', intervals: [0, 5, 7, 10] }
].map(type => Object.freeze({ ...type, intervals: Object.freeze(type.intervals) })));
const chordTypes = new Map(CHORD_TYPES.map(type => [type.id, type]));
const step = (roman, offset, quality) => Object.freeze({ roman, offset, quality });
export const PROGRESSIONS = Object.freeze([
  { id: 'pop', name: 'Pop loop', mode: 'major', steps: [step('I', 0, 'major'), step('V', 7, 'major'), step('vi', 9, 'minor'), step('IV', 5, 'major')] },
  { id: 'minor-pop', name: 'Minor pop loop', mode: 'minor', steps: [step('i', 0, 'minor'), step('VI', 8, 'major'), step('III', 3, 'major'), step('VII', 10, 'major')] },
  { id: 'doo-wop', name: 'Doo-wop', mode: 'major', steps: [step('I', 0, 'major'), step('vi', 9, 'minor'), step('IV', 5, 'major'), step('V', 7, 'major')] },
  { id: 'turnaround', name: 'Turnaround', mode: 'major', steps: [step('I', 0, 'major'), step('vi', 9, 'minor'), step('ii', 2, 'minor'), step('V', 7, 'major')] },
  { id: 'three-chord', name: 'Three-chord rock', mode: 'major', steps: [step('I', 0, 'major'), step('IV', 5, 'major'), step('V', 7, 'major')] },
  { id: 'jazz', name: 'Major ii–V–I', mode: 'major', steps: [step('ii7', 2, 'min7'), step('V7', 7, '7'), step('Imaj7', 0, 'maj7')] },
  { id: 'minor-jazz', name: 'Minor ii–V–i', mode: 'minor', steps: [step('iiø7', 2, 'half-dim7'), step('V7', 7, '7'), step('i', 0, 'minor')] },
  { id: 'andalusian', name: 'Andalusian cadence', mode: 'minor', steps: [step('i', 0, 'minor'), step('VII', 10, 'major'), step('VI', 8, 'major'), step('V', 7, 'major')] },
  { id: 'minor-rock', name: 'Minor rock loop', mode: 'minor', steps: [step('i', 0, 'minor'), step('VII', 10, 'major'), step('VI', 8, 'major'), step('VII', 10, 'major')] },
  { id: 'mixolydian-rock', name: 'Mixolydian rock', mode: 'major', steps: [step('I', 0, 'major'), step('♭VII', 10, 'major'), step('IV', 5, 'major')] },
  { id: 'plagal', name: 'Plagal movement', mode: 'major', steps: [step('I', 0, 'major'), step('IV', 5, 'major')] },
  { id: 'folk', name: 'Folk turnaround', mode: 'major', steps: [step('I', 0, 'major'), step('IV', 5, 'major'), step('I', 0, 'major'), step('V', 7, 'major')] },
  { id: 'canon', name: 'Canon sequence', mode: 'major', steps: [step('I', 0, 'major'), step('V', 7, 'major'), step('vi', 9, 'minor'), step('iii', 4, 'minor'), step('IV', 5, 'major'), step('I', 0, 'major'), step('IV', 5, 'major'), step('V', 7, 'major')] },
  { id: 'blues', name: '12-bar blues', mode: 'major', steps: [step('I7', 0, '7'), step('I7', 0, '7'), step('I7', 0, '7'), step('I7', 0, '7'), step('IV7', 5, '7'), step('IV7', 5, '7'), step('I7', 0, '7'), step('I7', 0, '7'), step('V7', 7, '7'), step('IV7', 5, '7'), step('I7', 0, '7'), step('V7', 7, '7')] }
].map(pattern => Object.freeze({ ...pattern, steps: Object.freeze(pattern.steps) })));

export const OVERLAY_COLORS = Object.freeze(['#8dc4e8', '#b6cf87', '#d1a0dd', '#e8ba79', '#87d2c5', '#e798a2', '#b1b3ed', '#c6c995']);
export const emptyVoicing = () => Array(6).fill(null);
export function isVoicing(value) { return Array.isArray(value) && value.length === 6 && value.every(fret => fret === null || (Number.isInteger(fret) && fret >= 0 && fret <= FRETS)); }
export function voicingPitches(voicing) {
  if (!isVoicing(voicing)) throw new RangeError('Invalid guitar voicing');
  return [...new Set(voicing.flatMap((fret, string) => fret === null ? [] : [pitchClass(TUNING[string] + fret)]))].sort((a, b) => a - b);
}
export function voicingBass(voicing) {
  if (!isVoicing(voicing)) throw new RangeError('Invalid guitar voicing');
  const midis = voicing.flatMap((fret, string) => fret === null ? [] : [TUNING[string] + fret]);
  return midis.length ? pitchClass(Math.min(...midis)) : null;
}
export function chordPitches(root, quality) {
  const type = chordTypes.get(quality);
  if (!type) throw new RangeError('Unknown chord type');
  return type.intervals.map(interval => pitchClass(root + interval));
}
export function detectChords(voicing) {
  const pitches = voicingPitches(voicing);
  if (pitches.length < 2) return [];
  const bass = voicingBass(voicing);
  const results = [];
  for (const type of CHORD_TYPES) {
    if (type.intervals.length !== pitches.length) continue;
    for (const root of pitches) {
      const expected = chordPitches(root, type.id);
      if (pitches.every(pitch => expected.includes(pitch))) results.push({ root, quality: type.id, pitches, bass, voicing: [...voicing] });
    }
  }
  return results.sort((a, b) => Number(b.root === bass) - Number(a.root === bass) || CHORD_TYPES.findIndex(type => type.id === a.quality) - CHORD_TYPES.findIndex(type => type.id === b.quality));
}
export function chordLabel(chord, flats = false, includeBass = true) {
  if (!chord) return 'No chord';
  const suffix = chord.quality === 'custom' ? ' (custom)' : chordTypes.get(chord.quality)?.suffix ?? '';
  const bass = includeBass && chord.bass !== null && chord.bass !== undefined && chord.bass !== chord.root ? `/${noteName(chord.bass, flats)}` : '';
  return `${noteName(chord.root, flats)}${suffix}${bass}`;
}
export function qualityFits(chord, expectedQuality) {
  const expected = chordTypes.get(expectedQuality)?.intervals;
  if (!expected) return false;
  const actual = chord.pitches.map(pitch => pitchClass(pitch - chord.root));
  if (chord.quality === 'custom' || chord.quality === 'power') return actual.every(interval => expected.includes(interval));
  // A triad can stand in for its seventh-chord family, but conflicting thirds,
  // fifths or sevenths are never treated as a match.
  for (const alternatives of [[3, 4], [6, 7, 8], [9, 10, 11]]) {
    const a = alternatives.filter(interval => actual.includes(interval));
    const b = alternatives.filter(interval => expected.includes(interval));
    // A sixth is not a seventh: compare it only when both chords use a sixth.
    if (alternatives[0] === 9) {
      const a7 = a.filter(interval => interval >= 10 || chord.quality === 'dim7');
      const b7 = b.filter(interval => interval >= 10 || expectedQuality === 'dim7');
      if (a7.length && b7.length && !a7.some(interval => b7.includes(interval))) return false;
    } else if (a.length && b.length && !a.some(interval => b.includes(interval))) return false;
  }
  const actualSuspended = !actual.includes(3) && !actual.includes(4);
  const expectedSuspended = !expected.includes(3) && !expected.includes(4);
  if (actualSuspended !== expectedSuspended) return false;
  if (actualSuspended && !actual.every(interval => expected.includes(interval))) return false;
  return true;
}

export function matchProgressions(sequence) {
  if (sequence.length < 2) return [];
  const matches = [];
  for (const pattern of PROGRESSIONS) {
    for (let start = 0; start < pattern.steps.length; start++) {
      const tonic = pitchClass(sequence[0].root - pattern.steps[start].offset);
      const fits = sequence.every((chord, index) => {
        const expected = pattern.steps[(start + index) % pattern.steps.length];
        return chord.root === pitchClass(tonic + expected.offset) && qualityFits(chord, expected.quality);
      });
      if (!fits) continue;
      matches.push({ pattern, tonic, start, complete: sequence.length >= pattern.steps.length,
        numerals: sequence.map((_, index) => pattern.steps[(start + index) % pattern.steps.length].roman),
        usesPowerChords: sequence.some(chord => chord.quality === 'power'),
        exactQualities: sequence.every((chord, index) => chord.quality === pattern.steps[(start + index) % pattern.steps.length].quality) });
    }
  }
  return matches.sort((a, b) => Number(b.complete) - Number(a.complete) || Number(b.exactQualities) - Number(a.exactQualities) || (b.complete ? b.pattern.steps.length - a.pattern.steps.length : a.pattern.steps.length - b.pattern.steps.length));
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const KEY_SCALE_IDS = ['major', 'minor', 'harmonic-minor', 'dorian', 'mixolydian'];
export function romanInScale(chord, tonic, type) {
  const notes = scaleNotes(type, tonic);
  const degree = notes.indexOf(chord.root);
  if (degree < 0) return '?';
  let numeral = ROMANS[degree];
  const relative = chord.pitches.map(pitch => pitchClass(pitch - chord.root));
  if (chord.quality === 'power') {
    const expectedThird = pitchClass(notes[(degree + 2) % 7] - chord.root);
    if (expectedThird === 3) numeral = numeral.toLowerCase();
    return `${numeral}5`;
  }
  if (relative.includes(3) && !relative.includes(4)) numeral = numeral.toLowerCase();
  if (chord.quality === 'dim' || chord.quality === 'dim7') return `${numeral}°${chord.quality === 'dim7' ? '7' : ''}`;
  if (chord.quality === 'half-dim7') return `${numeral}ø7`;
  if (chord.quality === 'aug') return `${numeral}+`;
  const suffixes = { '7': '7', maj7: 'maj7', min7: '7', 'min-maj7': '(maj7)', '6': '6', min6: '6', add9: 'add9', 'min-add9': 'add9', '9': '9', maj9: 'maj9', min9: '9', sus2: 'sus2', sus4: 'sus4', '7sus4': '7sus4', custom: '?' };
  return numeral + (suffixes[chord.quality] ?? '');
}
export function possibleKeys(sequence) {
  if (sequence.length < 2) return [];
  const results = [];
  for (const id of KEY_SCALE_IDS) {
    const type = SCALE_TYPES.find(scale => scale.id === id);
    for (let tonic = 0; tonic < 12; tonic++) {
      const notes = new Set(scaleNotes(type, tonic));
      if (!sequence.every(chord => chord.pitches.every(pitch => notes.has(pitch)))) continue;
      results.push({ tonic, type, numerals: sequence.map(chord => romanInScale(chord, tonic, type)), score: Number(sequence[0].root === tonic) * 3 + Number(sequence.at(-1).root === tonic) * 2 + (id === 'major' || id === 'minor' ? 1 : 0) });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

export function voicingCenter(voicing) {
  const frets = (voicing ?? []).filter(fret => fret !== null && fret > 0);
  return frets.length ? frets.reduce((a, b) => a + b, 0) / frets.length : 2;
}
const voicingCache = new Map();
export function findVoicing(root, quality, nearFret = 3) {
  const center = Math.max(0, Math.min(FRETS, Math.round(nearFret)));
  const key = `${root}:${quality}:${center}`;
  if (voicingCache.has(key)) return [...voicingCache.get(key)];
  const pitches = chordPitches(root, quality);
  const targetMask = pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
  let best = null;
  let bestScore = Infinity;
  for (let start = 0; start <= FRETS - 3; start++) {
    const options = TUNING.map(midi => [null, ...Array.from({ length: FRETS + 1 }, (_, fret) => fret).filter(fret => (fret === 0 || (fret >= Math.max(1, start) && fret <= start + 3)) && pitches.includes(pitchClass(midi + fret)))]);
    const voicing = emptyVoicing();
    function search(string, mask, sounding, lowMidi, minFret, maxFret, sumFret, fretted) {
      if (string < 0) {
        if (mask !== targetMask || sounding < Math.max(3, pitches.length) || pitchClass(lowMidi) !== root) return;
        const used = voicing.map((fret, index) => fret === null ? -1 : index).filter(index => index >= 0);
        const gaps = used.at(-1) - used[0] + 1 - used.length;
        const average = fretted ? sumFret / fretted : 0;
        const span = fretted ? maxFret - minFret : 0;
        const score = span * 1.9 + Math.abs(average - center) * 1.45 + average * 0.09 + gaps * 5 + (6 - sounding) * 0.65 + fretted * 0.08;
        if (score < bestScore) { bestScore = score; best = [...voicing]; }
        return;
      }
      const missing = pitches.filter(pitch => !(mask & (1 << pitch))).length;
      if (missing > string + 1 || sounding + string + 1 < Math.max(3, pitches.length)) return;
      for (const fret of options[string]) {
        voicing[string] = fret;
        if (fret === null) search(string - 1, mask, sounding, lowMidi, minFret, maxFret, sumFret, fretted);
        else {
          const midi = TUNING[string] + fret;
          search(string - 1, mask | (1 << pitchClass(midi)), sounding + 1, Math.min(lowMidi, midi), fret > 0 ? Math.min(minFret, fret) : minFret, fret > 0 ? Math.max(maxFret, fret) : maxFret, sumFret + fret, fretted + Number(fret > 0));
        }
      }
    }
    search(5, 0, 0, Infinity, Infinity, 0, 0, 0);
  }
  if (best) voicingCache.set(key, best);
  return best ? [...best] : null;
}

export function buildProgression(pattern, anchorIndex, anchor, powerMode = false) {
  const slot = pattern?.steps[anchorIndex];
  if (!slot || !anchor || !qualityFits(anchor, slot.quality)) return null;
  if (powerMode && pattern.steps.some(item => !chordTypes.get(item.quality).intervals.includes(7))) return null;
  const tonic = pitchClass(anchor.root - slot.offset);
  const center = voicingCenter(anchor.voicing);
  const chords = pattern.steps.map((item, index) => {
    if (index === anchorIndex) return { ...anchor, pitches: [...anchor.pitches], voicing: anchor.voicing ? [...anchor.voicing] : null };
    const root = pitchClass(tonic + item.offset);
    const quality = powerMode ? 'power' : item.quality;
    return { root, quality, pitches: chordPitches(root, quality).sort((a, b) => a - b), bass: root, voicing: findVoicing(root, quality, center) };
  });
  const identities = [...new Set(chords.map(chord => `${chord.root}:${chord.quality}`))];
  return { pattern, tonic, anchorIndex, chords, colors: chords.map(chord => OVERLAY_COLORS[identities.indexOf(`${chord.root}:${chord.quality}`) % OVERLAY_COLORS.length]) };
}

export function normalizeSavedChord(value) {
  if (!value || !Number.isInteger(value.root) || value.root < 0 || value.root > 11 || (value.quality !== 'custom' && !chordTypes.has(value.quality))) return null;
  if (!Array.isArray(value.pitches) || value.pitches.length < 2 || value.pitches.length > 6 || !value.pitches.every(pitch => Number.isInteger(pitch) && pitch >= 0 && pitch <= 11) || !value.pitches.includes(value.root)) return null;
  const pitches = [...new Set(value.pitches)].sort((a, b) => a - b);
  if (pitches.length !== value.pitches.length) return null;
  if (value.quality !== 'custom' && chordPitches(value.root, value.quality).sort((a, b) => a - b).join() !== pitches.join()) return null;
  const voicing = isVoicing(value.voicing) ? [...value.voicing] : null;
  if (voicing && voicingPitches(voicing).join() !== pitches.join()) return null;
  const bass = voicing ? voicingBass(voicing) : value.root;
  return { root: value.root, quality: value.quality, pitches, bass, voicing };
}
