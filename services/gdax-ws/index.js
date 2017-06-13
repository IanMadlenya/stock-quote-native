/* eslint-disable prefer-arrow-callback */

const admin = require('firebase-admin');
const WebSocket = require('ws');

const ws = new WebSocket('wss://ws-feed.gdax.com');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://quoteum-fd8e3.firebaseio.com',
});

const db = admin.database();
const ref = db.ref('stream');

const updateStream = (coin, last) => {
  ref.child(coin).update({ last });
};

const pinger = () => {
  return setInterval(() => {
    ws.ping('keepalive');
  }, 30000);
};

const query = {
  type: 'subscribe',
  product_ids: ['BTC-USD', 'ETH-USD'],
};

ws.on('open', function open() {
  ws.send(JSON.stringify(query));
  const start = Date.now();
  console.log('Started: ', start);
  pinger();
});

ws.on('message', function incoming(data) {
  const parsed = JSON.parse(data);
  if (parsed.type === 'match') {
    const priceToNum = parseFloat(parsed.price).toFixed(2);
    updateStream(parsed.product_id, priceToNum);
  }
});

ws.on('close', function close() {
  console.log('Disconnected');
  clearInterval(pinger);
});

ws.on('error', function error(err) {
  console.log('Error: ', err);
});