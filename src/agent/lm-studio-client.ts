import type { Direction, PlanResponse, StrategyUpdateResponse } from './types.js';

const PROXY_PATH = '/agent-proxy/v1/chat/completions';
const MAX_REASONING_CHARS = 8000;

export class LmStudioClient {
  private modelName: string;

  constructor(_baseUrl: string, modelName: string) {
    this.modelName = modelName;
  }

  async getModels(): Promise<string[]> {
    try {
      const resp = await fetch('/v1/models');
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.data || []).map((m: any) => m.id).filter(Boolean);
    } catch {
      return [];
    }
  }

  async getDirection(
    prompt: string,
    onThinkingUpdate?: (thinking: string) => void
  ): Promise<PlanResponse | null> {
    try {
      const resp = await fetch(PROXY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.3,
          response_format: { type: 'text' },
          stream: true,
        }),
      });

      if (!resp.ok) return null;

      const reader = resp.body?.getReader();
      if (!reader) return null;

      const decoder = new TextDecoder();
      let buffer = '';
      let reasoningText = '';
      let contentText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let reasoningDeltaCount = 0;
          const YIELD_BATCH_SIZE = 15;

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            const delta = parsed?.choices?.[0]?.delta;
            if (!delta) continue;

            // Accumulate reasoning content for live display
            if (delta.reasoning_content) {
              reasoningText += delta.reasoning_content;
              if (reasoningText.length > MAX_REASONING_CHARS) {
                reasoningText = reasoningText.slice(0, MAX_REASONING_CHARS);
              }
              onThinkingUpdate?.(reasoningText);

              reasoningDeltaCount++;
              if (reasoningDeltaCount >= YIELD_BATCH_SIZE) {
                reasoningDeltaCount = 0;
                await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
              }
            }

            // Accumulate content for final parsing
            if (delta.content) {
              contentText += delta.content;
            }
          }
        }

        const remaining = decoder.decode();
        let remainingReasoningDeltaCount = 0;
        const YIELD_BATCH_SIZE = 15;

        if (remaining) {
          const lines = remaining.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            const delta = parsed?.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.reasoning_content) {
              reasoningText += delta.reasoning_content;
              if (reasoningText.length > MAX_REASONING_CHARS) {
                reasoningText = reasoningText.slice(0, MAX_REASONING_CHARS);
              }
              onThinkingUpdate?.(reasoningText);

              remainingReasoningDeltaCount++;
              if (remainingReasoningDeltaCount >= YIELD_BATCH_SIZE) {
                remainingReasoningDeltaCount = 0;
                await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
              }
            }

            if (delta.content) {
              contentText += delta.content;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Parse contentText using existing validation logic
      const validDirs = ['Up', 'Down', 'Left', 'Right'];
      try {
        let cleaned = contentText.trim();
        cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        const moves = parsed.moves as Direction[];
        if (Array.isArray(moves) && moves.length >= 1 && moves.length <= 6) {
          const allValid = moves.every((m: string) => validDirs.includes(m));
          if (allValid) {
            return {
              moves,
              risk: typeof parsed.risk === 'number' ? Math.max(0, Math.min(1, parsed.risk)) : 0.5,
              strategy: typeof parsed.strategy === 'string' ? parsed.strategy.slice(0, 60) : '',
              thinking: reasoningText.slice(0, MAX_REASONING_CHARS),
            };
          }
        }

        // Fallback: single direction format for backward compatibility
        if (parsed.direction) {
          const dir = parsed.direction as Direction;
          if (validDirs.includes(dir)) {
            return {
              moves: [dir],
              risk: typeof parsed.risk === 'number' ? Math.max(0, Math.min(1, parsed.risk)) : 0.5,
              strategy: typeof parsed.strategy === 'string' ? parsed.strategy.slice(0, 60) : '',
              thinking: reasoningText.slice(0, MAX_REASONING_CHARS),
            };
          }
        }
      } catch { /* invalid JSON */ }

      return null;
    } catch {
      return null;
    }
  }

  async getStrategyUpdate(
    prompt: string,
    onThinkingUpdate?: (thinking: string) => void
  ): Promise<StrategyUpdateResponse | null> {
    try {
      const resp = await fetch(PROXY_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.3,
          response_format: { type: 'text' },
          stream: true,
        }),
      });

      if (!resp.ok) return null;

      const reader = resp.body?.getReader();
      if (!reader) return null;

      const decoder = new TextDecoder();
      let buffer = '';
      let reasoningText = '';
      let contentText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let reasoningDeltaCount = 0;
          const YIELD_BATCH_SIZE = 15;

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            const delta = parsed?.choices?.[0]?.delta;
            if (!delta) continue;

            // Accumulate reasoning content for live display
            if (delta.reasoning_content) {
              reasoningText += delta.reasoning_content;
              if (reasoningText.length > MAX_REASONING_CHARS) {
                reasoningText = reasoningText.slice(0, MAX_REASONING_CHARS);
              }
              onThinkingUpdate?.(reasoningText);

              reasoningDeltaCount++;
              if (reasoningDeltaCount >= YIELD_BATCH_SIZE) {
                reasoningDeltaCount = 0;
                await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
              }
            }

            // Accumulate content for final parsing
            if (delta.content) {
              contentText += delta.content;
            }
          }
        }

        const remaining = decoder.decode();
        let reasoningDeltaCount = 0;
        const YIELD_BATCH_SIZE = 15;

        if (remaining) {
          const lines = remaining.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') continue;

            let parsed: any;
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              continue;
            }

            const delta = parsed?.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.reasoning_content) {
              reasoningText += delta.reasoning_content;
              if (reasoningText.length > MAX_REASONING_CHARS) {
                reasoningText = reasoningText.slice(0, MAX_REASONING_CHARS);
              }
              onThinkingUpdate?.(reasoningText);

              reasoningDeltaCount++;
              if (reasoningDeltaCount >= YIELD_BATCH_SIZE) {
                reasoningDeltaCount = 0;
                await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
              }
            }

            if (delta.content) {
              contentText += delta.content;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Parse contentText as StrategyUpdateResponse JSON
      try {
        let cleaned = contentText.trim();
        cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.policy !== 'SAFE_CHASE') return null;

        const params = parsed.params;
        if (!params || typeof params !== 'object') return null;

        const foodWeight = params.foodWeight;
        const openSpaceWeight = params.openSpaceWeight;
        const wallPenalty = params.wallPenalty;
        const bodyPenalty = params.bodyPenalty;

        if (typeof foodWeight !== 'number' || typeof openSpaceWeight !== 'number') return null;
        if (typeof wallPenalty !== 'number' || typeof bodyPenalty !== 'number') return null;
        if (!isFinite(foodWeight) || !isFinite(openSpaceWeight)) return null;
        if (!isFinite(wallPenalty) || !isFinite(bodyPenalty)) return null;

        const clamp = (v: number) => Math.max(0.0, Math.min(2.0, v));

        const clampedParams = {
          foodWeight: clamp(foodWeight),
          openSpaceWeight: clamp(openSpaceWeight),
          wallPenalty: clamp(wallPenalty),
          bodyPenalty: clamp(bodyPenalty),
        };

        const reason = typeof parsed.reason === 'string' ? parsed.reason.trim() : '';
        if (reason.length > 500) {
          return null;
        }

        return {
          policy: 'SAFE_CHASE',
          params: clampedParams,
          reason,
          thinking: reasoningText.slice(0, MAX_REASONING_CHARS),
        };
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }
}
