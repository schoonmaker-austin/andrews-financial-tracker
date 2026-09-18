(() => {
  const requested = new URLSearchParams(location.search).get('design');
  const design = ['clarity', 'ledger', 'focus'].includes(requested) ? requested : 'clarity';
  document.documentElement.dataset.design = design;
  document.documentElement.style.colorScheme = design === 'focus' ? 'dark' : 'light';
})();
