import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = "8850263982:AAH5Vc9f0etNybTnd7wJJqllBjg8I-DbUsY";

// Global store for OTP codes: chatId -> { otp, expires }
// In production, use a proper database (Vercel KV, Upstash Redis, etc.)
declare global {
  var otpStore: Map<number, { otp: string; expires: number }> | undefined;
}

if (!global.otpStore) {
  global.otpStore = new Map();
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.trim();

      if (text === "/start" || text.toLowerCase() === "start") {
        // Generate OTP
        const otp = generateOTP();
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Store OTP
        global.otpStore!.set(chatId, { otp, expires });

        // Clean up expired OTPs
        const now = Date.now();
        for (const [key, value] of global.otpStore!.entries()) {
          if (value.expires < now) {
            global.otpStore!.delete(key);
          }
        }

        // Send OTP to user
        await sendTelegramMessage(
          chatId,
          `🔐 *Kod OTP DatoSeriVida Berkongsi*\n\nKod pengesahan anda ialah:\n\n*${otp}*\n\nKod ini sah selama 5 minit. Sila masukkan kod ini di laman web untuk mengesahkan pendaftaran undian anda.\n\nTerima kasih! 🙏`
        );

        return NextResponse.json({ ok: true });
      }

      // Handle other messages
      await sendTelegramMessage(
        chatId,
        "Sila ketik /start untuk mendapatkan kod OTP pengesahan undian. 🙏"
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook is running" });
}
