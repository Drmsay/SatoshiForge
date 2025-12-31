import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from '@bitcoinerlab/secp256k1';
import { ECPairFactory } from 'ecpair';
import type { Wallet } from '../types/types';

const createMnemonic = (): string => {
  const mnemonic = bip39.generateMnemonic();
  if (!mnemonic) throw new Error('Failed to generate mnemonic');
  return mnemonic;
};

const createSeed = (mnemonic: string): Buffer => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  if (!seed || seed.length === 0) throw new Error('Failed to generate seed from mnemonic');
  return seed;
};

const getBitcoinNetwork = () => {
  const network = bitcoin.networks.bitcoin;
  if (!network) throw new Error('Bitcoin network not available');
  return network;
};

const createHDWallet = (seed: Buffer, network: bitcoin.Network) => {
  const bip32 = BIP32Factory(ecc);
  const root = bip32.fromSeed(seed, network);
  if (!root) throw new Error('Failed to generate HD wallet root');
  return root;
};

const deriveWalletPath = (root: ReturnType<typeof createHDWallet>, path: string) => {
  const child = root.derivePath(path);
  if (!child || !child.privateKey) throw new Error('Failed to derive wallet path');
  return { child, privateKey: child.privateKey };
};

const createKeyPair = (privateKey: Buffer, network: bitcoin.Network) => {
  const ECPair = ECPairFactory(ecc);
  const keyPair = ECPair.fromPrivateKey(privateKey, { network });
  if (!keyPair || !keyPair.publicKey) throw new Error('Failed to create key pair');
  return keyPair;
};

const generateAddress = (publicKey: Buffer, network: bitcoin.Network): string => {
  const pubkeyBuffer = Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey);
  if (!pubkeyBuffer || pubkeyBuffer.length === 0) throw new Error('Invalid public key buffer');

  const payment = bitcoin.payments.p2wpkh({ pubkey: pubkeyBuffer, network });
  if (!payment) throw new Error('p2wpkh returned null or undefined');
  if (!payment.address) {
    const errorDetails = {
      hasOutput: !!payment.output,
      hasHash: !!payment.hash,
      pubkeyLength: pubkeyBuffer.length,
      network: network ? network.messagePrefix : 'unknown'
    };
    throw new Error(`Failed to generate Bitcoin address. Details: ${JSON.stringify(errorDetails)}`);
  }

  return payment.address;
};

const convertPrivateKeyToWIF = (keyPair: ReturnType<typeof createKeyPair>): string => {
  const privateKey = keyPair.toWIF();
  if (!privateKey) throw new Error('Failed to convert private key to WIF');
  return privateKey;
};

export const generateBitcoinWallet = (): Wallet => {
  const mnemonic = createMnemonic();
  const seed = createSeed(mnemonic);
  const network = getBitcoinNetwork();
  const root = createHDWallet(seed, network);
  const path = "m/84'/0'/0'/0/0";
  const { privateKey: derivedPrivateKey } = deriveWalletPath(root, path);
  const keyPair = createKeyPair(derivedPrivateKey, network);
  const address = generateAddress(keyPair.publicKey, network);
  const privateKey = convertPrivateKeyToWIF(keyPair);

  return { address, privateKey, mnemonic };
};

