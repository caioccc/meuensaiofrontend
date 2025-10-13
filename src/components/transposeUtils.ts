// Utilitário para transposição de tons

const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
  'db': 'C#', 'eb': 'D#', 'gb': 'F#', 'ab': 'G#', 'bb': 'A#',
};

export function transposeKey(originalKey: string, semitones: number): string {
  if (!originalKey) return '';
  let key = originalKey.replace('M', '');
  if (FLAT_TO_SHARP[key]) key = FLAT_TO_SHARP[key];
  const idx = NOTES.findIndex(
    n => n.toUpperCase() === key.toUpperCase()
  );
  if (idx === -1) return originalKey;
  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;
  return NOTES[newIdx];
}
