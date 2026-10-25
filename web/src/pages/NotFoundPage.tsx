import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Mascot } from '../components/Mascot';

export function NotFoundPage() {
  return (
    <div className="page">
      <div className="card empty-state">
        <Mascot mood="normal" size={96} />
        <b>这条小路没有通</b>
        <p>页面可能被移动过了。回到今天，看看现在该做什么。</p>
        <Link to="/" className="btn btn-primary">
          回到今天
          <Icon name="arrow" size={16} />
        </Link>
      </div>
    </div>
  );
}
