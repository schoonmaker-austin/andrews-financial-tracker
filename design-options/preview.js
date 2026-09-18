(() => {
  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    setup: '<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    spending: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18m-13 5h3"/>',
    debts: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6m-6 4h6"/>',
    plan: '<path d="M7 4H4v16h16V4h-3M9 3h6v4H9zM8 12h8m-8 4h5"/>'
  };
  document.querySelectorAll('.sidebar [data-nav]').forEach(button => {
    const path = paths[button.dataset.nav];
    if (path) button.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`);
  });
  if (document.documentElement.dataset.design === 'focus') {
    const dashboard = document.querySelector('section[data-view="dashboard"]');
    const numbers = dashboard.querySelector('.numbers-strip');
    const milestone = dashboard.querySelector('.milestone-panel');
    dashboard.insertBefore(numbers, dashboard.querySelector('.next-step-panel'));
    dashboard.append(milestone);
  }
  const heading = document.querySelector('section[data-view="dashboard"] .page-heading');
  const indicator = document.createElement('div');
  indicator.className = 'overview-label';
  indicator.textContent = 'Monthly overview';
  heading.append(indicator);
  // Animation follows user navigation only; information is visible immediately on load.
  document.addEventListener('click', event => {
    const navigation = event.target.closest('[data-nav], [data-nav-jump], #setupNext, #setupBack');
    if (!navigation || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const surface = document.querySelector('.view.is-active');
    if (surface) surface.animate([{ opacity: .65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 190, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
})();
