import { NextRequest, NextResponse } from "next/server";

declare global {
  var otpStore: Map<number, { otp: string; expires: number }> | undefined;
}

if (!global.otpStore) {
  global.otpStore = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json(
        { success: false, message: "Kod OTP diperlukan." },
        { status: 400 }
      );
    }

    const now = Date.now();

    // Check all stored OTPs for a match
    let verified = false;
    let verifiedChatId: number | null = null;

    for (const [chatId, entry] of global.otpStore!.entries()) {
      if (entry.otp === otp && entry.expires > now) {
        verified = true;
        verifiedChatId = chatId;
        // Delete used OTP
        global.otpStore!.delete(chatId);
        break;
      }
    }

    if (verified) {
      return NextResponse.json({
        success: true,
        message: "Pengesahan berjaya!",
        chatId: verifiedChatId,
      });
    } else {
      // Check if OTP exists but expired
      let expired = false;
      for (const [, entry] of global.otpStore!.entries()) {
        if (entry.otp === otp && entry.expires <= now) {
          expired = true;
          break;
        }
      }

      if (expired) {
        return NextResponse.json(
          { success: false, message: "Kod OTP telah tamat tempoh. Sila minta kod baharu." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, message: "Kod OTP tidak sah. Sila cuba lagi." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Ralat sistem. Sila cuba lagi." },
      { status: 500 }
    );
  }
}
