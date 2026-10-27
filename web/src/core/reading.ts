// 朗读文本处理（纯函数）：多音字注音替换 + 朗读单元切分。
//
// TTS 引擎对多音字按「最常见读音」朗读，课文语境里常读错（长大/淹没/
// 种子……）。注音替换法：把词替换成同音异形字，让引擎读出正确读音——
// 只做词级替换且逐条人工核对同音，宁缺毋滥。
//
// 感情（docs/06 克制原则）：按句切分逐句朗读，句间自然停顿由调用方
// 实现；标点保留，问句由调用方按句尾符号微调语调。

/** 词级多音字注音替换表：键=课文词，值=同音替换（TTS 读出正确读音）。 */
export const POLYPHONE_FIXES: Record<string, string> = {
  长大: '涨大',
  长出: '涨出',
  长高: '涨高',
  生长: '生涨',
  淹没: '淹末',
  沉没: '沉末',
  出没: '出末',
  种子: '肿子',
  种树: '众树',
  种地: '众地',
  打仗: '打账',
  教书: '交书',
  弯曲: '弯屈',
  首都: '首督',
};

/** 朗读用文本：按词长优先应用注音替换（不改动标点与空白）。 */
export function forSpeech(text: string): string {
  let output = text;
  const entries = Object.entries(POLYPHONE_FIXES).sort((a, b) => b[0].length - a[0].length);
  for (const [word, fix] of entries) {
    output = output.split(word).join(fix);
  }
  return output;
}

/** 按句切分朗读单元：保留句尾标点，供逐句朗读与句间停顿；纯标点单元丢弃。 */
export function splitReadingUnits(text: string): string[] {
  const units: string[] = [];
  let current = '';
  for (const char of text) {
    current += char;
    if ('。！？；'.includes(char)) {
      pushIfSpeakable(units, current);
      current = '';
    }
  }
  pushIfSpeakable(units, current);
  return units;
}

function pushIfSpeakable(units: string[], raw: string): void {
  const trimmed = raw.trim();
  if (!trimmed) return;
  // 只含标点/符号/空白的单元没有可读内容（如句末连续句号），丢弃。
  const speakable = trimmed.replace(/[\p{P}\p{S}\s]/gu, '');
  if (speakable) units.push(trimmed);
}
