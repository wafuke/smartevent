/**
 * Africa's Talking SMS gateway service.
 *
 * Modes (auto-detected from environment):
 *   LIVE        AT_USERNAME is your app username and AT_API_KEY is set  -> https://api.africastalking.com
 *   SANDBOX     AT_USERNAME=sandbox and AT_API_KEY is a sandbox key     -> https://api.sandbox.africastalking.com
 *               (real API call; messages appear in the AT simulator, not on a real phone)
 *   SIMULATION  no AT_API_KEY                                           -> nothing leaves this server
 */
const axios = require('axios');

const CHUNK_SIZE = 100;
const COST_PER_SEGMENT = parseFloat(process.env.SMS_COST_PER_SEGMENT || '0.8');

// https://developers.africastalking.com/docs/sms/sending/bulk - statusCode meaning
const AT_STATUS = {
  100: 'PROCESSED', 101: 'SENT', 102: 'QUEUED',
  401: 'FAILED', 402: 'FAILED', 403: 'FAILED', 404: 'FAILED', 405: 'FAILED',
  406: 'FAILED', 407: 'FAILED', 500: 'FAILED', 501: 'FAILED', 502: 'FAILED'
};
const AT_REASON = {
  401: 'Risk hold', 402: 'Invalid sender ID', 403: 'Invalid phone number', 404: 'Unsupported number type',
  405: 'Insufficient Africa\'s Talking balance', 406: 'Recipient is blacklisted / opted out',
  407: 'Could not route to the network', 500: 'Gateway internal error', 501: 'Gateway error', 502: 'Rejected by gateway'
};

function getConfig() {
  const username = (process.env.AT_USERNAME || '').trim();
  const apiKey = (process.env.AT_API_KEY || '').trim();
  const senderId = (process.env.AT_SENDER_ID || '').trim();
  let mode = 'SIMULATION';
  if (apiKey && username) mode = username === 'sandbox' ? 'SANDBOX' : 'LIVE';
  const host = mode === 'SANDBOX' ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com';
  return { mode, username, apiKey, senderId, host };
}

/** Rough segment count: 160 chars (GSM-7) / 70 chars (Unicode, e.g. emoji). */
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
 * @returns {Promise<{mode:string, results:Array<{phone,status,messageId,cost,reason}>}>}
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
        reason: 'No AT_API_KEY configured - message was not sent to a real handset.'
      }))
    };
  }

  const results = [];
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
          messageId: r.messageId && r.messageId !== 'None' ? r.messageId : null,
          cost: r.cost || null,
          reason: status === 'FAILED' ? AT_REASON[r.statusCode] || r.status : null
        });
      });
    } catch (err) {
      const detail = (err.response && (err.response.data && (err.response.data.message || JSON.stringify(err.response.data)))) || err.message;
      const authProblem = err.response && [401, 403].includes(err.response.status);
      chunk.forEach((phone) =>
        results.push({
          phone,
          status: 'FAILED',
          messageId: null,
          cost: null,
          reason: authProblem ? "Africa's Talking rejected the API key / username." : `Gateway request failed: ${String(detail).slice(0, 160)}`
        })
      );
    }
  }
  return { mode: cfg.mode, results };
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

module.exports = { getConfig, sendBulk, getBalance, estimateSegments, estimateCost };
