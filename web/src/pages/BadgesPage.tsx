import { Link } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon, type IconName } from '../components/Icon';
import { BADGES } from '../data/defaults';

const BADGE_ICON: Record<string, IconName> = {
  'first-step': 'leaf',
  streak3: 'flame',
  streak7: 'flame',
  streak14: 'crown',
  streak30: 'star',
  master10: 'glasses',
  dictation100: 'pen',
  allround: 'medal',
  'perfect-week': 'calendar',
  foodie: 'food',
};

/** 成就徽章图鉴：点亮收集（激励体系 2026-10-25） */
export function BadgesPage() {
  const { state } = useApp();
  const owned = new Set(state.rewards.badges);
  const count = owned.size;

  return (
    <div className="page badges-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">成就图鉴</p>
          <h1>一枚一枚，点亮你的足迹。</h1>
          <p className="page-lede">
            徽章只跟努力有关：完成第一件事、坚持打卡、学会整课……收集齐它们，小桃也为你骄傲。
          </p>
        </div>
        <div className="head-side">
          <span className="badge-progress" title="已收集徽章">
            <Icon name="medal" size={16} />
            <b>{count}</b>
            <small>/ {BADGES.length} 枚</small>
          </span>
        </div>
      </header>

      <div className="badge-grid-page">
        {BADGES.map(badge => {
          const unlocked = owned.has(badge.id);
          return (
            <section key={badge.id} className={`card badge-cell ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="badge-cell-art" aria-hidden="true">
                <Icon name={BADGE_ICON[badge.id] ?? 'medal'} size={30} />
              </span>
              <b>{unlocked ? badge.name : '？？？'}</b>
              <small>{unlocked ? '已经点亮' : badge.hint}</small>
              {unlocked && badge.accessory && (
                <em>附赠饰品已放进小桃的衣柜</em>
              )}
            </section>
          );
        })}
      </div>

      <p className="shop-footnote">
        <Link to="/pet" className="text-link">
          回到小桃页 <Icon name="chevron" size={13} />
        </Link>
      </p>
    </div>
  );
}
