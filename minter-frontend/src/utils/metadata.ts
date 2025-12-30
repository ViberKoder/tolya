import { beginCell, Cell, Dictionary } from '@ton/core';

// TEP-64 content prefixes
const ONCHAIN_CONTENT_PREFIX = 0x00;
const OFFCHAIN_CONTENT_PREFIX = 0x01;

// Pre-computed SHA256 hashes for standard metadata keys (TEP-64)
const METADATA_KEYS: { [key: string]: bigint } = {
  name: BigInt('0x82a3537ff0dbce7eec35d69edc3a189ee6f17d82f353a553f9aa96cb0be3ce89'),
  description: BigInt('0xc9046f7a37ad0ea7cee73355984fa5428982f8b37c8f7bcec91f7ac71a7cd104'),
  image: BigInt('0x6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d'),
  symbol: BigInt('0xb76a7ca153c24671658335bbd08946350ffc621fa1c516e7123095d4ffd5c581'),
  decimals: BigInt('0xee80fd2f1e03480e2282363596ee752d7bb27f50776b95086a0279189675923e'),
};

/**
 * Creates a snake cell - data stored in chunks across cells
 * Used for both on-chain dictionary values and off-chain URI
 */
function makeSnakeCell(data: Buffer, includePrefix: boolean = false): Cell {
  const CELL_MAX_SIZE = 127;
  
  const chunks: Buffer[] = [];
  let offset = 0;
  
  // First chunk is smaller if we need prefix
  const firstChunkSize = includePrefix ? CELL_MAX_SIZE - 1 : CELL_MAX_SIZE;
  
  while (offset < data.length) {
    const size = offset === 0 ? Math.min(data.length, firstChunkSize) : Math.min(data.length - offset, CELL_MAX_SIZE);
    chunks.push(data.subarray(offset, offset + size));
    offset += size;
  }
  
  // Build cells from last to first
  let currentCell: Cell | null = null;
  
  for (let i = chunks.length - 1; i >= 0; i--) {
    const builder = beginCell();
    
    // Add prefix only to first cell if requested
    if (i === 0 && includePrefix) {
      builder.storeUint(0x00, 8); // Snake prefix
    }
    
    // Store chunk data
    builder.storeBuffer(chunks[i]);
    
    // Add reference to previous cell if exists
    if (currentCell) {
      builder.storeRef(currentCell);
    }
    
    currentCell = builder.endCell();
  }
  
  return currentCell || beginCell().endCell();
}

export interface JettonMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
}

/**
 * Helper to convert string to Buffer
 */
function toBuffer(str: string): Buffer {
  return Buffer.from(str, 'utf-8');
}

/**
 * Build on-chain metadata using TEP-64 standard
 * Format: 0x00 prefix + dictionary of sha256(key) -> snake_cell(value)
 */
export function buildOnchainMetadata(metadata: JettonMetadata): Cell {
  // Create dictionary with 256-bit keys
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  
  // Add name - with snake prefix (0x00) for TEP-64 compliance
  if (metadata.name) {
    dict.set(METADATA_KEYS.name, makeSnakeCell(toBuffer(metadata.name), true));
  }
  
  // Add symbol
  if (metadata.symbol) {
    dict.set(METADATA_KEYS.symbol, makeSnakeCell(toBuffer(metadata.symbol), true));
  }
  
  // Add description
  if (metadata.description) {
    dict.set(METADATA_KEYS.description, makeSnakeCell(toBuffer(metadata.description), true));
  }
  
  // Add image
  if (metadata.image) {
    dict.set(METADATA_KEYS.image, makeSnakeCell(toBuffer(metadata.image), true));
  }
  
  // Add decimals (as string)
  dict.set(METADATA_KEYS.decimals, makeSnakeCell(toBuffer(metadata.decimals.toString()), true));
  
  // Build final content cell with on-chain prefix (0x00)
  return beginCell()
    .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
    .storeDict(dict)
    .endCell();
}

/**
 * Build off-chain metadata (URI to JSON file)
 * Format: 0x01 prefix + URI string
 */
export function buildOffchainMetadata(metadataUri: string): Cell {
  const uriBuffer = toBuffer(metadataUri);
  
  return beginCell()
    .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
    .storeBuffer(uriBuffer)
    .endCell();
}
