export type MascotMood = 'happy' | 'normal' | 'hungry' | 'sad' | 'celebrate';

const MOOD_LABEL: Record<MascotMood, string> = {
  happy: '小桃开心地眯着眼睛',
  normal: '小桃安静地看着你',
  hungry: '小桃肚子饿了',
  sad: '小桃有点失落',
  celebrate: '小桃在为你庆祝',
};

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'celebrate') {
    return (
      <>
        <path d="M45 80q6-7 12 0" stroke="#1D1D1F" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path d="M63 80q6-7 12 0" stroke="#1D1D1F" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === 'sad') {
    return (
      <>
        <path d="M45 74l9 3M66 77l9-3" stroke="#7C5362" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="51" cy="81" r="2.3" fill="#1D1D1F" />
        <circle cx="69" cy="81" r="2.3" fill="#1D1D1F" />
        <path d="M67 87c1.6 3.2 1.2 6-1.1 7.2-2.1-2.2-1.9-4.7 1.1-7.2Z" fill="#9CCDE8" opacity=".85" />
      </>
    );
  }
  if (mood === 'hungry') {
    return (
      <>
        <path d="M45 73l9 4M66 77l9-4" stroke="#7C5362" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="51" cy="81" r="2.3" fill="#1D1D1F" />
        <circle cx="69" cy="81" r="2.3" fill="#1D1D1F" />
      </>
    );
  }
  return (
    <>
      <circle cx="51" cy="79" r="2.5" fill="#1D1D1F" />
      <circle cx="69" cy="79" r="2.5" fill="#1D1D1F" />
    </>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'celebrate') {
    return (
      <>
        <path d="M53 91c2.5 5 11.5 5 14 0Z" fill="#7C5362" />
        <path d="M53 91c2.5 5 11.5 5 14 0" fill="none" stroke="#7C5362" strokeWidth="2.2" strokeLinejoin="round" />
      </>
    );
  }
  if (mood === 'sad') {
    return <path d="M55 96q5-4 10 0" stroke="#7C5362" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
  if (mood === 'hungry') {
    return (
      <>
        <ellipse cx="60" cy="93" rx="5" ry="4" fill="#7C5362" opacity=".8" />
        <path d="M53 91q7-2 14 0" stroke="#7C5362" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    );
  }
  return <path d="M56 90q4 4 8 0" stroke="#7C5362" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
}

export function Mascot({
  mood = 'normal',
  equipped = {},
  size = 120,
  className,
}: {
  mood?: MascotMood;
  equipped?: Record<string, string>;
  size?: number;
  className?: string;
}) {
  const headId = equipped.head;
  const neckId = equipped.neck;
  const faceId = equipped.face;

  return (
    <svg
      className={className}
      width={size}
      height={(size * 130) / 120}
      viewBox="0 0 120 130"
      role="img"
      aria-label={MOOD_LABEL[mood]}
    >
      {neckId === 'cape' && (
        <path
          d="M31 78c-11 16-15 32-12 47 9-4 17-13 23-26l5-15Z"
          fill="#BFE8D9"
          stroke="#8FC9B3"
          strokeWidth="1.6"
        />
      )}
      <ellipse cx="43" cy="31" rx="11.5" ry="25" fill="#F6BCCB" transform="rotate(-14 43 31)" />
      <ellipse cx="77" cy="31" rx="11.5" ry="25" fill="#F6BCCB" transform="rotate(14 77 31)" />
      <ellipse cx="43" cy="32" rx="6" ry="16" fill="#FDE3EA" transform="rotate(-14 43 32)" />
      <ellipse cx="77" cy="32" rx="6" ry="16" fill="#FDE3EA" transform="rotate(14 77 32)" />
      <path
        d="M60 44c-22 0-38 18-38 40 0 24 17 38 38 38s38-14 38-38c0-22-16-40-38-40z"
        fill={mood === 'sad' ? '#F6D2DC' : '#F9D9E2'}
        stroke="#E7A5B8"
        strokeWidth="2.2"
      />
      <path d="M60 46c-5 6-5 12 0 18 5-6 5-12 0-18z" fill="#F0B6C7" />
      <path d="M60 46c4-10 12-13 20-10-2 9-10 14-20 10z" fill="#9FD3BE" />
      <Eyes mood={mood} />
      {(mood === 'happy' || mood === 'celebrate' || mood === 'normal') && (
        <>
          <ellipse cx="40" cy="90" rx="5.5" ry="3.4" fill="#EFA3B8" opacity=".5" />
          <ellipse cx="80" cy="90" rx="5.5" ry="3.4" fill="#EFA3B8" opacity=".5" />
        </>
      )}
      <Mouth mood={mood} />
      {neckId === 'scarf' && (
        <>
          <path d="M38 103c13 7 31 7 44 0l-2 9c-13 5-27 5-40 0Z" fill="#BFE8D9" stroke="#8FC9B3" strokeWidth="1.5" />
          <path d="M77 108l8 14-8 2-5-13Z" fill="#BFE8D9" stroke="#8FC9B3" strokeWidth="1.5" />
        </>
      )}
      {faceId === 'glasses' && (
        <>
          <circle cx="51" cy="80" r="9" fill="#FFF" opacity=".22" stroke="#5C2E3E" strokeWidth="2" />
          <circle cx="69" cy="80" r="9" fill="#FFF" opacity=".22" stroke="#5C2E3E" strokeWidth="2" />
          <path d="M60 80h0M42 78l-6-2M78 78l6-2" stroke="#5C2E3E" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {headId === 'bow' && (
        <g transform="translate(82 26) rotate(12)">
          <path d="M0 0c-6-7-16-5-16 3s10 9 16 2Z" fill="#E4698F" />
          <path d="M0 0c6-7 16-5 16 3s-10 9-16 2Z" fill="#E4698F" />
          <circle cx="0" cy="3" r="3.4" fill="#C1355E" />
        </g>
      )}
      {headId === 'crown' && (
        <g>
          <path d="M40 20l5-10 9 6 6-12 6 12 9-6 5 10Z" fill="#FFE8A3" stroke="#D8B35A" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="60" cy="10" r="2" fill="#C1355E" />
          <circle cx="45" cy="16" r="1.6" fill="#C1355E" />
          <circle cx="75" cy="16" r="1.6" fill="#C1355E" />
        </g>
      )}
      {mood === 'celebrate' && (
        <>
          <path d="M24 56l1.5 4 4 1.5-4 1.5L24 67l-1.5-4-4-1.5 4-1.5L24 56Z" fill="#E4698F" />
          <path d="M94 46l1.2 3.2 3.2 1.2-3.2 1.2L94 55l-1.2-3.4-3.2-1.2 3.2-1.2L94 46Z" fill="#FFE8A3" />
        </>
      )}
    </svg>
  );
}
