import fetch from 'node-fetch';

/**
 * WhatsApp Gateway Service (Server-side)
 * This service handles sending messages via a third-party gateway like Sidobe.
 */

export interface WhatsAppPayload {
  target: string; // Phone number(s) separated by comma
  message: string;
  delay?: string; // Delay between messages in seconds
  countryCode?: string; // Default country code
}

export const sendWhatsAppViaGateway = async (payload: WhatsAppPayload) => {
  const apiKey = process.env.WHATSAPP_GATEWAY_TOKEN;
  
  if (!apiKey) {
    console.warn('⚠️ WHATSAPP_GATEWAY_TOKEN is not set. Messages will not be sent.');
    return { success: false, error: 'WhatsApp Gateway Token not configured' };
  }

  try {
    // Using Sidobe as the gateway
    const targets = payload.target.split(',').map(t => t.trim());
    const results = [];

    for (const phone of targets) {
      const response = await fetch('https://api.sidobe.com/v1/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message: payload.message,
        }),
      });

      const result = await response.json();
      results.push({ phone, result });
    }

    return { success: true, results };
  } catch (error: any) {
    console.error('WhatsApp Gateway Error:', error);
    return { success: false, error: error.message };
  }
};
