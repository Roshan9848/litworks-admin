export async function sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<boolean> {
  // Normalize phone number (ensure country code e.g. 91 for India is prepended if missing, remove spaces/dashes)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  if (cleanNumber.length === 10) {
    cleanNumber = "91" + cleanNumber; // Default to India country code
  }

  const metaToken = process.env.WHATSAPP_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const metaTemplate = process.env.WHATSAPP_TEMPLATE_NAME || "otp_verification";

  const ultraMsgInstance = process.env.WHATSAPP_ULTRAMSG_INSTANCE;
  const ultraMsgToken = process.env.WHATSAPP_ULTRAMSG_TOKEN;

  const messageText = `🔑 Your LITWORKS Admin login passcode is: ${otp}. Valid for 10 minutes.`;

  // 1. Meta WhatsApp Business Cloud API
  if (metaToken && metaPhoneId) {
    try {
      console.log(`[WhatsApp] Sending Meta Cloud API OTP to ${cleanNumber}...`);
      const res = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanNumber,
          type: "template",
          template: {
            name: metaTemplate,
            language: {
              code: "en",
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: otp,
                  },
                ],
              },
            ],
          },
        }),
      });

      const data: any = await res.json();
      if (res.ok && (data.messages || data.success)) {
        console.log(`[WhatsApp] Meta Cloud API sent successfully:`, data);
        return true;
      }
      console.error(`[WhatsApp] Meta Cloud API failed:`, data);
    } catch (e) {
      console.error(`[WhatsApp] Error calling Meta Cloud API:`, e);
    }
  }

  // 2. UltraMsg Gateway (Direct chat API - great for non-template notifications)
  if (ultraMsgInstance && ultraMsgToken) {
    try {
      console.log(`[WhatsApp] Sending UltraMsg OTP to ${cleanNumber}...`);
      const params = new URLSearchParams();
      params.append("token", ultraMsgToken);
      params.append("to", cleanNumber);
      params.append("body", messageText);

      const res = await fetch(`https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`, {
        method: "POST",
        body: params,
      });

      const data: any = await res.json();
      if (res.ok && data.sent === "true") {
        console.log(`[WhatsApp] UltraMsg sent successfully:`, data);
        return true;
      }
      console.error(`[WhatsApp] UltraMsg failed:`, data);
    } catch (e) {
      console.error(`[WhatsApp] Error calling UltraMsg:`, e);
    }
  }

  // 3. Mock Mode / Development Console Fallback
  console.log(`
┌────────────────────────────────────────────────────────┐
│  [MOCK WHATSAPP SEND]                                  │
│  To: ${cleanNumber}                                     │
│  OTP Access Key: ${otp}                                │
│  Text: ${messageText}                                  │
│                                                        │
│  To enable real WhatsApp delivery, configure your      │
│  Meta Cloud API or UltraMsg credentials in env.        │
└────────────────────────────────────────────────────────┘
  `);

  return true;
}
