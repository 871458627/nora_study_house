import { Link } from 'react-router-dom';
import { useApp } from '../app/AppProvider';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';
import { PET_SKINS } from '../data/pets';
import { moodLine, petMood } from '../core/pet';
import { todayKey } from '../core/date';

/** 宠物商城：每日学习攒星星 → 兑换伙伴（用户需求 2026-10-25 / FR-P1-01 宠物部分） */
export function ShopPage() {
  const { state, dispatchLocal, notify } = useApp();
  const date = todayKey();
  const hour = new Date().getHours();
  const mood = petMood(state, date, hour);

  const buy = (petId: string, name: string, price: number) => {
    if (state.shop.owned.includes(petId)) return;
    if (state.rewards.stars < price) {
      notify(`星星还不够，再攒 ${price - state.rewards.stars} 颗就能接 ${name} 回家。`);
      return;
    }
    dispatchLocal({ type: 'shop-buy', petId });
    notify(`${name} 跟你回家啦！它已经出现在小桃页和今天页了。`);
  };

  const equip = (petId: string, name: string) => {
    dispatchLocal({ type: 'shop-equip', petId });
    notify(`现在陪着你的是 ${name}。`);
  };

  return (
    <div className="page shop-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">宠物商店</p>
          <h1>攒星星，接小伙伴回家。</h1>
          <p className="page-lede">
            每完成一个任务得 1 颗星星，全部答对还有多。星星只用来交伙伴，不会因为失误被收走。
          </p>
        </div>
        <div className="head-side">
          <span className="shop-balance" title="累计星星">
            <Icon name="star" size={16} />
            <b>{state.rewards.stars}</b>
            <small>颗星星</small>
          </span>
        </div>
      </header>

      <div className="shop-grid">
        {PET_SKINS.map(skin => {
          const owned = state.shop.owned.includes(skin.id) || skin.price === 0;
          const active = state.pet.skin === skin.id;
          const affordable = state.rewards.stars >= skin.price;
          return (
            <section key={skin.id} className={`card shop-card ${active ? 'active' : ''}`}>
              <div className="shop-card-art">
                <Mascot mood={mood} equipped={state.pet.equipped} petId={skin.id} size={104} />
                {active && <span className="shop-active-pill">陪伴中</span>}
              </div>
              <b>{skin.name}</b>
              <small className="shop-tagline">{skin.tagline}</small>
              <p className="shop-preview-note">{moodLine(mood, state.profile.nickname)}</p>
              {owned ? (
                <button
                  type="button"
                  className={`btn full ${active ? 'btn-soft' : 'btn-primary'}`}
                  disabled={active}
                  onClick={() => equip(skin.id, skin.name)}
                >
                  {active ? '正陪着你' : '让它来陪你'}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary full"
                  onClick={() => buy(skin.id, skin.name, skin.price)}
                >
                  <Icon name="star" size={15} />
                  {skin.price} 颗星星接回家
                </button>
              )}
              {!owned && !affordable && (
                <p className="shop-shortfall">还差 {skin.price - state.rewards.stars} 颗，加油。</p>
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
