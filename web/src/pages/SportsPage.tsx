import { useState } from 'react';
import { useApp } from '../app/AppProvider';
import { Mascot } from '../components/Mascot';
import { Icon } from '../components/Icon';
import { ProgressBar } from '../components/ui';
import {
  SPORTS_FALLBACK_COLORS,
  SPORTS_MAX_CUSTOM_ITEMS,
  type SportsItem,
} from '../data/sports';
import {
  sportsCheckinDelta,
  sportsDayStatus,
  sportsItemsFor,
} from '../core/sports';
import { todayKey } from '../core/date';

/**
 * 运动打卡页（docs/06 §3.11）：每日运动记录 + 奖励到账。
 * 样式采用组件内 <style>：全局样式表当前由商城迭代并行占用，上线后迁移。
 */
const SPORTS_PAGE_CSS = `
.sports-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:14px;}
.sports-card{display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:20px;position:relative;overflow:hidden;}
.sports-card::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:var(--xc,var(--brand));}
.sports-card.is-met{background:#f2faf4;}
.sports-card.is-met::before{background:#4f9e5f;}
.sports-top{display:flex;align-items:center;gap:8px;}
.sports-chip{display:inline-flex;align-items:center;font-size:13.5px;font-weight:500;padding:4px 13px;border-radius:999px;}
.sports-met{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:#2e7d43;background:#e5f4e8;border-radius:999px;padding:3px 10px;}
.sports-goal{font-size:11.5px;color:var(--sub);}
.sports-progress{height:6px;}
.sports-progress i{background:var(--xc,var(--brand));}
.sports-stepper{display:flex;align-items:center;gap:10px;}
.sports-stepper button{width:42px;height:42px;flex:none;border-radius:14px;border:1.5px solid var(--line);background:var(--surface);font-size:20px;line-height:1;cursor:pointer;color:inherit;transition:transform .12s ease;}
.sports-stepper button:active{transform:scale(.93);}
.sports-stepper input{flex:1;min-width:0;text-align:center;font-size:18px;font-weight:500;border:1.5px solid var(--line);border-radius:14px;padding:9px 4px;background:var(--surface);color:inherit;}
.sports-check{border:0;border-radius:14px;padding:10px 0;font:inherit;font-size:13.5px;background:var(--brand);color:#fff;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,142,.28);}
.sports-check:disabled{background:#f0dbe1;box-shadow:none;cursor:default;}
.sports-remove{align-self:flex-end;border:0;background:transparent;color:var(--sub);font-size:11.5px;cursor:pointer;padding:0;}
.sports-hint{font-size:11.5px;color:var(--sub);}
.sports-summary-card{display:flex;flex-wrap:wrap;align-items:center;gap:14px;}
.sports-summary{display:flex;flex:1;flex-wrap:wrap;gap:14px 30px;min-width:0;}
.sports-stat{display:flex;align-items:center;gap:10px;}
.sports-stat-icon{width:36px;height:36px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex:none;}
.sports-stat-copy{display:flex;flex-direction:column;gap:1px;}
.sports-stat-copy span{font-size:11.5px;color:var(--sub);}
.sports-stat-copy b{font-size:15.5px;font-weight:500;}
.sports-streak-chip{margin-left:auto;font-size:12px;background:var(--brand-soft);color:#c2496f;border-radius:999px;padding:6px 15px;white-space:nowrap;}
.sports-add-card{border:1.5px dashed var(--line);background:transparent;box-shadow:none;display:flex;justify-content:center;padding:14px;}
.sports-addrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;width:100%;}
.sports-addrow input{border:1.5px solid var(--line);border-radius:12px;padding:8px 10px;font:inherit;font-size:13px;background:var(--surface);color:inherit;}
@media (max-width:520px){.sports-grid{grid-template-columns:1fr;}.sports-streak-chip{margin-left:0;}}
`;

/** 自定义项目按其在目录中的序号取兜底色 */
function colorFor(item: SportsItem, customIndex: number): string {
  return item.color ?? SPORTS_FALLBACK_COLORS[customIndex % SPORTS_FALLBACK_COLORS.length];
}

export function SportsPage() {
  const { state, dispatchLocal, notify } = useApp();
  const today = todayKey();
  const items = sportsItemsFor(state.sports);
  const dayEntries = state.sports.logs[today] ?? {};
  const status = sportsDayStatus(state.sports, today, items);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('次');
  const [newGoal, setNewGoal] = useState('');

  const customIndexOf = (item: SportsItem): number =>
    state.sports.customItems.findIndex(custom => custom.id === item.id);

  const valueOf = (item: SportsItem): number => {
    const draft = drafts[item.id];
    if (draft !== undefined) return draft;
    return dayEntries[item.id] ?? 0;
  };

  const bump = (item: SportsItem, direction: 1 | -1) => {
    setDrafts(current => ({
      ...current,
      [item.id]: Math.max(0, valueOf(item) + direction * item.step),
    }));
  };

  const checkin = (item: SportsItem) => {
    const value = valueOf(item);
    // 先用纯函数算好本次到账，通知与真实结算一致（含每日星上限、7 天大餐）
    const delta = sportsCheckinDelta(state.sports, today, item, value);
    dispatchLocal({ type: 'sports-checkin', date: today, itemId: item.id, value });
    if (!delta) return;
    const parts: string[] = [];
    if (delta.foodGain > 0) parts.push('+1 桃粮');
    if (delta.starGain > 0) parts.push('+1 颗星');
    if (delta.mealGain > 0) parts.push('+1 大餐');
    if (parts.length === 0) {
      notify('已记录，继续加油。');
    } else if (delta.justMet) {
      notify(`${item.name}达标！${parts.join('、')}`);
    } else {
      notify(`打卡成功：${parts.join('、')}`);
    }
  };

  const submitCustom = () => {
    const name = newName.trim();
    const unit = newUnit.trim();
    const goal = Math.round(Number(newGoal));
    if (!name || !unit || !Number.isFinite(goal) || goal <= 0) {
      notify('项目名、单位和达标线都要填一填。');
      return;
    }
    dispatchLocal({
      type: 'sports-custom-add',
      item: { id: `custom-${Date.now().toString(36)}`, name, unit, goal, step: 1 },
    });
    setNewName('');
    setNewGoal('');
    setAdding(false);
    notify(`「${name}」加好了，打卡吧。`);
  };

  const removeCustom = (item: SportsItem) => {
    if (!window.confirm(`删除「${item.name}」？它的历史打卡记录也会一并删除。`)) return;
    dispatchLocal({ type: 'sports-custom-remove', id: item.id });
  };

  return (
    <div className="page sports-page">
      <style>{SPORTS_PAGE_CSS}</style>
      <header className="page-head">
        <div>
          <p className="eyebrow">运动 · 每日打卡</p>
          <h1>动一动，小桃更开心。</h1>
          <p className="page-lede">
            每天第一次打卡送 1 份桃粮，达到目标线每项送 1 颗星（一天最多 3 颗），连续 7 天还有大餐。
          </p>
        </div>
        <Mascot mood={status.metCount > 0 ? 'celebrate' : 'happy'} size={96} />
      </header>

      <section className="card sports-summary-card">
        <div className="sports-summary">
          <div className="sports-stat">
            <span className="sports-stat-icon" style={{ background: 'var(--brand-soft)', color: '#c2496f' }}>
              <Icon name="heart" size={17} />
            </span>
            <span className="sports-stat-copy">
              <span>连续打卡</span>
              <b>{state.sports.streak} 天</b>
            </span>
          </div>
          <div className="sports-stat">
            <span className="sports-stat-icon" style={{ background: '#fff3e0', color: '#c98136' }}>
              <Icon name="food" size={17} />
            </span>
            <span className="sports-stat-copy">
              <span>今日已得</span>
              <b>
                +{status.foodEarned} 桃粮 · +{status.starEarned} 星
              </b>
            </span>
          </div>
          <div className="sports-stat">
            <span className="sports-stat-icon" style={{ background: '#e5f4e8', color: '#2e7d43' }}>
              <Icon name="check" size={17} />
            </span>
            <span className="sports-stat-copy">
              <span>今日达标</span>
              <b>
                {status.metCount} / {items.length} 项
              </b>
            </span>
          </div>
        </div>
        <span className="sports-streak-chip">最长连续 {state.sports.bestStreak} 天</span>
      </section>

      <div className="sports-grid">
        {items.map(item => {
          const logged = dayEntries[item.id];
          const value = valueOf(item);
          const met = value >= item.goal;
          const color = colorFor(item, Math.max(0, customIndexOf(item)));
          return (
            <section
              key={item.id}
              className={`sports-card card ${met ? 'is-met' : ''}`}
              style={{ '--xc': color } as React.CSSProperties}
            >
              <div className="sports-top">
                <span className="sports-chip" style={{ background: `${color}16`, color }}>
                  {item.name}
                </span>
                {logged !== undefined && met ? (
                  <span className="sports-met">
                    <Icon name="check" size={12} /> 已达标
                  </span>
                ) : null}
              </div>
              <span className="sports-goal">
                目标 {item.goal} {item.unit}
                {logged !== undefined ? ` · 已记录 ${logged} ${item.unit}` : ''}
              </span>
              <ProgressBar value={Math.min(100, (value / item.goal) * 100)} className="sports-progress" />
              <div className="sports-stepper">
                <button type="button" aria-label={`减少${item.name}`} onClick={() => bump(item, -1)}>
                  −
                </button>
                <input
                  value={value}
                  inputMode="numeric"
                  aria-label={`${item.name}数值`}
                  onChange={event => {
                    const next = Math.max(0, Math.min(100000, Math.round(Number(event.target.value) || 0)));
                    setDrafts(current => ({ ...current, [item.id]: next }));
                  }}
                />
                <button type="button" aria-label={`增加${item.name}`} onClick={() => bump(item, 1)}>
                  +
                </button>
              </div>
              <button
                className="sports-check"
                type="button"
                disabled={value <= 0}
                title={value <= 0 ? '先加一点数值，再打卡' : undefined}
                onClick={() => checkin(item)}
              >
                {logged !== undefined ? '更新记录' : '打卡'}
              </button>
              {value <= 0 ? <span className="sports-hint">先用「＋」记下今天的量，再打卡领奖励。</span> : null}
              {item.builtin ? null : (
                <button className="sports-remove" type="button" onClick={() => removeCustom(item)}>
                  删除这个项目
                </button>
              )}
            </section>
          );
        })}
      </div>

      {state.sports.customItems.length < SPORTS_MAX_CUSTOM_ITEMS ? (
        <section className="card sports-add-card">
          {adding ? (
            <div className="sports-addrow">
              <input
                value={newName}
                maxLength={12}
                placeholder="项目名（如：游泳）"
                aria-label="自定义项目名"
                onChange={event => setNewName(event.target.value)}
              />
              <input
                value={newUnit}
                maxLength={6}
                placeholder="单位"
                aria-label="自定义项目单位"
                onChange={event => setNewUnit(event.target.value)}
              />
              <input
                value={newGoal}
                inputMode="numeric"
                placeholder="达标线"
                aria-label="自定义项目达标线"
                onChange={event => setNewGoal(event.target.value)}
              />
              <button
                className="sports-check"
                type="button"
                style={{ padding: '9px 20px', width: 'auto' }}
                onClick={submitCustom}
              >
                添加
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setAdding(false)}>
                取消
              </button>
            </div>
          ) : (
            <button className="btn btn-soft" type="button" onClick={() => setAdding(true)}>
              <Icon name="plus" size={15} /> 加一个自己的项目
            </button>
          )}
        </section>
      ) : null}
    </div>
  );
}
