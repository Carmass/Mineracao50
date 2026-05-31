import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tokenFile = path.join(process.cwd(), "..", "..", "scrapers", ".ali_token.json");

  let aliexpress = { configured: false, token_valid: false, expires_at: null as string | null, user: null as string | null };
  let mercadolivre = { configured: false };

  // AliExpress
  const aliAppKey = process.env.ALI_APPKEY || "";
  if (aliAppKey) {
    aliexpress.configured = true;
    if (fs.existsSync(tokenFile)) {
      try {
        const tokenData = JSON.parse(fs.readFileSync(tokenFile, "utf-8"));
        const expiresAt = tokenData.expires_at ?? 0;
        aliexpress.token_valid = expiresAt > Date.now() / 1000;
        aliexpress.expires_at = expiresAt
          ? new Date(expiresAt * 1000).toLocaleDateString("pt-BR")
          : null;
      } catch { /* ignore */ }
    }
  }

  // Mercado Livre
  const mlAppId = process.env.ML_APP_ID || "";
  if (mlAppId) {
    mercadolivre.configured = true;
  }

  return NextResponse.json({ aliexpress, mercadolivre });
}
