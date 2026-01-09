/**
 * Movement Network Transaction Signing with Privy (Tier 2 Support)
 * 
 * Implements Privy's Tier 2 pattern for Aptos/Movement:
 * 1. Build transaction using Aptos TS SDK
 * 2. Sign hash using Privy's raw signing (useSignRawHash)
 * 3. Submit transaction using Aptos TS SDK
 * 
 * Reference: https://docs.privy.io/recipes/use-tier-2
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

type PrivySignRawHash = (opts: {
  address: string;
  chainType: 'movement' | 'aptos';
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
  chainType: 'movement' | 'aptos';

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
  const pubkeyHex = opts.senderPublicKeyHex.startsWith('0x')
    ? opts.senderPublicKeyHex
    : `0x${opts.senderPublicKeyHex}`;

  const authenticator = new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(pubkeyHex),
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
