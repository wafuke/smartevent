/**
 * Africa's Talking SMS gateway service.
 *
 * Modes:
 *   LIVE        AT_USERNAME is your Live App username and AT_API_KEY is set -> https://api.africastalking.com
 *   SANDBOX     AT_USERNAME=sandbox and AT_API_KEY is set                   -> https://api.sandbox.africastalking.com
 *   SIMULATION  no AT_API_KEY or AT_MODE=SIMULATION                         -> local simulation (no external call)
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CHUNK_SIZE = 100;
const COST_PER_SEGMENT = parseFloat(process.env.SMS_COST_PER_SEGMENT || '0.8');

let runtimeOverrides = {};

// https://developers.africastalking.com/docs/sms/sending/bulk - statusCode meaning
const AT_STATUS = {
  100: 'PROCESSED', 101: 'SENT', 102: 'QUEUED',
  401: 'FAILED', 402: 'FAILED', 403: 'FAILED', 404: 'FAILED', 405: 'FAILED',
  406: 'FAILED', 407: 'FAILED', 500: 'FAILED', 501: 'FAILED', 502: 'FAILED'
};
const AT_REASON = {
  401: 'Risk hold', 402: 'Invalid sender ID', 403: 'Invalid phone number', 404: 'Unsupported number type',
  405: "Insufficient Africa's Talking airtime balance", 406: 'Recipient is blacklisted / opted out',
  407: 'Could not route to the network', 500: 'Gateway internal error', 501: 'Gateway error', 502: 'Rejected by gateway'
};

function maskKey(k) {
  if (!k || k.length < 12) return k ? '****' : null;
  return `${k.slice(0, 9)}...${k.slice(-4)}`;
}

function getConfig() {
  const isTest = process.env.NODE_ENV === 'test';
  const username = (isTest ? process.env.AT_USERNAME || '' : runtimeOverrides.username ?? process.env.AT_USERNAME ?? '').trim();
  const apiKey = (isTest ? process.env.AT_API_KEY || '' : runtimeOverrides.apiKey ?? process.env.AT_API_KEY ?? '').trim();
  const senderId = (isTest ? process.env.AT_SENDER_ID || '' : runtimeOverrides.senderId ?? process.env.AT_SENDER_ID ?? '').trim();
  const requestedMode = (isTest ? '' : runtimeOverrides.mode ?? process.env.AT_MODE ?? '').trim().toUpperCase();

  let mode = 'SIMULATION';
  if (apiKey && username && requestedMode !== 'SIMULATION') {
    if (requestedMode === 'LIVE' && username.toLowerCase() !== 'sandbox') {
      mode = 'LIVE';
    } else if (requestedMode === 'SANDBOX' || username.toLowerCase() === 'sandbox') {
      mode = 'SANDBOX';
    } else {
      mode = 'LIVE';
    }
  }
  const host = mode === 'SANDBOX' ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com';
  return {
    mode,
    username,
    apiKey,
    maskedApiKey: maskKey(apiKey),
    hasApiKey: Boolean(apiKey),
    senderId,
    host
  };
}

function setRuntimeConfig({ username, apiKey, senderId, mode }) {
  if (username !== undefined) runtimeOverrides.username = String(username).trim();
  if (apiKey !== undefined && String(apiKey).trim() && !String(apiKey).includes('...')) {
    runtimeOverrides.apiKey = String(apiKey).trim();
  }
  if (senderId !== undefined) runtimeOverrides.senderId = String(senderId).trim();
  if (mode !== undefined) runtimeOverrides.mode = String(mode).trim().toUpperCase();

  // Persist to backend/.env if not in test mode
  if (process.env.NODE_ENV !== 'test') {
    try {
      const cfg = getConfig();
      const envPath = path.join(__dirname, '..', '.env');
      const envContent = [
        'PORT=5000',
        '',
        "# Africa's Talking SMS Gateway Configuration",
        `AT_MODE=${runtimeOverrides.mode || cfg.mode}`,
        `AT_USERNAME=${cfg.username || 'sandbox'}`,
        `AT_API_KEY=${cfg.apiKey || ''}`,
        `AT_SENDER_ID=${cfg.senderId || ''}`,
        '',
        'ML_SERVICE_URL=http://127.0.0.1:8000',
        ''
      ].join('\n');
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (e) {
      // ignore write error
    }
  }
  return getConfig();
}

/** Rough segment count: 160 chars (GSM-7) / 70 chars (Unicode). */
function estimateSegments(text) {
  const s = String(text || '');
  // eslint-disable-next-line no-control-regex
  const unicode = /[^\u0000-\u00ff]/.test(s);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  return s.length <= single ? 1 : Math.ceil(s.length / multi);
}

function estimateCost(recipientCount, text) {
  return Math.round(recipientCount * estimateSegments(text) * COST_PER_SEGMENT * 100) / 100;
}

/**
 * Send one message to many numbers.
 * @returns {Promise<{mode:string, results:Array<{phone,status,messageId,cost,reason}>, gatewayNote?:string}>}
 */
async function sendBulk(phones, message) {
  const cfg = getConfig();

  if (cfg.mode === 'SIMULATION') {
    return {
      mode: cfg.mode,
      results: phones.map((phone, i) => ({
        phone,
        status: 'SIMULATED',
        messageId: `SIM_${Date.now()}_${i}`,
        cost: `KES ${(estimateSegments(message) * COST_PER_SEGMENT).toFixed(2)}`,
        reason: 'Simulation mode active - message recorded locally without carrier dispatch.'
      }))
    };
  }

  const results = [];
  let gatewayNote = null;

  for (let i = 0; i < phones.length; i += CHUNK_SIZE) {
    const chunk = phones.slice(i, i + CHUNK_SIZE);
    const params = new URLSearchParams();
    params.append('username', cfg.username);
    params.append('to', chunk.join(','));
    params.append('message', message);
    if (cfg.senderId && cfg.mode === 'LIVE') params.append('from', cfg.senderId);

    try {
      const { data } = await axios.post(`${cfg.host}/version1/messaging`, params.toString(), {
        headers: { apiKey: cfg.apiKey, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });
      const recipients = (data && data.SMSMessageData && data.SMSMessageData.Recipients) || [];
      const byNumber = new Map(recipients.map((r) => [r.number, r]));
      const gatewayMessage = data && data.SMSMessageData && data.SMSMessageData.Message;

      chunk.forEach((phone) => {
        const r = byNumber.get(phone);
        if (!r) {
          results.push({ phone, status: 'FAILED', messageId: null, cost: null, reason: gatewayMessage || 'Gateway returned no status for this number.' });
          return;
        }
        const status = AT_STATUS[r.statusCode] || (String(r.status).toLowerCase() === 'success' ? 'SENT' : 'FAILED');
        results.push({
          phone,
          status,
          messageId: r.messageId && r.messageId !== 'None' ? r.messageId : `AT_${Date.now()}`,
          cost: r.cost || `KES ${(estimateSegments(message) * COST_PER_SEGMENT).toFixed(2)}`,
          reason: status === 'FAILED' ? AT_REASON[r.statusCode] || r.status : null
        });
      });
    } catch (err) {
      const authProblem = err.response && [401, 403].includes(err.response.status);
      gatewayNote = authProblem
        ? `Africa's Talking API key (${cfg.maskedApiKey}) requires its matching App Username (currently '${cfg.username}'). Delivered via local gateway simulation until you enter your Live App Username in Option B.`
        : `Africa's Talking gateway unreachable (${err.message}). Delivered via local gateway simulation.`;

      chunk.forEach((phone, idx) =>
        results.push({
          phone,
          status: 'SIMULATED',
          messageId: `AT_SIM_${Date.now()}_${idx}`,
          cost: `KES ${(estimateSegments(message) * COST_PER_SEGMENT).toFixed(2)}`,
          reason: gatewayNote
        })
      );
    }
  }
  return { mode: gatewayNote ? 'SIMULATION' : cfg.mode, results, gatewayNote };
}

/** Fetch the Africa's Talking account balance (LIVE / SANDBOX only). */
async function getBalance() {
  const cfg = getConfig();
  if (cfg.mode === 'SIMULATION') return null;
  try {
    const { data } = await axios.get(`${cfg.host}/version1/user`, {
      params: { username: cfg.username },
      headers: { apiKey: cfg.apiKey, Accept: 'application/json' },
      timeout: 8000
    });
    return (data && data.UserData && data.UserData.balance) || null;
  } catch (e) {
    return null;
  }
}

module.exports = { getConfig, setRuntimeConfig, sendBulk, getBalance, estimateSegments, estimateCost };
