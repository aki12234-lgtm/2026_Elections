// Live count over Firebase Realtime Database.
// Reads window.KALPI_CONFIG.firebase (config.js). Without it the page runs on a local count.
const cfg = (window.KALPI_CONFIG || {}).firebase;

if (cfg && cfg.databaseURL) {
  const V = '10.12.2';
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const { getDatabase, ref, onValue, set, increment } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`);

  const db = getDatabase(initializeApp(cfg));
  const countRef = ref(db, 'votes/count');

  // the database rules only accept "current value + 1", so increment() is the one write that passes
  window.kalpiVote = () => set(countRef, increment(1));
  onValue(countRef, snap => window.kalpiRemote && window.kalpiRemote(Number(snap.val()) || 0));
}
