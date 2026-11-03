(async () => {
  try {
    await import('./dist/index.js');
  } catch (err) {
    console.error('API startup failed:', err);
    process.exit(1);
  }
})();
