require('dotenv').config();
const express = require('express');
const { formatInspectionMessage } = require('./messageFormatter');
const { transformMotivePayload } = require('./motiveClient');
const { sendDialpadSMS } = require('./dialpadClient');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manual test webhook
app.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.action) {
      return res.status(400).json({ error: "Payload must include an 'action' field." });
    }

    const message = await formatInspectionMessage(payload);
    await sendDialpadSMS(message);

    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Motive live webhook
app.post('/motive-webhook', async (req, res) => {
  try {
    const report = req.body;
    console.log('Motive webhook received for:', report.vehicle?.number || report.vehicle_number);

    const defects = report.defects || [];
    if (defects.length === 0) {
      console.log('No defects — no alert sent');
      return res.json({ success: true, message: 'No defects — no alert sent' });
    }

    const payload = transformMotivePayload(report);
    const message = await formatInspectionMessage(payload);
    await sendDialpadSMS(message);

    console.log('Dialpad SMS sent successfully');
    res.json({ success: true, message });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fleet inspection alert agent listening at http://localhost:${PORT}`);
});