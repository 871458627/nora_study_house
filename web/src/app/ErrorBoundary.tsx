import { Component, type ReactNode } from 'react';
import { Mascot } from '../components/Mascot';

/**
 * 顶层错误边界（缺陷清单 低9）：渲染异常不再整树白屏——
 * 给孩子一个有小桃、有出路的错误页（刷新即可恢复；数据在 localStorage 与云端，不受影响）。
 */
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="splash" role="alert">
        <Mascot mood="sad" size={96} />
        <b>哎呀，小桃摔了一跤。</b>
        <span>学习记录都安全地存着呢。刷新一下就能回来。</span>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          刷新重试
        </button>
      </div>
    );
  }
}
