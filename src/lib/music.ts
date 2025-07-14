/* eslint-disable @typescript-eslint/no-explicit-any */
const notesWithSharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const notesWithFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Mapeia notas enarmônicas para consistência
const noteMap: { [key: string]: string } = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#',
};

/**
 * Transpõe uma única nota por um número de semitons.
 * @param note A nota a ser transposta (ex: "C#", "F").
 * @param amount O número de semitons (positivo ou negativo).
 * @param useSharps Define se a escala de destino usará sustenidos ou bemóis.
 * @returns A nota transposta.
 */
const transposeNote = (note: string, amount: number, useSharps: boolean): string => {
  const scale = useSharps ? notesWithSharps : notesWithFlats;
  // Tenta encontrar a nota ou sua enarmônica na escala de sustenidos para ter um índice base
  let noteIndex = notesWithSharps.indexOf(note);
  if (noteIndex === -1) {
    noteIndex = notesWithSharps.indexOf(noteMap[note] || '');
  }
  if (noteIndex === -1) return note; // Retorna a nota original se não for encontrada

  let transposedIndex = (noteIndex + amount) % 12;
  if (transposedIndex < 0) {
    transposedIndex += 12;
  }
  return scale[transposedIndex];
};

/**
 * Transpõe um acorde completo (ex: "Am", "G7", "C/B").
 * @param chord O acorde a ser transposto.
 * @param semitones O número de semitons.
 * @returns O acorde transposto.
 */
export const transposeChord = (chord: string, semitones: number): string => {
  if (!chord || semitones === 0) {
    return chord;
  }

  // Regex para separar a nota raiz, a qualidade do acorde e o baixo (em acordes com barra)
  const chordRegex = /^([A-G][#b]?)(\S*)(\/([A-G][#b]?))?$/;
  const match = chord.match(chordRegex);

  if (!match) {
    return chord; // Retorna o original se não for um formato de acorde válido
  }

  const [, root, quality, , bass] = match;

  // Decide se usa sustenidos ou bemóis com base na nota original para manter a consistência
  const useSharps = !root.includes('b');

  const newRoot = transposeNote(root, semitones, useSharps);
  const newBass = bass ? transposeNote(bass, semitones, useSharps) : '';

  return `${newRoot}${quality || ''}${newBass ? `/${newBass}` : ''}`;
};

/**
 * Transpõe a cifra inteira de uma música.
 * @param chords A estrutura de acordes da música.
 * @param semitones O número de semitons.
 * @returns A estrutura de acordes transposta.
 */
export const transposeSongChords = (chords: any[], semitones: number) => {
  if (semitones === 0) return chords;
  return chords.map(chord => ({
    ...chord,
    note: transposeChord(chord.note, semitones),
    note_fmt: transposeChord(chord.note_fmt, semitones),
  }));
};

/**
 * Calcula o novo tom da música com base no tom original e na transposição.
 * @param originalKey O tom original da música (ex: "C", "Gm").
 * @param semitones O número de semitons.
 * @returns O novo tom.
 */
export const getTransposedKey = (originalKey: string, semitones: number): string => {
  if (!originalKey) return '-';
  return transposeChord(originalKey, semitones);
};
