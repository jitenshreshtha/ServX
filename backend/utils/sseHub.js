// Robust SSE hub with consistent string keys + helpful logs
const clients = new Map(); // userId(string) -> Set(res)

function addClient(userId, res) {
  const key = String(userId);
  if (!clients.has(key)) clients.set(key, new Set());
  clients.get(key).add(res);
  console.log("[SSE] addClient", { userId: key, listeners: clients.get(key).size });
}

function removeClient(userId, res) {
  const key = String(userId);
  const set = clients.get(key);
  if (set) {
    set.delete(res);
    console.log("[SSE] removeClient", { userId: key, remaining: set.size });
    if (!set.size) clients.delete(key);
  }
}

function push(userId, event, data) {
  const key = String(userId);
  const set = clients.get(key);
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const count = set ? set.size : 0;
  console.log("[SSE] push", { to: key, event, listeners: count });
  if (count === 0) return;
  for (const res of set) res.write(payload);
}

module.exports = { addClient, removeClient, push };
