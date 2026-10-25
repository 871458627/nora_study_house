import { useApp } from '../app/AppProvider';
import { Icon, type IconName } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { ProgressBar } from '../components/ui';
import { ACCESSORIES, BADGES } from '../data/defaults';
import { todayKey } from '../core/date';
import { moodLine, nextStage, petMood, stageInfo } from '../core/pet';

const ACCESSORY_ICON: Record<string, IconName> = {
  bow: 'bow',
  crown: 'crown',
  glasses: 'glasses',
  scarf: 'scarf',
  cape: 'cape',
};

export function PetPage() {
  const { state, dispatchLocal, notify } = useApp();
  const date = todayKey();
  const hour = new Date().getHours();
  const mood = petMood(state, date, hour);
  const stage = stageInfo(state.pet.stage);
  const next = nextStage(state.pet.stage);
  const growthPercent = next
    ? Math.min(100, (state.pet.fedDays / next.minDays) * 100)
    : 100;
  const full = state.pet.satiety >= 100;

  const feed = (kind: 'food' | 'meal') => {
    const available = kind === 'food' ? state.rewards.food : state.rewards.meals;
    if (available <= 0) {
      notify(kind === 'food' ? '桃粮还不够，完成今天的任务就能攒到。' : '还没有大餐，把今天的计划做完吧。');
      return;
    }
    if (full) {
      notify('小桃已经吃得饱饱的，晚一点再喂吧。');
      return;
    }
    dispatchLocal({ type: 'feed', date, kind });
    notify(kind === 'food' ? '小桃吃了一份桃粮，饱食度 +10。' : '大餐时间，饱食度 +30。');
  };

  const toggleAccessory = (id: string, slot: string) => {
    const equipped = state.pet.equipped[slot] === id;
    dispatchLocal({ type: 'equip', slot, itemId: equipped ? null : id });
  };

  return (
    <div className="page pet-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">小桃 · 成长第 {state.pet.fedDays} 天</p>
          <h1>学习有回响，小桃有回应。</h1>
          <p className="page-lede">
            完成任务得到桃粮，喂饱小桃，解锁饰品。奖励只跟努力有关，不会因为一次失误被收回。
          </p>
        </div>
      </header>

      <div className="pet-layout">
        <section className="pet-stage">
          <span className="pet-glow" aria-hidden="true" />
          <span className="pet-plant" aria-hidden="true">
            <Icon name="leaf" size={52} />
          </span>
          <div className="pet-stage-caption">{moodLine(mood, state.profile.nickname)}</div>
          <div className="pet-main">
            <Mascot mood={mood} equipped={state.pet.equipped} size={188} />
          </div>
          <div className="pet-stage-foot">
            <div>
              <b>{stage.name}</b>
              <small>{stage.desc}</small>
            </div>
            <span className="stage-pill">第 {state.pet.fedDays} 天</span>
          </div>
        </section>

        <aside className="pet-side">
          <section className="card pet-feed-card">
            <div className="section-title">
              <h2>今天的饭碗</h2>
              <span className="chip-label">上限 100</span>
            </div>
            <div className="satiety-row">
              <span>
                <Icon name="food" size={14} /> 饱食度
              </span>
              <b>{state.pet.satiety} / 100</b>
            </div>
            <ProgressBar value={state.pet.satiety} className="satiety-bar" />
            <p className="feed-note">
              {full
                ? '小桃现在吃得饱饱的，明天再来喂它吧。'
                : '每完成一个任务可得 1 份桃粮；全部答对再多 1 份。'}
            </p>
            <div className="feed-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={state.rewards.food <= 0 || full}
                onClick={() => feed('food')}
              >
                <Icon name="food" size={16} />
                喂桃粮 · 还有 {state.rewards.food}
              </button>
              <button
                type="button"
                className="btn btn-soft"
                disabled={state.rewards.meals <= 0 || full}
                onClick={() => feed('meal')}
              >
                <Icon name="star" size={16} />
                大餐 · 还有 {state.rewards.meals}
              </button>
            </div>
            <p className="pin-note">饱食度每天会自然减少 15 点，多喂几天就能看到小桃长大。</p>
          </section>

          <section className="card pet-stats">
            <div>
              <b>{state.pet.fedDays}</b>
              <small>喂养天数</small>
            </div>
            <div>
              <b>{state.rewards.streak}</b>
              <small>连续打卡</small>
            </div>
            <div>
              <b>{state.rewards.stars}</b>
              <small>累计星星</small>
            </div>
            <div>
              <b>{state.pet.unlocked.length}</b>
              <small>已解锁饰品</small>
            </div>
          </section>

          <section className="card growth-card">
            <div className="growth-top">
              <b>成长进度</b>
              <span>{next ? `距离${next.name}还差 ${Math.max(0, next.minDays - state.pet.fedDays)} 天` : '已经长成大桃啦'}</span>
            </div>
            <ProgressBar value={growthPercent} />
            <p>
              {next
                ? `累计喂养 14 天进入少年桃，42 天进入大桃。每一次认真完成，都在帮小桃长大。`
                : '小桃已经长成大桃了。接下来的每一天，都是你们一起攒下的。'}
            </p>
          </section>
        </aside>
      </div>

      <section className="wardrobe-section">
        <div className="section-title">
          <h2>小桃的衣柜</h2>
          <span className="section-aside">徽章会解锁饰品，解锁后永久保留。</span>
        </div>
        <div className="wardrobe-grid">
          {ACCESSORIES.map(accessory => {
            const unlocked = state.pet.unlocked.includes(accessory.id);
            const equipped = state.pet.equipped[accessory.slot] === accessory.id;
            return (
              <button
                key={accessory.id}
                type="button"
                className={`wardrobe-item ${unlocked ? '' : 'locked'} ${equipped ? 'equipped' : ''}`}
                disabled={!unlocked}
                onClick={() => toggleAccessory(accessory.id, accessory.slot)}
              >
                <span className="wardrobe-art">
                  <Icon name={ACCESSORY_ICON[accessory.id] ?? 'sparkle'} size={30} />
                </span>
                <b>{accessory.name}</b>
                <small>{unlocked ? (equipped ? '已佩戴 · 点一下取下' : '点一下戴上') : accessory.hint}</small>
                {!unlocked && (
                  <span className="wardrobe-lock">
                    <Icon name="lock" size={11} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="badge-section">
        <div className="section-title">
          <h2>徽章陈列</h2>
          <span className="section-aside">
            {state.rewards.badges.length} / {BADGES.length} 枚
          </span>
        </div>
        <div className="badge-grid">
          {BADGES.map(badge => {
            const earned = state.rewards.badges.includes(badge.id);
            return (
              <div key={badge.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                <span className="badge-medal">
                  <Icon name={earned ? 'medal' : 'lock'} size={20} />
                </span>
                <b>{badge.name}</b>
                <small>{badge.hint}</small>
              </div>
            );
          })}
        </div>
      </section>

      <div className="gentle-note">
        <Icon name="leaf" size={15} />
        <span>
          没有完成计划时，小桃只会饿肚子或者有点委屈；已经得到的星星、徽章和饰品都不会被收回。
        </span>
      </div>
    </div>
  );
}
