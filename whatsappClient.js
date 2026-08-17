const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

let sock = null;
let cachedGroups = [];
let isReady = false;

function getIsReady() { return isReady; }
function getAllGroups() {
  return cachedGroups.map(g => ({ id: g.id, name: g.subject }));
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Fleet Agent', 'Chrome', '1.0']
  });

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP\n');
      qrcode.generate(qr, { small: true });
      console.log('\nWhatsApp > Linked Devices > Link a Device\n');
    }

    if (connection === 'close') {
      isReady = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.log('❌ Logged out — delete ./auth_info folder and restart');
      } else {
        console.log('⚠️  Disconnected — reconnecting in 5s...');
        setTimeout(connectToWhatsApp, 5000);
      }
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp connected!');
      try {
        const result = await sock.groupFetchAllParticipating();
        cachedGroups = Object.values(result);
        console.log(`🟢 Fully ready! ${cachedGroups.length} groups loaded.`);
        cachedGroups.forEach(g => console.log(`   • ${g.subject}`));
      } catch (e) {
        console.error('Warning: could not prefetch groups:', e.message);
      }
      isReady = true;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

async function sendToGroup(groupName, message) {
  if (!isReady) throw new Error('WhatsApp not ready yet — wait for 🟢 message');

  const group = cachedGroups.find(
    g => g.subject?.toLowerCase() === groupName.toLowerCase()
  );

  if (!group) {
    const available = cachedGroups.map(g => g.subject).filter(Boolean).join(', ');
    throw new Error(`Group "${groupName}" not found. Available: ${available || 'none'}`);
  }

  await sock.sendMessage(group.id, { text: message });
  console.log(`📤 Sent -> ${group.subject}`);
}

connectToWhatsApp();
module.exports = { getIsReady, sendToGroup, getAllGroups };
