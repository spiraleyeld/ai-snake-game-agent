import type { AgentController, AgentInfo } from './agent/agent-controller.js';

const SPEEDS = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: 'MAX', value: 4 },
];

export class AgentPanel {
  private panelEl: HTMLDivElement | null = null;
  private controller: AgentController | null = null;
  private loopRunning = false;
  private paused = false;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private btnAgentEl: HTMLDivElement | null = null;
  private btnPauseResumeEl: HTMLDivElement | null = null;
  private loopInFlight = false;


  init(controller: AgentController): void {
    this.controller = controller;
    this.createPanel();
    this.bindEvents();
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
          <div class="stat-row"><span class="label">Safety</span><span id="info-reason" class="value reason-val">OK</span></div>
        </div>
      </div>

      <div class="section">
        <h4 class="section-title">DECISION</h4>
        <div class="decision-grid">
          <div class="decision-row"><span class="label">Current</span><span id="info-dir" class="value dir-val">→ RIGHT</span></div>
          <div class="decision-row"><span class="label">Qwen Wants</span><span id="info-requested" class="value req-val">↑ UP</span></div>
          <div class="decision-row"><span class="label">Executed</span><span id="info-executed" class="value exec-val">↑ UP</span></div>
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
          ${SPEEDS.map(s => `<button class="speed-btn${s.value === 1 ? ' active' : ''}" data-speed="${s.value}">${s.label}</button>`).join('')}
        </div>
      </div>

      <div class="section section-actions">
        <div id="btn-mode-player" class="action-btn action-btn-player">PLAYER</div>
        <div id="btn-agent-ctrl" class="action-btn action-btn-agent">AGENT</div>
        <div id="btn-pause-resume" class="action-btn action-btn-pause" style="display:none;">PAUSE</div>
      </div>
    `;

    this.panelEl = panel;
    document.body.appendChild(panel);
  }

  private bindEvents(): void {
    if (!this.panelEl) return;

    this.btnAgentEl = this.panelEl.querySelector('#btn-agent-ctrl') as HTMLDivElement;
    const btnPlayer = this.panelEl.querySelector('#btn-mode-player') as HTMLDivElement;
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
        btnPlayer.classList.remove('active');
        this.btnAgentEl.classList.add('active');
        this.btnAgentEl.textContent = 'AGENT active';
        this.btnPauseResumeEl.style.display = '';
        this.btnPauseResumeEl.textContent = 'PAUSE';
        this.loopRunning = true;
        this.paused = false;
        this.syncPauseState(false);
        this.runLoop();
      } else {
        this.btnAgentEl.classList.remove('disabled');
        this.btnAgentEl.textContent = 'AGENT';
      }
    });

    this.btnPauseResumeEl.addEventListener('click', () => {
      if (this.loopRunning && !this.paused) {
        clearTimeout(this.loopTimer ?? undefined);
        this.loopTimer = null;
        this.syncPauseState(true);
        this.btnAgentEl!.textContent = 'AGENT active';
        this.btnPauseResumeEl!.textContent = 'RESUME';
      } else if (this.loopRunning && this.paused) {
        this.paused = false;
        this.syncPauseState(false);
        this.btnAgentEl!.textContent = 'AGENT active';
        this.btnPauseResumeEl!.textContent = 'PAUSE';
        this.runLoop();
      }
    });

    btnPlayer.addEventListener('click', () => {
      if (this.controller) {
        this.controller.stop();
      }
      this.loopRunning = false;
      this.paused = false;
      this.syncPauseState(false);
      if (this.loopTimer) {
        clearTimeout(this.loopTimer);
        this.loopTimer = null;
      }
      this.btnAgentEl!.classList.remove('active');
      this.btnAgentEl!.textContent = 'AGENT';
      this.btnAgentEl!.classList.remove('disabled');
      this.btnPauseResumeEl!.style.display = 'none';
      btnPlayer.classList.add('active');
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
        this.btnAgentEl!.textContent = 'AGENT';
        this.btnAgentEl!.classList.remove('disabled');
        this.btnPauseResumeEl!.style.display = 'none';
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
    set('info-dir', info.currentDirection);
    set('info-requested', info.qwenRequested);
    set('info-executed', info.qwenExecuted);
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
        planEl.textContent = '\u274c queue empty';
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

    // Direction arrow display
    const dirEl = this.panelEl?.querySelector('#info-dir') as HTMLElement;
    if (dirEl) {
      const arrows: Record<string, string> = { Up: '↑', Down: '↓', Left: '←', Right: '→' };
      const nameMap: Record<string, string> = { Up: 'UP', Down: 'DOWN', Left: 'LEFT', Right: 'RIGHT' };
      const arrow = arrows[info.currentDirection] || '?';
      const name = nameMap[info.currentDirection] || info.currentDirection;
      dirEl.textContent = `${arrow} ${name}`;
    }

    // Executed direction arrow
    const execEl = this.panelEl?.querySelector('#info-executed') as HTMLElement;
    if (execEl) {
      const arrows: Record<string, string> = { Up: '↑', Down: '↓', Left: '←', Right: '→' };
      const nameMap: Record<string, string> = { Up: 'UP', Down: 'DOWN', Left: 'LEFT', Right: 'RIGHT' };
      const arrow = arrows[info.qwenExecuted] || '?';
      const name = nameMap[info.qwenExecuted] || info.qwenExecuted;
      execEl.textContent = `${arrow} ${name}`;
    }

    // Requested direction arrow
    const reqEl = this.panelEl?.querySelector('#info-requested') as HTMLElement;
    if (reqEl) {
      const arrows: Record<string, string> = { Up: '↑', Down: '↓', Left: '←', Right: '→' };
      const nameMap: Record<string, string> = { Up: 'UP', Down: 'DOWN', Left: 'LEFT', Right: 'RIGHT' };
      if (info.qwenRequested === 'ERROR') {
        reqEl.textContent = 'ERR';
      } else {
        const arrow = arrows[info.qwenRequested as keyof typeof arrows] || '?';
        const name = nameMap[info.qwenRequested as keyof typeof nameMap] || info.qwenRequested;
        reqEl.textContent = `${arrow} ${name}`;
      }
    }

    // Update button state based on status
    const btnAgent = this.panelEl?.querySelector('#btn-agent-ctrl') as HTMLDivElement | null;
    if (btnAgent && info.status === 'playing' && !this.paused) {
      btnAgent.textContent = 'AGENT active';
    } else if (btnAgent && info.status === 'game-over') {
      // Handled by runLoop cleanup
    }
  }

  destroy(): void {
    this.loopRunning = false;
    if (this.loopTimer) clearTimeout(this.loopTimer);
    if (this.panelEl && this.panelEl.parentNode) {
      this.panelEl.parentNode.removeChild(this.panelEl);
    }
  }
}
