// Pitch classes use C = 0. Strings are ordered visually, from high E to low E.
export const TUNING = Object.freeze([64, 59, 55, 50, 45, 40]);
export const FRETS = 24;
export const SHARP_NAMES = Object.freeze(['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']);
export const FLAT_NAMES = Object.freeze(['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']);
export const SCALE_TYPES = Object.freeze([
  { id: 'major', name: 'Major', subtitle: 'Ionian', family: 'diatonic', intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ['1', '2', '3', '4', '5', '6', '7'] },
  { id: 'minor', name: 'Natural minor', subtitle: 'Aeolian', family: 'diatonic', intervals: [0, 2, 3, 5, 7, 8, 10], degrees: ['1', '2', '♭3', '4', '5', '♭6', '♭7'] },
  { id: 'dorian', name: 'Dorian', subtitle: 'Minor with a major 6th', family: 'diatonic', intervals: [0, 2, 3, 5, 7, 9, 10], degrees: ['1', '2', '♭3', '4', '5', '6', '♭7'] },
  { id: 'phrygian', name: 'Phrygian', subtitle: 'Minor with a minor 2nd', family: 'diatonic', intervals: [0, 1, 3, 5, 7, 8, 10], degrees: ['1', '♭2', '♭3', '4', '5', '♭6', '♭7'] },
  { id: 'lydian', name: 'Lydian', subtitle: 'Major with a raised 4th', family: 'diatonic', intervals: [0, 2, 4, 6, 7, 9, 11], degrees: ['1', '2', '3', '♯4', '5', '6', '7'] },
  { id: 'mixolydian', name: 'Mixolydian', subtitle: 'Major with a minor 7th', family: 'diatonic', intervals: [0, 2, 4, 5, 7, 9, 10], degrees: ['1', '2', '3', '4', '5', '6', '♭7'] },
  { id: 'locrian', name: 'Locrian', subtitle: 'Minor with ♭2 and ♭5', family: 'diatonic', intervals: [0, 1, 3, 5, 6, 8, 10], degrees: ['1', '♭2', '♭3', '4', '♭5', '♭6', '♭7'] },
  { id: 'major-pentatonic', name: 'Major pentatonic', subtitle: 'Five notes', family: 'pentatonic', intervals: [0, 2, 4, 7, 9], degrees: ['1', '2', '3', '5', '6'] },
  { id: 'minor-pentatonic', name: 'Minor pentatonic', subtitle: 'Five notes', family: 'pentatonic', intervals: [0, 3, 5, 7, 10], degrees: ['1', '♭3', '4', '5', '♭7'] },
  { id: 'harmonic-minor', name: 'Harmonic minor', subtitle: 'Minor with a major 7th', family: 'additional', intervals: [0, 2, 3, 5, 7, 8, 11], degrees: ['1', '2', '♭3', '4', '5', '♭6', '7'] },
  { id: 'melodic-minor', name: 'Melodic minor', subtitle: 'Ascending / jazz', family: 'additional', intervals: [0, 2, 3, 5, 7, 9, 11], degrees: ['1', '2', '♭3', '4', '5', '6', '7'] },
  { id: 'major-blues', name: 'Major blues', subtitle: 'Pentatonic + ♭3', family: 'additional', intervals: [0, 2, 3, 4, 7, 9], degrees: ['1', '2', '♭3', '3', '5', '6'] },
  { id: 'minor-blues', name: 'Minor blues', subtitle: 'Pentatonic + ♭5', family: 'additional', intervals: [0, 3, 5, 6, 7, 10], degrees: ['1', '♭3', '4', '♭5', '5', '♭7'] }
].map(scale => Object.freeze({ ...scale, intervals: Object.freeze(scale.intervals), degrees: Object.freeze(scale.degrees) })));

export function pitchClass(midi) { return ((midi % 12) + 12) % 12; }
export function noteAt(string, fret) {
  if (!Number.isInteger(string) || string < 0 || string >= TUNING.length || !Number.isInteger(fret) || fret < 0 || fret > FRETS) throw new RangeError('Position outside fretboard');
  return pitchClass(TUNING[string] + fret);
}
export function noteName(pitch, flats = false) { return (flats ? FLAT_NAMES : SHARP_NAMES)[pitchClass(pitch)]; }
export function scaleNotes(type, root) { return type.intervals.map(interval => pitchClass(root + interval)); }
export function containsNotes(type, root, selected) {
  const pitches = new Set(scaleNotes(type, root));
  return [...selected].every(pitch => pitches.has(pitchClass(pitch)));
}
export function matchingScales(selected) {
  return SCALE_TYPES.flatMap(type => Array.from({ length: 12 }, (_, root) => ({ type, root })).filter(scale => containsNotes(type, scale.root, selected)));
}
