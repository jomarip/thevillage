/**
 * Movement Network Transaction Signing with Privy (Tier 2 Support)
 * 
 * Implements Privy's Tier 2 pattern for Aptos/Movement:
 * 1. Build transaction using Aptos TS SDK
 * 2. Sign hash using Privy's raw signing (useSignRawHash)
 * 3. Submit transaction using Aptos TS SDK
 * 
 * Reference: https://docs.privy.io/guides/wallets/using-wallets/other-chains
 * Movement-specific: https://docs.privy.io/guides/wallets/using-wallets/other-chains#movement
 * 
 * Note: useSignRawHash from @privy-io/react-auth/extended-chains automatically
 * handles wallet ID lookup based on the address provided. This matches the server-side
 * pattern: privy.wallets().rawSign(walletId, {params: {hash: toHex(message)}})
 */

import {
  Aptos,
  AptosConfig,
  Network,
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
  generateSigningMessageForTransaction,
} from '@aptos-labs/ts-sdk';
import { toHex } from 'viem';
import { MOVEMENT_REST_URL } from './config';

// Privy's useSignRawHash from React SDK - note that the actual implementation
// may support Movement/Aptos even if TypeScript types don't reflect it
// We use a flexible type to work with Privy's React SDK
type PrivySignRawHash = (opts: {
  address: string;
  chainType: string; // Privy React SDK may support 'aptos' for Movement even if types don't show it
  hash: `0x${string}`;
}) => Promise<{ signature: `0x${string}` }>;

/**
 * Builds + signs + submits an Aptos/Movement entry function tx using:
 * - Aptos TS SDK for building + broadcasting
 * - Privy raw signing for the signature (Tier 2 flow)
 * 
 * @param opts Configuration for the transaction
 * @returns Transaction hash
 */
export async function signAndSubmitMovementEntryFunction(opts: {
  // Movement testnet fullnode URL
  fullnodeUrl?: string;

  senderAddress: string;          // 0x...
  senderPublicKeyHex: string;     // 32-byte hex, usually 0x...
  chainType: 'aptos'; // Movement uses 'aptos' chainType in Privy (Movement follows Aptos standards)

  signRawHash: PrivySignRawHash;

  functionId: string;             // `${moduleAddr}::module::function`
  functionArgs?: any[];
  typeArgs?: string[];
}): Promise<string> {
  const fullnodeUrl = opts.fullnodeUrl ?? MOVEMENT_REST_URL;

  const aptos = new Aptos(
    new AptosConfig({
      network: Network.CUSTOM,
      fullnode: fullnodeUrl,
    })
  );

  // 1) Build transaction
  const tx = await aptos.transaction.build.simple({
    sender: opts.senderAddress,
    data: {
      function: opts.functionId,
      typeArguments: opts.typeArgs ?? [],
      functionArguments: opts.functionArgs ?? [],
    },
  });

  // 2) Compute signing message and sign via Privy (Tier 2 raw sign)
  const signingMsg = generateSigningMessageForTransaction(tx);
  const hash = toHex(signingMsg) as `0x${string}`;

  const { signature } = await opts.signRawHash({
    address: opts.senderAddress,
    chainType: opts.chainType,
    hash,
  });

  // 3) Create authenticator + submit
  // Normalize public key: Ed25519 requires exactly 32 bytes (64 hex chars after 0x)
  let pubkeyHex = opts.senderPublicKeyHex.startsWith('0x')
    ? opts.senderPublicKeyHex.slice(2) // Remove 0x to work with raw hex
    : opts.senderPublicKeyHex;
  
  // Ed25519 public keys are exactly 32 bytes = 64 hex characters
  // Handle different lengths that Privy might return
  if (pubkeyHex.length === 64) {
    // Perfect - already the correct length
  } else if (pubkeyHex.length === 66) {
    // Common case: leading "00" padding, take the last 64 characters
    pubkeyHex = pubkeyHex.slice(-64);
  } else if (pubkeyHex.length > 64) {
    // Longer than expected - take the last 64 characters
    console.warn(`[movementPrivyTx] Public key longer than expected (${pubkeyHex.length} chars), taking last 64`);
    pubkeyHex = pubkeyHex.slice(-64);
  } else if (pubkeyHex.length < 64) {
    // Shorter than expected - pad with leading zeros
    console.warn(`[movementPrivyTx] Public key shorter than expected (${pubkeyHex.length} chars), padding with zeros`);
    pubkeyHex = pubkeyHex.padStart(64, '0');
  }
  
  // Final validation: must be exactly 64 characters
  if (pubkeyHex.length !== 64) {
    throw new Error(
      `Invalid public key length: expected 64 hex characters (32 bytes), got ${pubkeyHex.length}. ` +
      `Original: ${opts.senderPublicKeyHex.substring(0, 30)}...`
    );
  }
  
  // Add 0x prefix for Ed25519PublicKey constructor
  const normalizedPubkeyHex = `0x${pubkeyHex}`;

  const authenticator = new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(normalizedPubkeyHex),
    // Privy returns 0x-prefixed signature; Aptos SDK wants raw hex
    new Ed25519Signature(signature.slice(2))
  );

  const pending = await aptos.transaction.submit.simple({
    transaction: tx,
    senderAuthenticator: authenticator,
  });

  // Wait for confirmation
  await aptos.waitForTransaction({ transactionHash: pending.hash });

  return pending.hash;
}
