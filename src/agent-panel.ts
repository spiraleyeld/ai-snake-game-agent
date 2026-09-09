import type { AgentController, AgentInfo } from './agent/agent-controller.js';

const SPEEDS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: 'MAX', value: 4 },
];

export class AgentPanel {
  private panelEl: HTMLDivElement | null = null;
  private thinkingPanelEl: HTMLDivElement | null = null;
  private controller: AgentController | null = null;
  private loopRunning = false;
  private paused = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private btnAgentEl: HTMLDivElement | null = null;
  private btnPauseResumeEl: HTMLDivElement | null = null;
  private loopInFlight = false;
  private hasReceivedThinking = false;


  init(controller: AgentController): void {
    this.controller = controller;
    this.createPanel();
    this.createThinkingPanel();
    this.bindEvents();
    this.subscribeToUpdates();
  }

  private subscribeToUpdates(): void {
    if (!this.controller) return;
    this.controller.setOnUpdate((info: AgentInfo) => {
      this.updateDisplay(info);
    });
  }

  private syncPauseState(value: boolean): void {
    this.paused = value;
    if (this.controller) {
      this.controller.paused = value;
    }
  }

  private createPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'agent-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">AGENT CONTROL</span>
        <span id="info-model" class="model-name">Qwen3.6-35B</span>
      </div>

      <div class="section">
        <h4 class="section-title">STATS</h4>
        <div class="stats-grid">
          <div class="stat-row"><span class="label">Score</span><span id="info-score" class="value score-val">0</span></div>
          <div class="stat-row"><span class="label">QWEN BEST</span><span id="info-best" class="value best-val">0</span></div>
          <div class="stat-row"><span class="label">Steps</span><span id="info-steps" class="value steps-val">0</span></div>
          <div class="stat-row"><span class="label">Risk</span><span id="info-risk" class="value risk-val">0.10</span></div>
          <div class="stat-row safety-row"><span class="label">Safety</span><span id="info-reason" class="value safety-right"></span></div>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">PLAN</h4>
        <div id="plan-box" class="plan-box">
          <span id="info-plan" class="plan-text">-</span>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">TELEMETRY</h4>
        <div class="stats-grid">
          <div class="stat-row"><span class="label">LLM Calls</span><span id="info-llm-calls" class="value">0</span></div>
          <div class="stat-row"><span class="label">Plan Len</span><span id="info-plan-len" class="value">0</span></div>
          <div class="stat-row"><span class="label">Plan Left</span><span id="info-plan-left" class="value">0</span></div>
          <div class="stat-row"><span class="label">Moves/LLM</span><span id="info-moves-llm" class="value">0 / 0</span></div>
          <div class="stat-row"><span class="label">Last LLM</span><span id="info-last-llm" class="value">0 ms</span></div>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">DIAGNOSTICS</h4>
        <div class="stats-grid">
          <div class="stat-row"><span class="label">Last Trigger</span><span id="info-last-trigger" class="value trigger-val">-</span></div>
          <div class="stat-row"><span class="label">No Progress</span><span id="info-stagnation" class="value stagnation-val">0</span></div>
          <div class="stat-row"><span class="label">Live Stag</span><span id="info-live-stag" class="value stagnation-val">0 / 80</span></div>
          <div class="stat-row"><span class="label">Budget</span><span id="info-budget" class="value stagnation-val">NORMAL</span></div>
          <div class="stat-row"><span class="label">Food Dist</span><span id="info-food-dist" class="value dist-val">-</span></div>
          <div class="stat-row"><span class="label">Unique Heads</span><span id="info-unique-heads" class="value unique-val">-</span></div>
          <div class="stat-row"><span class="label">Danger</span><span id="info-danger-level" class="value danger-val">-</span></div>
          <div class="stat-row"><span class="label">Mobility Streak</span><span id="info-low-mob-streak" class="value streak-val">0</span></div>
          <div class="stat-row"><span class="label">Max Mobility Streak</span><span id="info-max-mob-streak" class="value streak-val">0</span></div>
          <div class="stat-row"><span class="label">Last Low Streak Before Dead End</span><span id="info-last-low-streak" class="value streak-val">0</span></div>
          <div class="stat-row"><span class="label">Dead End Events</span><span id="info-dead-end-count" class="value streak-val">0</span></div>
          <div class="stat-row"><span class="label">Mobility</span><span id="info-mobility" class="value mobility-val">0 / 0</span></div>
          <div class="stat-row"><span class="label">Reachable</span><span id="info-reachable" class="value reachable-val">0</span></div>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">STRATEGY</h4>
        <div id="strategy-box" class="strategy-box">
          <span id="info-strategy" class="strategy-text">-</span>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">STATUS</h4>
        <div id="info-status" class="status-badge status-idle">IDLE</div>
      </div>

      <div class="section">
        <h4 class="section-title">SPEED</h4>
        <div class="speed-selector">
          ${SPEEDS.map(s => `<button class="speed-btn${s.value === 4 ? ' active' : ''}" data-speed="${s.value}">${s.label}</button>`).join('')}
        </div>
      </div>

      <div class="section section-actions">
        <div id="btn-agent-ctrl" class="action-btn action-btn-agent">START AGENT</div>
        <div id="btn-pause-resume" class="action-btn action-btn-pause disabled">PAUSE</div>
      </div>
    `;

    this.panelEl = panel;
    const layout = document.getElementById('layout-container');
    (layout || document.body).appendChild(panel);
  }

  private createThinkingPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'thinking-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">AGENT THINKING</span>
      </div>

      <div id="thinking-content" class="thinking-box">
        <span id="info-thinking" class="thinking-text">Waiting for Qwen reasoning...</span>
      </div>

      <div class="telemetry-row">
        <span class="label">Last LLM</span><span id="info-last-llm-think" class="value">-</span>
      </div>
    `;

    this.thinkingPanelEl = panel;
    const layout = document.getElementById('layout-container');
    (layout || document.body).appendChild(panel);
  }

  private bindEvents(): void {
    if (!this.panelEl) return;

    this.btnAgentEl = this.panelEl.querySelector('#btn-agent-ctrl') as HTMLDivElement;
    this.btnPauseResumeEl = this.panelEl.querySelector('#btn-pause-resume') as HTMLDivElement;

    this.btnAgentEl.addEventListener('click', async () => {
      if (!this.btnAgentEl || !this.btnPauseResumeEl) return;

      if (this.btnAgentEl.classList.contains('active')) {
        return;
      }

      this.btnAgentEl.textContent = 'CONNECTING...';
      this.btnAgentEl.classList.add('disabled');

      const connected = await this.controller?.startGame();

      if (connected) {
        this.btnAgentEl.classList.add('active');
        this.btnAgentEl.textContent = 'AGENT ACTIVE';
        this.btnPauseResumeEl.classList.remove('disabled');
        this.btnPauseResumeEl.textContent = 'PAUSE';
        this.loopRunning = true;
        this.paused = false;
        this.syncPauseState(false);
        this.runLoop();
      } else {
        this.btnAgentEl.classList.remove('disabled');
        this.btnAgentEl.textContent = 'RESTART AGENT';
      }
    });

    this.btnPauseResumeEl.addEventListener('click', () => {
      if (this.loopRunning && !this.paused) {
        clearTimeout(this.loopTimer ?? undefined);
        this.loopTimer = null;
        this.syncPauseState(true);
        this.btnAgentEl!.textContent = 'AGENT ACTIVE';
        this.btnPauseResumeEl!.textContent = 'RESUME';
      } else if (this.loopRunning && this.paused) {
        this.paused = false;
        this.syncPauseState(false);
        this.btnAgentEl!.textContent = 'AGENT ACTIVE';
        this.btnPauseResumeEl!.textContent = 'PAUSE';
        this.runLoop();
      }
    });

    const speedBtns = this.panelEl.querySelectorAll('.speed-btn') as NodeListOf<HTMLButtonElement>;
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const speed = parseFloat((btn as HTMLButtonElement).dataset.speed || '1');
        this.controller?.setSpeedMultiplier(speed);
      });
    });
  }

  private async runLoop(): Promise<void> {
    if (this.paused) return;
    if (!this.loopRunning || !this.controller) return;
    if (this.loopInFlight) return;

    this.loopInFlight = true;

    try {
      const status = this.controller.agentStatus;

      if (status === 'game-over' || status === 'idle') {
        this.loopRunning = false;
        this.paused = false;
        this.btnAgentEl!.classList.remove('active');
        this.btnAgentEl!.textContent = 'RESTART AGENT';
        this.btnAgentEl!.classList.remove('disabled');
        this.btnPauseResumeEl!.classList.add('disabled');
        return;
      }

      const info = this.controller.info;
      this.updateDisplay(info);

      await this.controller.runStep();

      if (this.paused) {
        this.loopTimer = null;
        return;
      }

      if (this.loopRunning) {
        const speedMultiplier = this.getSpeedMultiplier();
        const delay = Math.max(50, 200 / speedMultiplier);
        this.loopTimer = setTimeout(() => this.runLoop(), delay);
      }
    } finally {
      this.loopInFlight = false;
    }
  }

  private getSpeedMultiplier(): number {
    const activeBtn = this.panelEl?.querySelector('.speed-btn.active') as HTMLButtonElement | null;
    if (activeBtn) {
      return parseFloat(activeBtn.dataset.speed || '1');
    }
    return 1;
  }

  updateDisplay(info: AgentInfo | null): void {
    if (!this.panelEl || !info) return;

    const set = (id: string, val: string) => {
      const el = this.panelEl?.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };

    set('info-model', info.model);
    set('info-score', String(info.score));
    set('info-best', String(info.highScore));
    set('info-steps', String(info.steps));
    set('info-reason', info.safetyReason);
    set('info-risk', info.risk.toFixed(2));
    set('info-strategy', info.strategy || '-');
    set('info-status', info.status.toUpperCase());

    // Color coding for risk
    const riskEl = this.panelEl.querySelector('#info-risk') as HTMLElement;
    if (riskEl) {
      if (info.risk > 0.7) riskEl.style.color = '#f85149';
      else if (info.risk > 0.4) riskEl.style.color = '#d29922';
      else riskEl.style.color = '#3fb950';
    }

    // Color coding for safety reason
    const reasonEl = this.panelEl.querySelector('#info-reason') as HTMLElement;
    if (reasonEl && info.safetyReason !== 'OK' && info.qwenRequested !== 'ERROR') {
      reasonEl.style.color = '#d29922';
    } else if (reasonEl) {
      reasonEl.style.color = '';
    }

    // Status indicator color
    const statusEl = this.panelEl.querySelector('#info-status') as HTMLElement;
    if (statusEl) {
      switch (info.status) {
        case 'playing': statusEl.style.color = '#3fb950'; break;
        case 'thinking': statusEl.style.color = '#58a6ff'; break;
        case 'game-over': statusEl.style.color = '#f85149'; break;
        default: statusEl.style.color = '';
      }
    }

    // Plan arrows display
    const planEl = this.panelEl?.querySelector('#info-plan') as HTMLElement | null;
    if (planEl) {
      if (info.planLength > 0 && info.planRemaining > 0) {
        planEl.textContent = `\u2192 ${info.planRemaining} remaining`;
      } else if (info.status === 'thinking') {
        planEl.textContent = '\u231B thinking...';
      } else if (info.planLength > 0 && info.planRemaining === 0) {
        planEl.textContent = 'Awaiting next plan';
      } else {
        planEl.textContent = '-';
      }
    }

    // Telemetry display
    const setTelemetry = (id: string, val: string) => {
      const el = this.panelEl?.querySelector(`#${id}`);
      if (el) el.textContent = val;
    };

    setTelemetry('info-plan-left', String(info.planRemaining));
    setTelemetry('info-llm-calls', String(info.llmCalls));
    setTelemetry('info-plan-len', String(info.planLength));
    setTelemetry('info-moves-llm', `${info.movesPerLlm} / ${info.planLength}`);
    setTelemetry('info-last-llm', info.lastLlmLatency > 0 ? `${info.lastLlmLatency} ms` : '-');

    // Diagnostic telemetry wiring (snapshot at trigger time)
    setTelemetry('info-last-trigger', info.lastTrigger);

    const stagnationVal = info.snapshotStepsSinceProgress !== null ? String(info.snapshotStepsSinceProgress) : String(info.stagnationSteps);
    setTelemetry('info-stagnation', stagnationVal);

    setTelemetry('info-live-stag', `${info.liveNoProgress} / ${info.effectiveStagnationThreshold}`);
    setTelemetry('info-budget', info.stagnationCategory);

    if (info.snapshotFoodDistCurrent !== null && info.snapshotFoodDistBest !== null) {
      setTelemetry('info-food-dist', `${info.snapshotFoodDistCurrent} / ${info.snapshotFoodDistBest}`);
    } else {
      setTelemetry('info-food-dist', info.foodDistanceRatio);
    }

    if (info.snapshotRecentUnique !== null) {
      const histLen = info.recentUniqueRatio.includes('/') ? parseInt(info.recentUniqueRatio.split('/')[1].trim(), 10) : 0;
      setTelemetry('info-unique-heads', `${info.snapshotRecentUnique} / ${histLen}`);
    } else {
      setTelemetry('info-unique-heads', info.recentUniqueRatio);
    }

    // Danger telemetry display
    const dangerVal = info.dangerLevel !== '-' ? info.dangerLevel : '-';
    setTelemetry('info-danger-level', dangerVal);

    const mobilityStr = `${info.legalMoveCount} / ${info.survivableMoveCount}`;
    setTelemetry('info-mobility', mobilityStr);

    setTelemetry('info-reachable', String(info.reachableCells));

    // Danger episode telemetry
    setTelemetry('info-low-mob-streak', String(info.currentLowMobilityStreak));
    setTelemetry('info-max-mob-streak', String(info.maxLowMobilityStreak));
    setTelemetry('info-last-low-streak', String(info.lastLowStreakBeforeDeadEnd));
    setTelemetry('info-dead-end-count', String(info.deadEndEventCount));

    // Danger color coding
    const dangerEl = this.panelEl?.querySelector('#info-danger-level') as HTMLElement | null;
    if (dangerEl) {
      switch (info.dangerLevel) {
        case 'SAFE': dangerEl.style.color = '#3fb950'; break;
        case 'LOW_MOBILITY': dangerEl.style.color = '#d29922'; break;
        case 'DEAD_END_IMMINENT': dangerEl.style.color = '#f85149'; break;
        default: dangerEl.style.color = '';
      }
    }

    // Update button state based on status
    const btnAgent = this.panelEl?.querySelector('#btn-agent-ctrl') as HTMLDivElement | null;
    if (btnAgent && info.status === 'playing' && !this.paused) {
      btnAgent.textContent = 'AGENT ACTIVE';
    } else if (btnAgent && info.status === 'game-over') {
      // Handled by runLoop cleanup
    }

    // Update thinking panel
    const thinkingEl = this.thinkingPanelEl?.querySelector('#info-thinking') as HTMLElement | null;
    const thinkingBox = this.thinkingPanelEl?.querySelector('.thinking-box') as HTMLElement | null;

    if (thinkingEl) {
      if (info.thinking && info.thinking.length > 0) {
        this.hasReceivedThinking = true;
        thinkingEl.textContent = info.thinking;
      } else if (!this.hasReceivedThinking) {
        thinkingEl.textContent = 'Waiting for Qwen reasoning...';
      }
    }

    // Scroll behavior: reset on first non-empty of new cycle, auto-follow during streaming
    if (thinkingBox && info.thinking && info.thinking.length > 0) {
      thinkingBox.scrollTop = 0;
      thinkingBox.scrollTop = thinkingBox.scrollHeight;
    } else if (!this.hasReceivedThinking && thinkingBox) {
      thinkingBox.scrollTop = 0;
    }

    const lastLlmThinkEl = this.thinkingPanelEl?.querySelector('#info-last-llm-think') as HTMLElement | null;
    if (lastLlmThinkEl) {
      lastLlmThinkEl.textContent = info.lastLlmLatency > 0 ? `${info.lastLlmLatency} ms` : '-';
    }
  }

  destroy(): void {
    this.loopRunning = false;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    if (this.controller) {
      this.controller.setOnUpdate(undefined);
    }
    if (this.panelEl && this.panelEl.parentNode) {
      this.panelEl.parentNode.removeChild(this.panelEl);
    }
    if (this.thinkingPanelEl && this.thinkingPanelEl.parentNode) {
      this.thinkingPanelEl.parentNode.removeChild(this.thinkingPanelEl);
    }
  }
}
