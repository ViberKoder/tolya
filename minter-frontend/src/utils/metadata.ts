import { beginCell, Cell, Dictionary } from '@ton/core';

// TEP-64 On-chain content prefix
const ONCHAIN_CONTENT_PREFIX = 0x00;

// Pre-computed SHA256 hashes for standard metadata keys (TEP-64)
const METADATA_KEYS: { [key: string]: bigint } = {
  name: BigInt('0x82a3537ff0dbce7eec35d69edc3a189ee6f17d82f353a553f9aa96cb0be3ce89'),
  description: BigInt('0xc9046f7a37ad0ea7cee73355984fa5428982f8b37c8f7bcec91f7ac71a7cd104'),
  image: BigInt('0x6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d'),
  symbol: BigInt('0xb76a7ca153c24671658335bbd08946350ffc621fa1c516e7123095d4ffd5c581'),
  decimals: BigInt('0xee80fd2f1e03480e2282363596ee752d7bb27f50776b95086a0279189675923e'),
};

// Create a snake cell for TEP-64 metadata (without prefix in dictionary values)
function makeSnakeCell(data: string): Cell {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  
  // TEP-64 specifies snake format: data is split across cells if needed
  // Each cell can hold up to 127 bytes (1023 bits / 8)
  const MAX_BYTES_PER_CELL = 127;
  
  function createSnakeCells(data: Uint8Array, offset: number = 0): Cell {
    const builder = beginCell();
    const remainingBytes = data.length - offset;
    const bytesToWrite = Math.min(remainingBytes, MAX_BYTES_PER_CELL);
    
    // Write bytes to current cell
    for (let i = 0; i < bytesToWrite; i++) {
      builder.storeUint(data[offset + i], 8);
    }
    
    // If there's more data, create a reference to the next cell
    if (offset + bytesToWrite < data.length) {
      builder.storeRef(createSnakeCells(data, offset + bytesToWrite));
    }
    
    return builder.endCell();
  }
  
  return createSnakeCells(bytes);
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
