import { beginCell, Cell, Dictionary } from '@ton/core';
import { sha256 } from '@noble/hashes/sha256';

/**
 * TEP-64 On-chain Metadata Builder
 * https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
 * 
 * On-chain layout: 0x00 prefix + dictionary with SHA256 keys
 */

// Pre-computed SHA256 hashes for standard metadata keys
export const ONCHAIN_CONTENT_PREFIX = 0x00;
export const OFFCHAIN_CONTENT_PREFIX = 0x01;

// Standard metadata key hashes (SHA256 of key names)
export const MetadataKeys = {
  name: BigInt('0x' + Buffer.from(sha256('name')).toString('hex')),
  description: BigInt('0x' + Buffer.from(sha256('description')).toString('hex')),
  image: BigInt('0x' + Buffer.from(sha256('image')).toString('hex')),
  image_data: BigInt('0x' + Buffer.from(sha256('image_data')).toString('hex')),
  symbol: BigInt('0x' + Buffer.from(sha256('symbol')).toString('hex')),
  decimals: BigInt('0x' + Buffer.from(sha256('decimals')).toString('hex')),
  uri: BigInt('0x' + Buffer.from(sha256('uri')).toString('hex')),
};

/**
 * Build a snake cell from a buffer
 * Snake format: if data > 127 bytes, split across cells
 */
function makeSnakeCell(data: Buffer): Cell {
  const CELL_MAX_SIZE_BYTES = 127;
  
  if (data.length <= CELL_MAX_SIZE_BYTES) {
    return beginCell().storeBuffer(data).endCell();
  }
  
  // Split into chunks
  let head = beginCell().storeBuffer(data.slice(0, CELL_MAX_SIZE_BYTES));
  let tail = data.slice(CELL_MAX_SIZE_BYTES);
  
  // Recursively build tail cells
  if (tail.length > 0) {
    head.storeRef(makeSnakeCell(tail));
  }
  
  return head.endCell();
}

/**
 * Build on-chain content cell value with 0x00 prefix (snake format)
 */
function buildOnchainValue(value: string): Cell {
  // On-chain values use snake format with no prefix in the value itself
  // The dictionary value is: 0x00 (snake prefix) + data
  const data = Buffer.from(value, 'utf-8');
  
  if (data.length <= 126) {
    // Fits in one cell with prefix
    return beginCell()
      .storeUint(0x00, 8) // Snake format prefix
      .storeBuffer(data)
      .endCell();
  }
  
  // Split into chunks, first chunk is 126 bytes (127 - 1 for prefix)
  const firstChunk = data.slice(0, 126);
  const rest = data.slice(126);
  
  const builder = beginCell()
    .storeUint(0x00, 8) // Snake format prefix
    .storeBuffer(firstChunk);
  
  if (rest.length > 0) {
    builder.storeRef(makeSnakeCell(rest));
  }
  
  return builder.endCell();
}

export interface JettonOnchainMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  image_data?: string; // Base64 encoded image data
  decimals?: number;
}

/**
 * Build on-chain metadata cell for Jetton (TEP-64)
 * 
 * Format: 0x00 + Dictionary<SHA256(key), SnakeCell(value)>
 */
export function buildOnchainMetadataCell(metadata: JettonOnchainMetadata): Cell {
  // Create dictionary with 256-bit keys (SHA256 hashes)
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  
  // Add name (required)
  dict.set(MetadataKeys.name, buildOnchainValue(metadata.name));
  
  // Add symbol (required)
  dict.set(MetadataKeys.symbol, buildOnchainValue(metadata.symbol));
  
  // Add description (optional)
  if (metadata.description) {
    dict.set(MetadataKeys.description, buildOnchainValue(metadata.description));
  }
  
  // Add image URL (optional)
  if (metadata.image) {
    dict.set(MetadataKeys.image, buildOnchainValue(metadata.image));
  }
  
  // Add image_data as base64 (optional) - for on-chain images
  if (metadata.image_data) {
    dict.set(MetadataKeys.image_data, buildOnchainValue(metadata.image_data));
  }
  
  // Add decimals (optional, defaults to 9)
  const decimals = metadata.decimals !== undefined ? metadata.decimals : 9;
  dict.set(MetadataKeys.decimals, buildOnchainValue(decimals.toString()));
  
  // Build final cell: 0x00 prefix + dictionary
  return beginCell()
    .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
    .storeDict(dict)
    .endCell();
}

/**
 * Build off-chain metadata cell (URL to JSON)
 * 
 * Format: 0x01 + URL as snake string
 */
export function buildOffchainMetadataCell(uri: string): Cell {
  const data = Buffer.from(uri, 'utf-8');
  
  if (data.length <= 126) {
    return beginCell()
      .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
      .storeBuffer(data)
      .endCell();
  }
  
  const firstChunk = data.slice(0, 126);
  const rest = data.slice(126);
  
  const builder = beginCell()
    .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
    .storeBuffer(firstChunk);
  
  if (rest.length > 0) {
    builder.storeRef(makeSnakeCell(rest));
  }
  
  return builder.endCell();
}

/**
 * Build message body for changing metadata URL (Jetton 2.0)
 * Opcode: 0xcb862902
 */
export function buildChangeMetadataMessage(newMetadataCell: Cell): Cell {
  return beginCell()
    .storeUint(0xcb862902, 32) // change_metadata_url opcode
    .storeUint(0, 64) // query_id
    .storeRef(newMetadataCell)
    .endCell();
}
