// 宠物商城目录（用户需求 2026-10-25：每日学习攒星星 → 兑换喜欢的宠物伙伴）
//
// 一期采用「同一 SVG 骨架 + 调色板皮肤」的实现：每个伙伴是独立的角色
// （名字/价格/配色/耳朵形态），共享成熟的小桃绘制管线，避免 N 个角色 N 套
// 手绘路径的质量风险。价格以「星星」计价——完成任务每天可得，只增不扣
// （喂食用桃粮，两套货币口径不混）。

export interface PetSkin {
  id: string;
  name: string;
  /** 兑换价格（星星）；0 = 初始伙伴 */
  price: number;
  tagline: string;
  /** 主体三段色：亮部 / 主色 / 暗部（落影） */
  bodyLight: string;
  body: string;
  bodyShade: string;
  /** 兔耳外/内色 */
  ear: string;
  earInner: string;
  /** 叶子两色 + 叶脉 */
  leaf: string;
  leafDeep: string;
  leafVein: string;
  /** 腮红 */
  blush: string;
  /** 耳朵形态：兔耳 / 圆耳（仓鼠系）/ 无耳（果实系） */
  earStyle: 'rabbit' | 'round' | 'none';
}

export const PET_SKINS: PetSkin[] = [
  {
    id: 'xiaotao',
    name: '小桃',
    price: 0,
    tagline: '陪你从头开始的小伙伴',
    bodyLight: '#FCE4EC',
    body: '#F9D7E1',
    bodyShade: '#F3BFCE',
    ear: '#F6B7C8',
    earInner: '#FDE0E9',
    leaf: '#8FCBAF',
    leafDeep: '#A5D8BE',
    leafVein: '#6FAE8F',
    blush: '#F0A3BA',
    earStyle: 'rabbit',
  },
  {
    id: 'lanmei',
    name: '蓝莓',
    price: 15,
    tagline: '安安静静陪你看书',
    bodyLight: '#E3F1FE',
    body: '#B7D6F7',
    bodyShade: '#9CC2EC',
    ear: '#A9CBEF',
    earInner: '#E8F3FD',
    leaf: '#8FCBAF',
    leafDeep: '#A5D8BE',
    leafVein: '#6FAE8F',
    blush: '#9FC1E8',
    earStyle: 'round',
  },
  {
    id: 'ningmeng',
    name: '柠檬',
    price: 30,
    tagline: '酸酸甜甜，活力满满',
    bodyLight: '#FFF3C4',
    body: '#FFE38A',
    bodyShade: '#F2CF6B',
    ear: '#E8B93E',
    earInner: '#FFD98A',
    leaf: '#7FC29A',
    leafDeep: '#95CFA9',
    leafVein: '#5FA67E',
    blush: '#F5C96B',
    earStyle: 'none',
  },
  {
    id: 'bobo',
    name: '波波',
    price: 50,
    tagline: '来自池塘的游泳健将',
    bodyLight: '#6FAEC4',
    body: '#4A8FA8',
    bodyShade: '#3A7A92',
    ear: '#6FAEC4',
    earInner: '#FDFDFE',
    leaf: '#8FCBAF',
    leafDeep: '#A5D8BE',
    leafVein: '#6FAE8F',
    blush: '#A8D4E2',
    earStyle: 'round',
  },
  {
    id: 'taoqi',
    name: '淘气',
    price: 80,
    tagline: '小桃的调皮双胞胎',
    bodyLight: '#FDE4DE',
    body: '#F8C9C0',
    bodyShade: '#EFA89C',
    ear: '#F4B4A9',
    earInner: '#FDE9E4',
    leaf: '#C9A27E',
    leafDeep: '#D8B694',
    leafVein: '#A98258',
    blush: '#EFA08F',
    earStyle: 'rabbit',
  },
  {
    id: 'yunyun',
    name: '云云',
    price: 120,
    tagline: '轻轻软软的白云伙伴',
    bodyLight: '#FFFFFF',
    body: '#F3F1F6',
    bodyShade: '#DEDAE6',
    ear: '#E8E4EF',
    earInner: '#FBFAFD',
    leaf: '#B9C6DE',
    leafDeep: '#C9D4E8',
    leafVein: '#93A6C4',
    blush: '#D9D2E6',
    earStyle: 'round',
  },
];

export const PET_BY_ID: Record<string, PetSkin> = Object.fromEntries(
  PET_SKINS.map(skin => [skin.id, skin]),
);

export const DEFAULT_PET_ID = 'xiaotao';

export function petSkinFor(id: string | undefined): PetSkin {
  return (id && PET_BY_ID[id]) || PET_BY_ID[DEFAULT_PET_ID];
}
