import { beginCell, Cell, Dictionary } from '@ton/core';
import { sha256 } from '@noble/hashes/sha256';

// TEP-64 content prefixes
const ONCHAIN_CONTENT_PREFIX = 0x00;
const OFFCHAIN_CONTENT_PREFIX = 0x01;
const SNAKE_DATA_PREFIX = 0x00;

// Maximum bytes per cell (1023 bits = 127 bytes, minus 8 bits for snake prefix = 126 bytes for first cell)
const CELL_MAX_SIZE_BYTES = 127;
const FIRST_CELL_MAX_SIZE = 126; // After 1 byte prefix

export interface JettonMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
}

/**
 * Compute SHA256 hash of a string (for dictionary keys)
 */
function sha256Hash(str: string): bigint {
  const hash = sha256(new TextEncoder().encode(str));
  return BigInt('0x' + Buffer.from(hash).toString('hex'));
}

/**
 * Creates a snake cell with SNAKE_DATA_PREFIX (0x00) for dictionary values
 * Data is chunked across cells if needed
 */
function makeSnakeCell(data: Buffer): Cell {
  // If empty, return cell with just prefix
  if (data.length === 0) {
    return beginCell().storeUint(SNAKE_DATA_PREFIX, 8).endCell();
  }
  
  // First cell has prefix + data
  const firstChunkSize = Math.min(data.length, FIRST_CELL_MAX_SIZE);
  const firstChunk = data.subarray(0, firstChunkSize);
  let remaining = data.subarray(firstChunkSize);
  
  // Build continuation cells from end to start
  let tailCell: Cell | null = null;
  
  if (remaining.length > 0) {
    // Split remaining into chunks
    const chunks: Buffer[] = [];
    while (remaining.length > 0) {
      const chunkSize = Math.min(remaining.length, CELL_MAX_SIZE_BYTES);
      chunks.push(remaining.subarray(0, chunkSize));
      remaining = remaining.subarray(chunkSize);
    }
    
    // Build from last to first
    for (let i = chunks.length - 1; i >= 0; i--) {
      const builder = beginCell();
      builder.storeBuffer(chunks[i]);
      if (tailCell) {
        builder.storeRef(tailCell);
      }
      tailCell = builder.endCell();
    }
  }
  
  // Build first cell with prefix
  const builder = beginCell();
  builder.storeUint(SNAKE_DATA_PREFIX, 8);
  builder.storeBuffer(firstChunk);
  if (tailCell) {
    builder.storeRef(tailCell);
  }
  
  return builder.endCell();
}

/**
 * Build on-chain metadata using TEP-64 standard
 * Format: 0x00 prefix + dictionary of sha256(key) -> snake_cell(value)
 * 
 * This is the standard format used by TonWeb and minter.ton.org
 */
export function buildOnchainMetadata(metadata: JettonMetadata): Cell {
  // Create dictionary with 256-bit keys (SHA256 hashes)
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  
  // Add name
  if (metadata.name) {
    const key = sha256Hash('name');
    const value = makeSnakeCell(Buffer.from(metadata.name, 'utf-8'));
    dict.set(key, value);
  }
  
  // Add symbol
  if (metadata.symbol) {
    const key = sha256Hash('symbol');
    const value = makeSnakeCell(Buffer.from(metadata.symbol, 'utf-8'));
    dict.set(key, value);
  }
  
  // Add description
  if (metadata.description) {
    const key = sha256Hash('description');
    const value = makeSnakeCell(Buffer.from(metadata.description, 'utf-8'));
    dict.set(key, value);
  }
  
  // Add image (URL)
  if (metadata.image) {
    const key = sha256Hash('image');
    const value = makeSnakeCell(Buffer.from(metadata.image, 'utf-8'));
    dict.set(key, value);
  }
  
  // Add decimals (as string per TEP-64)
  const decimalsKey = sha256Hash('decimals');
  const decimalsValue = makeSnakeCell(Buffer.from(metadata.decimals.toString(), 'utf-8'));
  dict.set(decimalsKey, decimalsValue);
  
  // Build final content cell with on-chain prefix (0x00)
  return beginCell()
    .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
    .storeDict(dict)
    .endCell();
}

/**
 * Build off-chain metadata (URI to JSON file)
 * Format: 0x01 prefix + URI string as snake data (without additional prefix)
 */
export function buildOffchainMetadata(metadataUri: string): Cell {
  const uriBuffer = Buffer.from(metadataUri, 'utf-8');
  
  // For off-chain, we store: 0x01 + snake data (no additional prefix)
  // This matches TonWeb's createOffchainUriCell
  if (uriBuffer.length <= CELL_MAX_SIZE_BYTES - 1) {
    // Fits in single cell
    return beginCell()
      .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
      .storeBuffer(uriBuffer)
      .endCell();
  }
  
  // Need multiple cells
  const firstChunk = uriBuffer.subarray(0, CELL_MAX_SIZE_BYTES - 1);
  let remaining = uriBuffer.subarray(CELL_MAX_SIZE_BYTES - 1);
  
  // Build continuation cells
  const chunks: Buffer[] = [];
  while (remaining.length > 0) {
    const chunkSize = Math.min(remaining.length, CELL_MAX_SIZE_BYTES);
    chunks.push(remaining.subarray(0, chunkSize));
    remaining = remaining.subarray(chunkSize);
  }
  
  let tailCell: Cell | null = null;
  for (let i = chunks.length - 1; i >= 0; i--) {
    const builder = beginCell();
    builder.storeBuffer(chunks[i]);
    if (tailCell) {
      builder.storeRef(tailCell);
    }
    tailCell = builder.endCell();
  }
  
  const builder = beginCell();
  builder.storeUint(OFFCHAIN_CONTENT_PREFIX, 8);
  builder.storeBuffer(firstChunk);
  if (tailCell) {
    builder.storeRef(tailCell);
  }
  
  return builder.endCell();
}
