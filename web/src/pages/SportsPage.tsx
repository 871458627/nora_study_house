import { useState } from 'react';
import { useApp } from '../app/AppProvider';
import { Mascot } from '../components/Mascot';
import { Icon } from '../components/Icon';
import { ProgressBar, ProgressRing } from '../components/ui';
import { SPORTS_MAX_CUSTOM_ITEMS, type SportsItem } from '../data/sports';
import {
  sportsCheckinDelta,
  sportsDayStatus,
  sportsItemsFor,
} from '../core/sports';
import {
  addDays,
  daysInMonthOf,
  firstDayOfMonth,
  formatMonthDayWeek,
  monthLabel,
  todayKey,
  weekdayIndex,
} from '../core/date';

/**
 * 运动打卡页（docs/06 §3.11）：每日运动记录 + 奖励到账。
 * 交互参照同类打卡产品：月历（可翻月回看往期）+ 圆环今日汇总 + 图标信息行。
 * 打卡只发生在今天；选中往期日期时，项目列表切换为该日只读明细。
 * 配色收敛于应用主色（accent），达标态唯一功能色为绿。
 * 样式采用组件内 <style>：全局样式表由商城迭代并行占用，上线后迁移。
 */
const SPORTS_PAGE_CSS = `
.sports-hero-card{padding:14px 18px;}
.sports-hero{display:flex;align-items:center;gap:18px;flex-wrap:wrap;}
.sports-hero-copy{flex:1;min-width:200px;display:flex;flex-direction:column;gap:5px;}
.sports-hero-copy h2{font-size:17px;font-weight:500;margin:0;}
.sports-hero-copy .sports-reward{font-size:13px;color:var(--sub);}
.sports-hero-copy .sports-reward b{color:var(--accent);font-weight:500;}
.sports-cal-card{padding:14px 18px;}
.sports-cal-head{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.sports-cal-head b{font-size:14px;font-weight:500;}
.sports-cal-nav{width:30px;height:30px;border-radius:10px;border:1.5px solid var(--line);background:var(--surface);cursor:pointer;color:inherit;font-size:14px;display:flex;align-items:center;justify-content:center;}
.sports-cal-nav:disabled{opacity:.35;cursor:default;}
.sports-cal-back{margin-left:auto;border:0;background:transparent;color:var(--accent);font:inherit;font-size:12.5px;cursor:pointer;padding:0;}
.sports-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.sports-cal-week{text-align:center;font-size:11px;color:var(--sub);padding:2px 0;}
.sports-cal-cell{height:38px;border-radius:11px;border:0;background:transparent;color:inherit;font:inherit;font-size:12.5px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;}
.sports-cal-cell:disabled{opacity:.3;cursor:default;}
.sports-cal-cell.on{background:var(--brand-soft,var(--accent-soft));color:var(--accent);font-weight:500;}
.sports-cal-cell.on .sports-cal-mark{color:var(--accent);}
.sports-cal-cell.selected{background:var(--accent);color:#fff;font-weight:500;}
.sports-cal-cell.selected .sports-cal-mark{color:#fff;}
.sports-cal-cell.today:not(.selected){box-shadow:inset 0 0 0 1.5px var(--accent);}
.sports-cal-mark{height:5px;display:flex;align-items:center;}
.sports-cal-empty{width:100%;height:38px;}
.sports-detail{display:flex;flex-direction:column;gap:10px;margin-top:10px;padding:14px 18px;}
.sports-detail-title{font-size:14.5px;font-weight:500;}
.sports-detail-row{display:flex;align-items:center;gap:9px;font-size:13px;padding:7px 0;border-bottom:1px solid var(--line-soft);}
.sports-detail-row:last-child{border-bottom:0;}
.sports-detail-row b{font-weight:500;}
.sports-detail-row .sports-detail-val{margin-left:auto;color:var(--sub);}
.sports-detail-empty{font-size:12.5px;color:var(--sub);}
.sports-list{display:flex;flex-direction:column;gap:10px;}
.sports-row{display:flex;align-items:center;gap:14px;padding:12px 16px;}
.sports-row.is-met{background:var(--mint-soft);}
.sports-icon{width:44px;height:44px;flex:none;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:500;background:var(--accent-soft);color:var(--accent);}
.sports-row.is-met .sports-icon{background:var(--mint-soft);color:var(--mint);}
.sports-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
.sports-name-line{display:flex;align-items:baseline;gap:8px;}
.sports-name-line b{font-size:14.5px;font-weight:500;}
.sports-goal{font-size:11.5px;color:var(--sub);}
.sports-progress{height:5px;}
.sports-row-actions{display:flex;align-items:center;gap:9px;flex:none;}
.sports-stepper{display:flex;align-items:center;gap:6px;}
.sports-stepper button{width:38px;height:38px;flex:none;border-radius:12px;border:1.5px solid var(--line);background:var(--surface);font-size:18px;line-height:1;cursor:pointer;color:inherit;transition:transform .12s ease;}
.sports-stepper button:active{transform:scale(.93);}
.sports-stepper input{width:70px;text-align:center;font-size:16.5px;font-weight:500;border:1.5px solid var(--line);border-radius:12px;padding:8px 2px;background:var(--surface);color:inherit;}
.sports-check{width:88px;flex:none;border:0;border-radius:999px;padding:9px 0;font:inherit;font-size:13px;background:var(--accent);color:#fff;cursor:pointer;}
.sports-check:disabled{background:var(--line-soft);color:var(--sub);cursor:default;}
.sports-check.is-met{background:var(--mint);}
.sports-remove{border:0;background:transparent;color:var(--sub);font-size:11.5px;cursor:pointer;padding:0;flex:none;}
.sports-add-card{border:1.5px dashed var(--line);background:transparent;box-shadow:none;display:flex;justify-content:center;padding:13px;}
.sports-addrow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;width:100%;}
.sports-addrow input{border:1.5px solid var(--line);border-radius:12px;padding:8px 10px;font:inherit;font-size:13px;background:var(--surface);color:inherit;}
@media (max-width:640px){
  .sports-row{flex-wrap:wrap;}
  .sports-row-actions{width:100%;justify-content:space-between;}
}
`;

export function SportsPage() {
  const { state, dispatchLocal, notify } = useApp();
  const today = todayKey();
  const items = sportsItemsFor(state.sports);
  const dayEntries = state.sports.logs[today] ?? {};
  const status = sportsDayStatus(state.sports, today, items);
  const [selected, setSelected] = useState(today);
  const [anchor, setAnchor] = useState(() => firstDayOfMonth(todayKey()));
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('次');
  const [newGoal, setNewGoal] = useState('');

  const viewingHistory = selected !== today;
  const currentMonthFirst = firstDayOfMonth(today);
  const canGoNext = anchor < currentMonthFirst;
  const leading = weekdayIndex(anchor);
  const monthDays = Array.from({ length: daysInMonthOf(anchor) }, (_, index) => addDays(anchor, index));

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

  const historyEntries = state.sports.logs[selected] ?? {};
  const historyRows = items
    .filter(item => historyEntries[item.id] !== undefined)
    .map(item => ({
      item,
      value: historyEntries[item.id],
      met: historyEntries[item.id] >= item.goal,
    }));

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

      <section className="card sports-hero-card">
        <div className="sports-hero">
          <ProgressRing value={status.metCount} total={items.length} />
          <div className="sports-hero-copy">
            <h2>今天动了 {status.checkedCount} 项</h2>
            <span className="sports-reward">
              连续 <b>{state.sports.streak}</b> 天 · 今日 <b>+{status.foodEarned}</b> 桃粮{' '}
              <b>+{status.starEarned}</b> 星
            </span>
          </div>
        </div>
      </section>

      <section className="card sports-cal-card">
        <div className="sports-cal-head">
          <button
            type="button"
            className="sports-cal-nav"
            aria-label="上一个"
            onClick={() => setAnchor(firstDayOfMonth(addDays(anchor, -1)))}
          >
            ‹
          </button>
          <b>{monthLabel(anchor)}</b>
          <button
            type="button"
            className="sports-cal-nav"
            aria-label="下一个"
            disabled={!canGoNext}
            onClick={() => setAnchor(firstDayOfMonth(addDays(anchor, daysInMonthOf(anchor))))}
          >
            ›
          </button>
          {viewingHistory ? (
            <button type="button" className="sports-cal-back" onClick={() => setSelected(today)}>
              回到今天
            </button>
          ) : null}
        </div>
        <div className="sports-cal-grid" role="grid" aria-label={`${monthLabel(anchor)}运动打卡日历`}>
          {['一', '二', '三', '四', '五', '六', '日'].map(day => (
            <span key={day} className="sports-cal-week">
              {day}
            </span>
          ))}
          {Array.from({ length: leading }, (_, index) => (
            <span key={`blank-${index}`} className="sports-cal-empty" />
          ))}
          {monthDays.map(day => {
            const checked = Object.keys(state.sports.logs[day] ?? {}).length > 0;
            const isToday = day === today;
            const isSelected = day === selected;
            const future = day > today;
            return (
              <button
                key={day}
                type="button"
                className={`sports-cal-cell ${checked ? 'on' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                disabled={future}
                aria-label={`${formatMonthDayWeek(day)}${checked ? '，已打卡' : ''}`}
                aria-pressed={isSelected}
                onClick={() => setSelected(day)}
              >
                {day.slice(8)}
                <span className="sports-cal-mark">{checked ? <Icon name="check" size={11} /> : null}</span>
              </button>
            );
          })}
        </div>
      </section>

      {viewingHistory ? (
        <section className="card sports-detail">
          <div className="sports-detail-title">{formatMonthDayWeek(selected)} 的运动</div>
          {historyRows.length > 0 ? (
            historyRows.map(({ item, value, met }) => (
              <div key={item.id} className="sports-detail-row">
                {met ? <Icon name="check" size={14} /> : null}
                <b>{item.name}</b>
                <span className="sports-detail-val">
                  {value} {item.unit}
                  {met ? ' · 已达标' : ''}
                </span>
              </div>
            ))
          ) : (
            <p className="sports-detail-empty">这天没有运动记录。</p>
          )}
          <p className="sports-detail-empty">只有今天可以打卡，往期记录仅供参考。</p>
        </section>
      ) : (
        <>
          <div className="sports-list">
            {items.map(item => {
              const logged = dayEntries[item.id];
              const value = valueOf(item);
              const rowMet = logged !== undefined && logged >= item.goal;
              return (
                <section key={item.id} className={`card sports-row ${rowMet ? 'is-met' : ''}`}>
                  <span className="sports-icon">
                    {rowMet ? <Icon name="check" size={18} /> : item.name.slice(0, 1)}
                  </span>
                  <div className="sports-row-main">
                    <div className="sports-name-line">
                      <b>{item.name}</b>
                      <span className="sports-goal">
                        目标 {item.goal} {item.unit}
                        {logged !== undefined ? ` · 已记录 ${logged}` : ''}
                      </span>
                    </div>
                    <ProgressBar value={Math.min(100, (value / item.goal) * 100)} className="sports-progress" />
                  </div>
                  <div className="sports-row-actions">
                    <div className="sports-stepper">
                      <button type="button" aria-label={`减少${item.name}`} onClick={() => bump(item, -1)}>
                        −
                      </button>
                      <input
                        value={value}
                        inputMode="numeric"
                        aria-label={`${item.name}数值`}
                        onChange={event => {
                          const next = Math.max(
                            0,
                            Math.min(100000, Math.round(Number(event.target.value) || 0)),
                          );
                          setDrafts(current => ({ ...current, [item.id]: next }));
                        }}
                      />
                      <button type="button" aria-label={`增加${item.name}`} onClick={() => bump(item, 1)}>
                        +
                      </button>
                    </div>
                    <button
                      className={`sports-check ${rowMet ? 'is-met' : ''}`}
                      type="button"
                      disabled={value <= 0}
                      title={value <= 0 ? '先加一点数值，再打卡' : undefined}
                      onClick={() => checkin(item)}
                    >
                      {rowMet ? '已达标' : logged !== undefined ? '更新记录' : '打卡'}
                    </button>
                    {item.builtin ? null : (
                      <button className="sports-remove" type="button" onClick={() => removeCustom(item)}>
                        删除
                      </button>
                    )}
                  </div>
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
                    style={{ width: 'auto', padding: '9px 20px' }}
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
        </>
      )}
    </div>
  );
}
