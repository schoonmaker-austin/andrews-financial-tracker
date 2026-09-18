(() => {
  const descriptions = {
    clarity: ['Clarity', 'Cool whites, precise typography, and a slim sidebar. The easiest everyday workspace, with just enough blue to guide the next action.', 'Best balance of polish and everyday usability.'],
    ledger: ['Ledger', 'Warm paper tones, editorial headings, and navigation across the top. Open space and fine rules give the plan the care of a well-designed financial journal.', 'The most distinctive light option; a little more spacious.'],
    focus: ['Focus', 'Soft charcoal, restrained mint, and a compact overview. Your financial position sits above two focused areas: next steps and your next milestone.', 'Best for people who enjoy dark interfaces, especially in the evening.']
  };
  const preview = document.querySelector('#preview');
  document.querySelectorAll('[data-design]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.design;
    if (button.getAttribute('aria-pressed') === 'true') return;
    document.querySelectorAll('[data-design]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#directionDescription').textContent = descriptions[key][1];
    document.querySelector('#tradeoff').textContent = descriptions[key][2];
    document.querySelector('#openPreview').href = `preview.html?design=${key}&v=final2`;
    preview.title = `${descriptions[key][0]}: working design preview with fictional financial data`;
    preview.src = `preview.html?design=${key}&v=final2`;
  }));
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-size]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#previewStage').classList.toggle('phone', button.dataset.size === 'mobile');
  }));
})();
