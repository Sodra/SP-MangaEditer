const OP_ICONS = {
  file: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="op-icon-spin"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
  process: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="op-icon-spin"><path d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m.366 6.366-2.12-2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-.366-6.366 2.12 2.12"/></svg>`,
  save: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="op-icon-spin"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  download: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="op-icon-spin"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`
};

function OP_createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'op-loading-overlay';
  const content = document.createElement('div');
  content.className = 'op-loading-content';
  const iconContainer = document.createElement('div');
  iconContainer.className = 'op-icon-container';
  const stepText = document.createElement('p');
  stepText.className = 'op-loading-step';
  const subStepText = document.createElement('p');
  subStepText.className = 'op-loading-substep';
  const progressBar = document.createElement('div');
  progressBar.className = 'op-progress-bar';
  const progressBarFill = document.createElement('div');
  progressBarFill.className = 'op-progress-bar-fill';
  progressBar.appendChild(progressBarFill);
  content.appendChild(iconContainer);
  content.appendChild(stepText);
  content.appendChild(subStepText);
  content.appendChild(progressBar);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  return overlay;
}

function OP_updateLoadingState(overlay, {icon = 'process', step = '処理中', substep = '', progress = 0}) {
  const iconContainer = overlay.querySelector('.op-icon-container');
  const stepText = overlay.querySelector('.op-loading-step');
  const subStepText = overlay.querySelector('.op-loading-substep');
  const progressFill = overlay.querySelector('.op-progress-bar-fill');
  iconContainer.innerHTML = OP_ICONS[icon] || OP_ICONS.process;
  stepText.textContent = step;
  subStepText.textContent = substep;
  progressFill.style.width = `${progress}%`;
}

function OP_hideLoading(overlay) {
  if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

function OP_showLoading(options = {}) {
  const overlay = OP_createLoadingOverlay();
  OP_updateLoadingState(overlay, options);
  return overlay;
}

function OP_showLoadingWithIcon(icon) {
  const overlay = OP_showLoading({
      icon: icon,
      step: '処理中',
      substep: 'お待ちください...',
      progress: 50
  });
  setTimeout(() => OP_hideLoading(overlay), 1000*30);
}
