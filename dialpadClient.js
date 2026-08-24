async function sendDialpadSMS(message) {
  const toNumbers = process.env.DIALPAD_TO_NUMBER.split(',').map(n => n.trim());

  const response = await fetch('https://dialpad.com/api/v2/sms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DIALPAD_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to_numbers: toNumbers,
      from_number: process.env.DIALPAD_FROM_NUMBER,
      text: message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Dialpad error: ${JSON.stringify(data)}`);
  }

  console.log('Dialpad SMS sent:', data);
  return data;
}

module.exports = { sendDialpadSMS };