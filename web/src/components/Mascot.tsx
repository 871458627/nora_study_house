import { petSkinFor, type PetSkin } from '../data/pets';

export type MascotMood = 'happy' | 'normal' | 'hungry' | 'sad' | 'celebrate';

const MOOD_LABEL: Record<MascotMood, string> = {
  happy: '小伙伴开心地眯着眼睛',
  normal: '小伙伴安静地看着你',
  hungry: '小伙伴肚子饿了',
  sad: '小伙伴有点失落',
  celebrate: '小伙伴在为你庆祝',
};

/* 小伙伴绘制（v3 重绘 + 宠物商城皮肤扩展）：
   - 同一套 SVG 骨架渲染全部角色（宠物商城目录 src/data/pets.ts），
     皮肤只换调色板与耳朵形态，保证 N 个角色的绘制质量一致
   - 五种 mood 的五官坐标在各皮肤下通用；配饰槽位全兼容
   - viewBox 120×130 与全站调用比例不变 */

const INK = '#5C3A44';
const MOUTH = '#9E4B5E';

function Ears({ skin }: { skin: PetSkin }) {
  if (skin.earStyle === 'none') {
    // 果实系：顶部小凸起代替耳朵
    return <path d="M60 40c-3 2.5-3 6 0 8.5 3-2.5 3-6 0-8.5Z" fill={skin.ear} />;
  }
  if (skin.earStyle === 'round') {
    // 圆耳系（仓鼠感）
    return (
      <>
        <circle cx="36" cy="52" r="11.5" fill={skin.ear} />
        <circle cx="84" cy="52" r="11.5" fill={skin.ear} />
        <circle cx="36" cy="52" r="6" fill={skin.earInner} />
        <circle cx="84" cy="52" r="6" fill={skin.earInner} />
      </>
    );
  }
  // 兔耳
  return (
    <>
      <ellipse cx="42.5" cy="30" rx="12" ry="26" fill={skin.ear} transform="rotate(-15 42.5 30)" />
      <ellipse cx="77.5" cy="30" rx="12" ry="26" fill={skin.ear} transform="rotate(15 77.5 30)" />
      <ellipse cx="42.5" cy="32" rx="6.6" ry="17" fill={skin.earInner} transform="rotate(-15 42.5 32)" />
      <ellipse cx="77.5" cy="32" rx="6.6" ry="17" fill={skin.earInner} transform="rotate(15 77.5 32)" />
    </>
  );
}

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

export function Mascot({
  mood = 'normal',
  equipped = {},
  size = 120,
  petId,
  className,
}: {
  mood?: MascotMood;
  equipped?: Record<string, string>;
  size?: number;
  /** 宠物商城皮肤 id；未传回落当前装备皮肤 */
  petId?: string;
  className?: string;
}) {
  const skin = petSkinFor(petId);
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
      <Ears skin={skin} />
      {/* 桃形头身：主体 + 顶部提亮 + 底部落影 */}
      <path
        d="M60 44c-22.5 0-38.5 18-38.5 40.5C21.5 108 39 122.5 60 122.5S98.5 108 98.5 84.5C98.5 62 82.5 44 60 44Z"
        fill={mood === 'sad' ? skin.bodyShade : skin.body}
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
      {/* 顶叶：两片 + 叶脉（果实系挂在顶部凸起上） */}
      <path d="M60 44c-1 4-1 8 0 12 1-4 1-8 0-12Z" fill={skin.blush} opacity=".7" />
      <path d="M60 45.5C56 35 47 31.5 39 34c1.6 9.4 10.4 14.6 21 11.5Z" fill={skin.leaf} />
      <path d="M43 36.2c5.6.4 11 3.6 14.6 8.2" stroke={skin.leafVein} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M61 45.5c4-10.4 13-14 21-11.4-1.6 9.3-10.4 14.5-21 11.4Z" fill={skin.leafDeep} />
      <path d="M77 36.2c-5.6.4-11 3.6-14.6 8.2" stroke={skin.leafVein} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Eyes mood={mood} />
      <ellipse cx="39.5" cy="89.5" rx="6" ry="3.6" fill={skin.blush} opacity=".55" />
      <ellipse cx="80.5" cy="89.5" rx="6" ry="3.6" fill={skin.blush} opacity=".55" />
      <Mouth mood={mood} />
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
