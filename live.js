// Live count over Firebase Realtime Database.
// Reads window.KALPI_CONFIG.firebase (config.js). Without it the page runs on a local count.
const cfg = (window.KALPI_CONFIG || {}).firebase;

// The database address depends on the region it was created in. Try the configured one first,
// then the US and Belgium defaults, and use whichever answers (the count is public to read).
async function findDatabase() {
  const id = cfg.projectId;
  const urls = [...new Set([cfg.databaseURL, `https://${id}-default-rtdb.firebaseio.com`, `https://${id}-default-rtdb.europe-west1.firebasedatabase.app`].filter(Boolean))];
  for (const url of urls) {
    try {
      const res = await fetch(`${url}/votes/count.json`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return url;
    } catch (e) { /* next */ }
  }
  return null;
}

if (cfg && cfg.projectId) {
  const databaseURL = await findDatabase();
  if (!databaseURL) {
    console.warn('kalpi: no Realtime Database answered; running on a local count');
  } else {
    const V = '10.12.2';
    const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
    const { getDatabase, ref, onValue, set, increment } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`);

    const db = getDatabase(initializeApp({ ...cfg, databaseURL }));
    const countRef = ref(db, 'votes/count');

    // the database rules only accept "current value + 1", so increment() is the one write that passes
    window.kalpiVote = () => set(countRef, increment(1));
    onValue(countRef, snap => window.kalpiRemote && window.kalpiRemote(Number(snap.val()) || 0));
    console.info('kalpi: live on', databaseURL);
  }
}
