'use client';

import { useMemo } from 'react';

const fullAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetIndexProps {
  availableLetters: string[];
  onLetterClick: (letter: string) => void;
}

export default function AlphabetIndex({ availableLetters, onLetterClick }: AlphabetIndexProps) {
  const availableSet = useMemo(() => new Set(availableLetters), [availableLetters]);

  return (
    <div className="alphabet-index">
      {fullAlphabet.map((letter, i) => {
        const isAvailable = availableSet.has(letter);
        return (
          <span
            key={letter}
            className={`alphabet-letter ${isAvailable ? 'available' : 'empty'}`}
            onClick={() => isAvailable && onLetterClick(letter)}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}
