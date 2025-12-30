import { beginCell, Cell, Dictionary, Builder } from '@ton/core';

// TEP-64 On-chain content prefix
const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

// Pre-computed SHA256 hashes for standard metadata keys (TEP-64)
const METADATA_KEYS: { [key: string]: bigint } = {
  name: BigInt('0x82a3537ff0dbce7eec35d69edc3a189ee6f17d82f353a553f9aa96cb0be3ce89'),
  description: BigInt('0xc9046f7a37ad0ea7cee73355984fa5428982f8b37c8f7bcec91f7ac71a7cd104'),
  image: BigInt('0x6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d'),
  symbol: BigInt('0xb76a7ca153c24671658335bbd08946350ffc621fa1c516e7123095d4ffd5c581'),
  decimals: BigInt('0xee80fd2f1e03480e2282363596ee752d7bb27f50776b95086a0279189675923e'),
};

/**
 * Convert string to bytes using TextEncoder (works in browser and Node.js)
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Creates a snake cell for TEP-64 on-chain metadata
 * Format according to TEP-64: snake#00 data:(SnakeData ~n) = ContentData;
 * 
 * The first byte is 0x00 (snake format indicator)
 * followed by the actual data bytes
 */
function makeSnakeCell(data: string): Cell {
  const bytes = stringToBytes(data);
  
  // First cell: 0x00 prefix + up to 126 bytes of data
  const builder = beginCell();
  builder.storeUint(SNAKE_PREFIX, 8);
  
  const firstChunkSize = Math.min(bytes.length, 126);
  for (let i = 0; i < firstChunkSize; i++) {
    builder.storeUint(bytes[i], 8);
  }
  
  // If more data, continue in referenced cells (no prefix in continuation)
  if (bytes.length > 126) {
    builder.storeRef(makeSnakeContinuation(bytes, 126));
  }
  
  return builder.endCell();
}

/**
 * Creates continuation cells for snake data (no prefix)
 */
function makeSnakeContinuation(bytes: Uint8Array, offset: number): Cell {
  const builder = beginCell();
  const remaining = bytes.length - offset;
  const chunkSize = Math.min(remaining, 127);
  
  for (let i = 0; i < chunkSize; i++) {
    builder.storeUint(bytes[offset + i], 8);
  }
  
  if (offset + chunkSize < bytes.length) {
    builder.storeRef(makeSnakeContinuation(bytes, offset + chunkSize));
  }
  
  return builder.endCell();
}

export interface JettonMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
}

export function buildOnchainMetadata(metadata: JettonMetadata): Cell {
  // Create dictionary with 256-bit keys
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  
  // Add name
  if (metadata.name) {
    dict.set(METADATA_KEYS.name, makeSnakeCell(metadata.name));
  }
  
  // Add symbol
  if (metadata.symbol) {
    dict.set(METADATA_KEYS.symbol, makeSnakeCell(metadata.symbol));
  }
  
  // Add description
  if (metadata.description) {
    dict.set(METADATA_KEYS.description, makeSnakeCell(metadata.description));
  }
  
  // Add image
  if (metadata.image) {
    dict.set(METADATA_KEYS.image, makeSnakeCell(metadata.image));
  }
  
  // Add decimals (as string)
  dict.set(METADATA_KEYS.decimals, makeSnakeCell(metadata.decimals.toString()));
  
  // Build final content cell with on-chain prefix
  return beginCell()
    .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
    .storeDict(dict)
    .endCell();
}

export function buildOffchainMetadata(metadataUri: string): Cell {
  return beginCell()
    .storeUint(0x01, 8) // Off-chain prefix
    .storeStringTail(metadataUri)
    .endCell();
}
