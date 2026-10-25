import { petSkinFor, type PetSkin } from '../data/pets';

export type MascotMood = 'happy' | 'normal' | 'hungry' | 'sad' | 'celebrate';

const MOOD_LABEL: Record<MascotMood, string> = {
  happy: '小伙伴开心地眯着眼睛',
  normal: '小伙伴安静地看着你',
  hungry: '小伙伴肚子饿了',
  sad: '小伙伴有点失落',
  celebrate: '小伙伴在为你庆祝',
};

/* 小伙伴绘制 v4（宠物商城形象重绘：每个物种独立造型）：
   - 五官（眼/嘴/腮红）与情绪系统全角色共用，坐标统一（眼 y≈79、嘴 y≈90）
   - 头身按物种分发：小桃/淘气 = 桃形兔耳；蓝莓 = 浆果圆耳 + 莓蒂；
     柠檬 = 柠檬形猫耳；波波 = 小企鹅（白肚/脚蹼/橙嘴）；云云 = 云朵轮廓
   - viewBox 120×130 与全站调用比例不变；配饰槽位全兼容
   - animated prop：呼吸感微动画（CSS，prefers-reduced-motion 全局豁免） */

const INK = '#5C3A44';
const MOUTH = '#9E4B5E';

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === 'happy' || mood === 'celebrate') {
    return (
      <>
        <path d="M42.5 80q7.5-9.5 15-.8" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        <path d="M62.5 79.2q7.5-9.5 15 .8" stroke={INK} strokeWidth="3.6" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === 'sad') {
    return (
      <>
        <path d="M44 73.5l9.5 3.2M66.5 76.7l9.5-3.2" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="51" cy="81" r="2.6" fill={INK} />
        <circle cx="69" cy="81" r="2.6" fill={INK} />
        <path d="M67.5 87.5c1.7 3.3 1.2 6.1-1.2 7.4-2.2-2.2-2-4.8 1.2-7.4Z" fill="#9CCDE8" opacity=".85" />
      </>
    );
  }
  if (mood === 'hungry') {
    return (
      <>
        <path d="M44 72.5l9.5 4M66.5 76.5l9.5-4" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <ellipse cx="51" cy="81" rx="2.6" ry="3" fill={INK} />
        <ellipse cx="69" cy="81" rx="2.6" ry="3" fill={INK} />
      </>
    );
  }
  return (
    <>
      <ellipse cx="50.5" cy="79" rx="3.4" ry="3.9" fill={INK} />
      <ellipse cx="69.5" cy="79" rx="3.4" ry="3.9" fill={INK} />
      <circle cx="51.8" cy="77.7" r="1.15" fill="#fff" opacity=".92" />
      <circle cx="70.8" cy="77.7" r="1.15" fill="#fff" opacity=".92" />
    </>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === 'celebrate') {
    return (
      <>
        <path d="M52.5 90.5c2.7 5.4 12.3 5.4 15 0Z" fill={MOUTH} />
        <path d="M52.5 90.5c2.7 5.4 12.3 5.4 15 0" fill="none" stroke={MOUTH} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M57 94.6c2 2 4.5 2 6.2-.1Z" fill="#F27D93" />
      </>
    );
  }
  if (mood === 'sad') {
    return <path d="M55 96q5-4.2 10 0" stroke={MOUTH} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
  }
  if (mood === 'hungry') {
    return (
      <>
        <ellipse cx="60" cy="93.5" rx="5.2" ry="4.2" fill={MOUTH} opacity=".88" />
        <path d="M52.8 90.6q7.2-2.2 14.4 0" stroke={MOUTH} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </>
    );
  }
  return <path d="M56 89.5q4 4.8 8 0" stroke={MOUTH} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
}

/** 波波的橙嘴（代替通用嘴部） */
function Beak({ mood }: { mood: MascotMood }) {
  const open = mood === 'celebrate' || mood === 'hungry';
  if (open) {
    return (
      <>
        <path d="M53.5 86.5q6.5-3.4 13 0l-6.5 4.6Z" fill="#F5A45C" />
        <path d="M55.5 91.5h9q-4.5 4.2-9 0Z" fill="#E08A3C" />
      </>
    );
  }
  return <path d="M54 86.8q6-3 12 0-6 5.4-12 0Z" fill="#F5A45C" />;
}

/* ---------- 各物种头身 ---------- */

function PeachBody({ skin, tilt = 0 }: { skin: PetSkin; tilt?: number }) {
  return (
    <>
      <g transform={tilt ? `rotate(${tilt} 60 84)` : undefined}>
        <ellipse cx="42.5" cy="30" rx="12" ry="26" fill={skin.ear} transform={`rotate(${-15 + tilt} 42.5 30)`} />
        <ellipse cx="77.5" cy="30" rx="12" ry="26" fill={skin.ear} transform={`rotate(${15 + tilt} 77.5 30)`} />
        <ellipse cx="42.5" cy="32" rx="6.6" ry="17" fill={skin.earInner} transform={`rotate(${-15 + tilt} 42.5 32)`} />
        <ellipse cx="77.5" cy="32" rx="6.6" ry="17" fill={skin.earInner} transform={`rotate(${15 + tilt} 77.5 32)`} />
      </g>
      <path
        d="M60 44c-22.5 0-38.5 18-38.5 40.5C21.5 108 39 122.5 60 122.5S98.5 108 98.5 84.5C98.5 62 82.5 44 60 44Z"
        fill={skin.body}
      />
      <path
        d="M60 44c-14 0-25.5 6.8-32 17.2 7.5-6.4 18.6-10.4 32-10.4s24.5 4 32 10.4C85.5 50.8 74 44 60 44Z"
        fill={skin.bodyLight}
      />
      <path
        d="M60 118.5c-18.6 0-33.9-10-37.5-25.4C25.4 106.3 40.8 116 60 116s34.6-9.7 37.5-22.9C93.9 108.5 78.6 118.5 60 118.5Z"
        fill={skin.bodyShade}
        opacity=".55"
      />
      <path d="M60 44c-1 4-1 8 0 12 1-4 1-8 0-12Z" fill={skin.blush} opacity=".7" />
      <path d="M60 45.5C56 35 47 31.5 39 34c1.6 9.4 10.4 14.6 21 11.5Z" fill={skin.leaf} />
      <path d="M43 36.2c5.6.4 11 3.6 14.6 8.2" stroke={skin.leafVein} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M61 45.5c4-10.4 13-14 21-11.4-1.6 9.3-10.4 14.5-21 11.4Z" fill={skin.leafDeep} />
      <path d="M77 36.2c-5.6.4-11 3.6-14.6 8.2" stroke={skin.leafVein} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  );
}

/** 蓝莓：圆身浆果 + 顶部莓蒂星萼 + 小圆熊耳 */
function BerryBody({ skin }: { skin: PetSkin }) {
  return (
    <>
      <circle cx="37" cy="52" r="11" fill={skin.ear} />
      <circle cx="83" cy="52" r="11" fill={skin.ear} />
      <circle cx="37" cy="52" r="5.4" fill={skin.earInner} />
      <circle cx="83" cy="52" r="5.4" fill={skin.earInner} />
      <path
        d="M60 45c-21 0-35.5 16.5-35.5 38C24.5 105.5 41 120.5 60 120.5S95.5 105.5 95.5 83C95.5 61.5 81 45 60 45Z"
        fill={skin.body}
      />
      <path
        d="M60 45c-13.5 0-24.5 6.4-31 16 7.2-5.8 17.9-9.5 31-9.5s23.8 3.7 31 9.5C84.5 51.4 73.5 45 60 45Z"
        fill={skin.bodyLight}
      />
      <path
        d="M60 116.8c-17.5 0-31.9-9.2-35.5-23.4C27.5 105.7 42 114.8 60 114.8s32.5-9.1 35.5-21.4C91.9 107.6 77.5 116.8 60 116.8Z"
        fill={skin.bodyShade}
        opacity=".55"
      />
      {/* 莓蒂：卷曲小梗 + 五瓣星萼 */}
      <path d="M60 44q-1.5-7 4.5-9.5" stroke={skin.leafVein} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path
        d="M60 45.5l-3.4-4.2 4.4.6-1-5 3.4 3.4 2.4-4.4.6 5 4.6-2.2-2.6 4.4 4.8 1.2-4.8 1.6Z"
        fill={skin.leaf}
        stroke={skin.leafVein}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </>
  );
}

/** 柠檬：柠檬形身体（两端小凸）+ 三角猫耳 + 叶对 */
function LemonBody({ skin }: { skin: PetSkin }) {
  return (
    <>
      <path d="M40 51L29 24l30 15Z" fill={skin.ear} />
      <path d="M41.5 46.5L35.5 30l18 9.5Z" fill={skin.earInner} />
      <path d="M80 51l11-27-30 15Z" fill={skin.ear} />
      <path d="M78.5 46.5l6-16.5-18 9.5Z" fill={skin.earInner} />
      <circle cx="21.5" cy="88" r="7" fill={skin.body} />
      <circle cx="98.5" cy="88" r="7" fill={skin.body} />
      <path
        d="M60 47c-19.5 0-33.5 15.5-33.5 37S43 121 60 121s33.5-15.5 33.5-37S79.5 47 60 47Z"
        fill={skin.body}
      />
      <path
        d="M60 47c-12.5 0-23 5.8-29 14.6 6.8-5.2 16.8-8.6 29-8.6s22.2 3.4 29 8.6C83 52.8 72.5 47 60 47Z"
        fill={skin.bodyLight}
      />
      <path
        d="M60 117c-16.5 0-30.2-8.6-33.6-22C29.6 106.5 43.2 115 60 115s30.4-8.5 33.6-20c-3.4 13.4-17.1 22-33.6 22Z"
        fill={skin.bodyShade}
        opacity=".5"
      />
      <path d="M60 46.5C57 37 49 33.5 42 35.5c1.4 8.4 9 13.2 18 11Z" fill={skin.leaf} />
      <path d="M61.5 46.5c3.4-9.4 11.6-12.8 18.6-10.6-1.6 8.4-8.9 13-18.6 10.6Z" fill={skin.leafDeep} />
    </>
  );
}

/** 波波：小企鹅——蛋形深色身 + 白肚 + 脚蹼 */
function PenguinBody({ skin }: { skin: PetSkin }) {
  return (
    <>
      <path d="M30 76C19 84 16 98 23 107c6-3 11-11 13-19Z" fill={skin.bodyShade} />
      <path d="M90 76c11 8 14 22 7 31-6-3-11-11-13-19Z" fill={skin.bodyShade} />
      <path
        d="M60 42c-21.5 0-34 18-34 41 0 23 15.5 37.5 34 37.5S94 106 94 83c0-23-12.5-41-34-41Z"
        fill={skin.body}
      />
      <ellipse cx="60" cy="93" rx="24.5" ry="25" fill={skin.earInner} />
      <path
        d="M60 42c-13.5 0-23.8 7-29.4 17.8C37.5 53.4 47.8 48.5 60 48.5s22.5 4.9 29.4 11.3C83.8 49 73.5 42 60 42Z"
        fill={skin.bodyLight}
      />
      {/* 头顶呆毛 */}
      <path d="M58 41q1-7 7-9-1.5 6.5-2.5 9.4Z" fill={skin.bodyShade} />
    </>
  );
}

/** 云云：云朵轮廓 + 小圆耳 */
function CloudBody({ skin }: { skin: PetSkin }) {
  return (
    <>
      <circle cx="37" cy="55" r="10.5" fill={skin.ear} />
      <circle cx="83" cy="55" r="10.5" fill={skin.ear} />
      <circle cx="37" cy="55" r="5" fill={skin.earInner} />
      <circle cx="83" cy="55" r="5" fill={skin.earInner} />
      <path
        d="M36 118c-10 0-16.5-6.5-15.5-15 .7-6 5-10.4 10.5-11.4C30 84 34.5 78 41 76.4 40 64 48.5 54 60 53c9.8-.8 18.4 5.3 21.4 13.6 6.8-.8 12.8 4 13.6 10.6.2 1.8 0 3.6-.6 5.2 5 1.8 8 6.8 7.2 12-.9 6.4-6.6 10.6-13.6 10.6Z"
        fill={skin.body}
      />
      <path
        d="M60 53c-9.8-.8-18.4 5.3-21.4 13.6 5.4-4.6 12.9-7.2 21.4-7.2s16 2.6 21.4 7.2C78.4 58.3 69.8 52.2 60 53Z"
        fill={skin.bodyLight}
      />
      <path
        d="M33 114.5c-6.4 0-11.3-3.6-12.4-9.1 2.6 3 6.7 4.9 11.6 4.9Zm62.6-4.4c4.7-.9 8.3-4 9.2-8.2.4 4.4-2.4 8-9.2 8.2Z"
        fill={skin.bodyShade}
        opacity=".6"
      />
    </>
  );
}

function BodyArt({ skin }: { skin: PetSkin }) {
  switch (skin.id) {
    case 'lanmei':
      return <BerryBody skin={skin} />;
    case 'ningmeng':
      return <LemonBody skin={skin} />;
    case 'bobo':
      return <PenguinBody skin={skin} />;
    case 'yunyun':
      return <CloudBody skin={skin} />;
    case 'taoqi':
      return <PeachBody skin={skin} tilt={-4} />;
    default:
      return <PeachBody skin={skin} />;
  }
}

export function Mascot({
  mood = 'normal',
  equipped = {},
  size = 120,
  petId,
  animated = false,
  className,
}: {
  mood?: MascotMood;
  equipped?: Record<string, string>;
  size?: number;
  /** 宠物商城皮肤 id；未传回落当前装备皮肤 */
  petId?: string;
  /** 呼吸感微动画（商店/小桃页用；prefers-reduced-motion 下自动失效） */
  animated?: boolean;
  className?: string;
}) {
  const skin = petSkinFor(petId);
  const headId = equipped.head;
  const neckId = equipped.neck;
  const faceId = equipped.face;
  const isPenguin = skin.id === 'bobo';

  return (
    <svg
      className={`${animated ? 'mascot-bob' : ''} ${className ?? ''}`.trim() || undefined}
      width={size}
      height={(size * 130) / 120}
      viewBox="0 0 120 130"
      role="img"
      aria-label={`${skin.name}：${MOOD_LABEL[mood]}`}
    >
      {neckId === 'cape' && (
        <path
          d="M30 80c-12 16-16 31-12 45 10-4 18-13 24-26l4-13Z"
          fill="#BFE8D9"
          stroke="#8FC9B3"
          strokeWidth="1.6"
        />
      )}
      <BodyArt skin={skin} />
      <Eyes mood={mood} />
      <ellipse cx="39.5" cy="89.5" rx="6" ry="3.6" fill={skin.blush} opacity=".55" />
      <ellipse cx="80.5" cy="89.5" rx="6" ry="3.6" fill={skin.blush} opacity=".55" />
      {isPenguin ? <Beak mood={mood} /> : <Mouth mood={mood} />}
      {/* 淘气的小虎牙（歪耳双胞胎的调皮记号） */}
      {skin.id === 'taoqi' && (mood === 'normal' || mood === 'happy' || mood === 'celebrate') && (
        <path d="M67.6 92.2l3 3.4 1.6-4.4Z" fill="#fff" stroke={MOUTH} strokeWidth="1" strokeLinejoin="round" />
      )}
      {neckId === 'scarf' && (
        <>
          <path d="M38 104c13 7.4 31 7.4 44 0l-2.2 9.4c-12.6 5.2-27 5.2-39.6 0Z" fill="#BFE8D9" stroke="#8FC9B3" strokeWidth="1.5" />
          <path d="M77.5 109.5l8.2 13.8-8.4 2-4.6-12.8Z" fill="#BFE8D9" stroke="#8FC9B3" strokeWidth="1.5" />
        </>
      )}
      {faceId === 'glasses' && (
        <>
          <circle cx="51" cy="80" r="9.4" fill="#fff" opacity=".22" stroke="#5C2E3E" strokeWidth="2" />
          <circle cx="69" cy="80" r="9.4" fill="#fff" opacity=".22" stroke="#5C2E3E" strokeWidth="2" />
          <path d="M60 80h0M41.4 78l-6.4-2.2M78.6 78l6.4-2.2" stroke="#5C2E3E" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {headId === 'bow' && (
        <g transform="translate(83 25) rotate(12)">
          <path d="M0 0c-6.4-7.4-17-5.2-17 3.2S-10 12.6 0 5.4Z" fill="#E4698F" />
          <path d="M0 0c6.4-7.4 17-5.2 17 3.2S10 12.6 0 5.4Z" fill="#E4698F" />
          <circle cx="0" cy="3" r="3.6" fill="#C1355E" />
        </g>
      )}
      {headId === 'crown' && (
        <g>
          <path d="M40 19l5-10.4 9 6.2 6-12.4 6 12.4 9-6.2 5 10.4Z" fill="#FFE8A3" stroke="#D8B35A" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="60" cy="9" r="2.1" fill="#C1355E" />
          <circle cx="44.5" cy="15" r="1.7" fill="#C1355E" />
          <circle cx="75.5" cy="15" r="1.7" fill="#C1355E" />
        </g>
      )}
      {mood === 'celebrate' && (
        <>
          <path d="M23.5 55l1.6 4.2 4.2 1.6-4.2 1.6-1.6 4.2-1.6-4.2-4.2-1.6 4.2-1.6Z" fill="#E4698F" />
          <path d="M94.5 45l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3Z" fill="#FFE8A3" />
          <path d="M99 74l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9Z" fill="#A5D8BE" />
        </>
      )}
    </svg>
  );
}
