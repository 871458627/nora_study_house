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
    bodyLight: '#DCEBFB',
    body: '#BCD9F5',
    bodyShade: '#A3C4EA',
    ear: '#A9CBEF',
    earInner: '#E3F0FC',
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
    bodyLight: '#FFF6D9',
    body: '#FFE9A8',
    bodyShade: '#F5D679',
    ear: '#F8DF85',
    earInner: '#FFF4CE',
    leaf: '#7FC29A',
    leafDeep: '#95CFA9',
    leafVein: '#5FA67E',
    blush: '#F5C96B',
    earStyle: 'none',
  },
  {
    id: 'bobei',
    name: '波波',
    price: 50,
    tagline: '来自池塘的游泳高手',
    bodyLight: '#DDF3F0',
    body: '#B8E4DE',
    bodyShade: '#96CFC7',
    ear: '#A4D8D0',
    earInner: '#E4F7F4',
    leaf: '#8FCBAF',
    leafDeep: '#A5D8BE',
    leafVein: '#6FAE8F',
    blush: '#8FC7BE',
    earStyle: 'round',
  },
  {
    id: 'taoqi',
    name: '淘气',
    price: 80,
    tagline: '小桃的调皮双胞胎',
    bodyLight: '#FBE3E0',
    body: '#F7C6BF',
    bodyShade: '#EDA89E',
    ear: '#F3B3AA',
    earInner: '#FDE6E2',
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
    tagline: '软乎乎，做梦都在飘',
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
