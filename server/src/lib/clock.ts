// 可注入时钟（docs/03 §8.4-5：service 判过期/时间戳一律用注入的 clock，测试可固定）。

export type Clock = () => Date

export const systemClock: Clock = () => new Date()
