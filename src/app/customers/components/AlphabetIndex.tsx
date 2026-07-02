'use client';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabetIndexProps {
  onLetterClick: (letter: string) => void;
}

export default function AlphabetIndex({ onLetterClick }: AlphabetIndexProps) {
  return (
    <div className="alphabet-index">
      {alphabet.map((letter) => (
        <span
          key={letter}
          onClick={() => onLetterClick(letter)}
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
