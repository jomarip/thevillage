import { NextResponse } from "next/server";

/**
 * Next.js API Route: Get Movement/Aptos wallet public key from Privy
 * 
 * This route fetches the public key for a Privy wallet using the Privy Wallet API.
 * It requires server-side execution because it uses the Privy app secret for authentication.
 * 
 * Security Note: In production, you should authorize this endpoint (e.g., verify the caller
 * owns the wallet by verifying Privy tokens). For demo purposes, wallet IDs are typically
 * not exposed broadly, so this is acceptable.
 * 
 * Reference: https://docs.privy.io/api-reference/wallets/create
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function GET(
  _req: Request,
  { params }: { params: { walletId: string } }
) {
  try {
    const PRIVY_APP_ID = requireEnv("NEXT_PUBLIC_PRIVY_APP_ID");
    const PRIVY_APP_SECRET = requireEnv("PRIVY_APP_SECRET");

    const walletId = params.walletId;
    if (!walletId) {
      return NextResponse.json(
        { error: "Missing walletId parameter" },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching public key for wallet: ${walletId.substring(0, 20)}...`);

    // Create Basic Auth header: base64(appId:appSecret)
    const basicAuth = Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString("base64");

    // Fetch wallet from Privy Wallet API
    const response = await fetch(`https://api.privy.io/v1/wallets/${walletId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "privy-app-id": PRIVY_APP_ID,
        "Content-Type": "application/json",
      },
      cache: "no-store", // Don't cache wallet data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Privy API error for wallet ${walletId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      
      // Provide more helpful error messages
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            message: "Invalid Privy app credentials. Please check PRIVY_APP_SECRET.",
          },
          { status: 401 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "Wallet not found",
            message: `Wallet ${walletId} not found in Privy.`,
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        {
          error: "Failed to fetch wallet from Privy",
          details: errorText,
          status: response.status,
        },
        { status: response.status || 500 }
      );
    }

    const wallet = await response.json();

    // Privy returns `public_key` on the wallet object
    const publicKey = wallet.public_key || null;
    
    if (!publicKey) {
      return NextResponse.json(
        { error: "Wallet does not have a public_key" },
        { status: 404 }
      );
    }

    // Normalize public key: Ed25519 public keys must be exactly 32 bytes (64 hex characters)
    // Privy may return it with leading "00" padding or without "0x" prefix
    let normalizedKey = publicKey;
    
    // Remove "0x" prefix if present
    if (normalizedKey.startsWith('0x') || normalizedKey.startsWith('0X')) {
      normalizedKey = normalizedKey.slice(2);
    }
    
    // Ed25519 public keys are exactly 32 bytes = 64 hex characters
    // If Privy returns 66 characters (with leading "00"), take the last 64
    // If it's exactly 64, use it as-is
    // If it's less than 64, pad with leading zeros (shouldn't happen, but handle gracefully)
    if (normalizedKey.length === 64) {
      // Perfect - already the correct length
    } else if (normalizedKey.length === 66) {
      // Common case: leading "00" padding, take the last 64 characters
      normalizedKey = normalizedKey.slice(-64);
    } else if (normalizedKey.length > 64) {
      // Longer than expected - take the last 64 characters
      console.warn(`[API] Public key longer than expected (${normalizedKey.length} chars), taking last 64`);
      normalizedKey = normalizedKey.slice(-64);
    } else if (normalizedKey.length < 64) {
      // Shorter than expected - pad with leading zeros
      console.warn(`[API] Public key shorter than expected (${normalizedKey.length} chars), padding with zeros`);
      normalizedKey = normalizedKey.padStart(64, '0');
    }
    
    // Final validation: must be exactly 64 characters
    if (normalizedKey.length !== 64) {
      console.error(`[API] Public key normalization failed: expected 64, got ${normalizedKey.length}`, {
        original: publicKey,
        originalLength: publicKey.length,
        normalized: normalizedKey,
        normalizedLength: normalizedKey.length,
      });
      return NextResponse.json(
        { 
          error: `Invalid public key format: expected 64 hex characters, got ${normalizedKey.length}`,
          originalLength: publicKey.length,
        },
        { status: 500 }
      );
    }
    
    // Return with 0x prefix for consistency
    return NextResponse.json({ publicKey: `0x${normalizedKey}` });
  } catch (error: any) {
    console.error("Error in /api/privy/wallets/[walletId]/public-key:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
