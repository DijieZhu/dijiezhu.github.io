'use strict';

(() => {
  const demo = document.querySelector('.flywheel-demo');
  if (!demo) return;

  const stages = [
    [
      "Learning / Continual Learning",
      "Learn policies and evaluators from demonstrations, simulation, and limited labeled experience. For continual learning, select informative failures and corrections, combine them with earlier data, and improve weak behaviors while preserving existing skills.",
      "Update the evaluator alongside the policy. Study which failure signals remain useful as behavior changes, and which need new training examples or fresh calibration data."
    ],
    [
      "Evaluation",
      "Estimate where a policy is likely to succeed, using abundant simulation rollouts and limited target-domain tests to correct simulation bias and quantify uncertainty.",
      "For runtime evaluation, study failure-detection accuracy, warning lead time, and computational cost. Revalidate these signals on held-out trials after policy updates, since an evaluator that was reliable for one policy may not remain reliable for the next."
    ],
    [
      "Execution",
      "Use current observations, proposed actions, and evaluator feedback to decide whether to continue, attempt recovery with an available skill, or request human correction.",
      "Test whether these decisions improve long-horizon task completion while limiting missed failures, unnecessary interventions, and human assistance. A warning is useful only if it arrives in time and leads to an action that helps complete the task."
    ],
    [
      "Data Collection",
      "Record successes, failures, recovery attempts, and human corrections together with the observations and actions that produced them. Distinguish observed outcomes from interventions so the training data reflects what actually happened.",
      "Prioritize experience that reveals weak skills or useful recovery behavior. Feed selected examples into the next learning round, while keeping held-out trials separate for checking model improvements."
    ]
  ];
  const buttons = [...demo.querySelectorAll('[data-flywheel-step]')];
  const arcs = [...demo.querySelectorAll('[data-flywheel-arc]')];
  const next = demo.querySelector('[data-flywheel-next]');
  const play = demo.querySelector('[data-flywheel-play]');
  const status = demo.querySelector('[data-flywheel-status]');
  const detail = demo.querySelector('.flywheel-detail');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stageDuration = 8000;
  let selected = 0;
  let wantsPlayback = !reducedMotion.matches;
  let isVisible = false;
  let timer = null;

  // Stack the panels in one grid cell so longer explanations do not shift the page.
  const panels = stages.map((stage, index) => {
    const panel = document.createElement('div');
    panel.className = 'flywheel-panel';
    const heading = document.createElement('h4');
    const number = document.createElement('span');
    number.textContent = `${String(index + 1).padStart(2, '0')} / ${String(stages.length).padStart(2, '0')}`;
    const title = document.createElement('span');
    title.textContent = stage[0];
    heading.append(number, title);
    panel.append(heading);
    stage.slice(1).forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      panel.append(paragraph);
    });
    return panel;
  });
  detail.replaceChildren(...panels);

  function selectStage(index) {
    selected = (index + stages.length) % stages.length;
    buttons.forEach((button, i) => {
      button.classList.toggle('is-active', i === selected);
      button.setAttribute('aria-pressed', String(i === selected));
    });
    arcs.forEach((arc, i) => arc.classList.toggle('is-active', i === selected));
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === selected);
      panel.setAttribute('aria-hidden', String(i !== selected));
    });
  }

  // Every deployment round feeds collected experience back into learning.
  function nextStage() {
    return (selected + 1) % stages.length;
  }

  function syncPlayback() {
    window.clearTimeout(timer);
    timer = null;
    const running = wantsPlayback && isVisible && !document.hidden;
    demo.classList.toggle('is-playing', running);
    play.textContent = wantsPlayback ? 'Pause animation' : 'Resume animation';
    status.textContent = wantsPlayback ? 'Follow the cycle, or select a stage to explore.' : 'Paused. Select a stage to explore the loop.';
    // Automatic changes stay quiet for screen readers; manual selections are announced.
    detail.setAttribute('aria-live', wantsPlayback ? 'off' : 'polite');
    if (running) {
      timer = window.setTimeout(() => {
        selectStage(nextStage());
        syncPlayback();
      }, stageDuration);
    }
  }

  function selectManually(index) {
    wantsPlayback = false;
    syncPlayback();
    selectStage(index);
  }

  buttons.forEach((button, index) => button.addEventListener('click', () => selectManually(index)));
  next.hidden = false;
  play.hidden = false;
  next.addEventListener('click', () => selectManually(nextStage()));
  play.addEventListener('click', () => {
    wantsPlayback = !wantsPlayback;
    syncPlayback();
  });

  // Stop the timer when the diagram is off screen, in another section, or in a background tab.
  const visibilityObserver = new IntersectionObserver(entries => {
    isVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.35;
    syncPlayback();
  }, {threshold: 0.35});
  visibilityObserver.observe(demo.querySelector('.flywheel-circle'));
  document.addEventListener('visibilitychange', syncPlayback);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) wantsPlayback = false;
    syncPlayback();
  });
  selectStage(0);
  syncPlayback();
})();
