// 游戏核心类型定义

/** 角色情绪状态 */
export type Emotion = 'angry' | 'wronged' | 'hesitant' | 'touched' | 'happy';

/** 立绘表情态 */
export type PortraitState = 'angry' | 'neutral' | 'wronged' | 'hesitant' | 'happy';

/** 背景氛围等级 */
export type AtmosphereLevel = 'dark' | 'neutral' | 'warm';

/** 角色定义 */
export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  /** 角色说话风格的 system prompt 片段 */
  personalityPrompt: string;
  /** 各表情立绘 URL */
  portraits: Record<PortraitState, string>;
  /** 角色标签 */
  tags: string[];
}

/** 场景定义 */
export interface Scenario {
  id: string;
  title: string;
  /** 生气原因描述 */
  description: string;
  /** 初始原谅值 */
  initialForgiveness: number;
  /** 场景开场白（角色说的第一句话） */
  openingLine: string;
}

/** 情绪到原谅值变化映射 */
export interface EmotionDelta {
  emotion: Emotion;
  delta: number;
}

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  emotion?: Emotion;
  audioUrl?: string;
}

/** 游戏状态 */
export interface GameState {
  phase: 'home' | 'chat' | 'result';
  characterId: string | null;
  scenarioId: string | null;
  messages: ChatMessage[];
  forgiveness: number;
  currentRound: number;
  maxRounds: number;
  currentEmotion: Emotion;
  currentPortrait: PortraitState;
  currentAtmosphere: AtmosphereLevel;
  isTyping: boolean;
  result: 'success' | 'failure' | null;
}

/** 历史记录 */
export interface GameRecord {
  id: string;
  characterId: string;
  characterName: string;
  scenarioTitle: string;
  result: 'success' | 'failure';
  finalForgiveness: number;
  rounds: number;
  timestamp: number;
}

/** TTS 请求参数 */
export interface TTSRequest {
  text: string;
  /** 语速调节 -50 ~ 100 */
  speechRate: number;
  /** 音量调节 -50 ~ 100 */
  loudnessRate: number;
}

/** Chat API 请求 */
export interface ChatRequest {
  characterId: string;
  scenarioDescription: string;
  personalityPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
  currentForgiveness: number;
  currentRound: number;
  maxRounds: number;
}

/** Chat API 流式响应中的情绪标签 */
export interface EmotionTag {
  emotion: Emotion;
  delta: number;
}
