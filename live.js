// Live count over Firebase Realtime Database.
// Reads window.KALPI_CONFIG.firebase (config.js). Without it the page runs on a local count.
const cfg = (window.KALPI_CONFIG || {}).firebase;
const V = '10.12.2';   // also preloaded in index.html

// The database address depends on the region it was created in. Ask the configured one and the
// US and Belgium defaults at once; the first that answers wins, and its answer is already the count.
async function probe(url) {
  const res = await fetch(`${url}/votes/count.json`, AbortSignal.timeout ? { signal: AbortSignal.timeout(5000) } : {});   // no timeout() before iOS 16
  if (!res.ok) throw new Error(res.status);
  return { url, count: Number(await res.json()) || 0 };
}

if (cfg && cfg.projectId) {
  const id = cfg.projectId;
  const urls = [...new Set([cfg.databaseURL, `https://${id}-default-rtdb.firebaseio.com`, `https://${id}-default-rtdb.europe-west1.firebasedatabase.app`].filter(Boolean))];
  // the SDK downloads while the probe runs
  const sdk = Promise.all([import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`), import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`)]);
  sdk.catch(() => {});
  let found = null;
  try { found = await Promise.any(urls.map(probe)); } catch (e) { /* none answered */ }
  if (!found) {
    console.warn('kalpi: no Realtime Database answered; running on a local count');
    window.kalpiLocal && window.kalpiLocal();
  } else {
    window.kalpiRemote && window.kalpiRemote(found.count);   // the real number now; the live feed follows
    try {
      const [{ initializeApp }, { getDatabase, ref, onValue, set, increment }] = await sdk;
      const db = getDatabase(initializeApp({ ...cfg, databaseURL: found.url }));
      const countRef = ref(db, 'votes/count');
      // the database rules only accept "current value + 1", so increment() is the one write that passes
      window.kalpiVote = () => set(countRef, increment(1));
      onValue(countRef, snap => window.kalpiRemote && window.kalpiRemote(Number(snap.val()) || 0));
      console.info('kalpi: live on', found.url);
    } catch (e) {
      console.warn('kalpi: Firebase SDK did not load; running on a local count', e);
      window.kalpiLocal && window.kalpiLocal();
    }
  }
}
