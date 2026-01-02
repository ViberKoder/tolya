import { beginCell, Cell, Dictionary, Builder } from '@ton/core';
import { sha256 } from '@noble/hashes/sha256';

/**
 * TEP-64 On-chain Metadata Builder
 * Based on https://github.com/ton-blockchain/minter-contract
 * https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
 */

const ONCHAIN_CONTENT_PREFIX = 0x00;
const OFFCHAIN_CONTENT_PREFIX = 0x01;
const SNAKE_PREFIX = 0x00;

export type JettonMetaDataKeys = 'name' | 'description' | 'image' | 'symbol' | 'decimals';

const jettonOnChainMetadataSpec: {
  [key in JettonMetaDataKeys]: 'utf8' | 'ascii';
} = {
  name: 'utf8',
  description: 'utf8',
  image: 'ascii',
  symbol: 'utf8',
  decimals: 'utf8',
};

function bufferToChunks(buff: Buffer, chunkSize: number): Buffer[] {
  const chunks: Buffer[] = [];
  while (buff.length > 0) {
    chunks.push(buff.slice(0, chunkSize));
    buff = buff.slice(chunkSize);
  }
  return chunks;
}

function makeSnakeCell(data: Buffer): Cell {
  const chunks = bufferToChunks(data, 127);
  
  if (chunks.length === 0) {
    return beginCell().endCell();
  }
  
  if (chunks.length === 1) {
    return beginCell().storeBuffer(chunks[0]).endCell();
  }
  
  let curCell = beginCell();
  
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    
    if (i === chunks.length - 1) {
      curCell.storeBuffer(chunk);
    } else {
      const nextCell = beginCell().storeBuffer(chunk).storeRef(curCell.endCell());
      curCell = nextCell;
    }
  }
  
  return curCell.endCell();
}

/**
 * Build on-chain metadata cell for Jetton (TEP-64)
 * Matches the format used by minter-contract
 * 
 * Format: 0x00 + Dictionary<SHA256(key), Cell(0x00 + snake_data)>
 */
export function buildOnchainMetadataCell(data: { [s: string]: string | undefined }): Cell {
  const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    
    const encoding = jettonOnChainMetadataSpec[key as JettonMetaDataKeys];
    if (!encoding) {
      console.warn(`Unsupported onchain key: ${key}`);
      return;
    }

    // Create SHA256 hash of the key
    const keyHash = Buffer.from(sha256(key));
    
    // Encode the value
    const valueBuffer = Buffer.from(value, encoding);
    
    // Build the value cell with snake format (0x00 prefix + data)
    const CELL_MAX_SIZE_BYTES = 127; // Max bytes per cell (1023 bits / 8 - 1 for prefix)
    
    if (valueBuffer.length <= CELL_MAX_SIZE_BYTES - 1) {
      // Fits in single cell
      const cell = beginCell()
        .storeUint(SNAKE_PREFIX, 8)
        .storeBuffer(valueBuffer)
        .endCell();
      dict.set(keyHash, cell);
    } else {
      // Need multiple cells - snake format
      let remaining = valueBuffer;
      let rootBuilder = beginCell().storeUint(SNAKE_PREFIX, 8);
      
      // First chunk (126 bytes max because of prefix)
      const firstChunkSize = CELL_MAX_SIZE_BYTES - 1;
      rootBuilder.storeBuffer(remaining.slice(0, firstChunkSize));
      remaining = remaining.slice(firstChunkSize);
      
      // Build chain of cells from the end
      let tailCell: Cell | null = null;
      const chunks: Buffer[] = [];
      while (remaining.length > 0) {
        chunks.push(remaining.slice(0, CELL_MAX_SIZE_BYTES));
        remaining = remaining.slice(CELL_MAX_SIZE_BYTES);
      }
      
      // Build from end to start
      for (let i = chunks.length - 1; i >= 0; i--) {
        const builder = beginCell().storeBuffer(chunks[i]);
        if (tailCell) {
          builder.storeRef(tailCell);
        }
        tailCell = builder.endCell();
      }
      
      if (tailCell) {
        rootBuilder.storeRef(tailCell);
      }
      
      dict.set(keyHash, rootBuilder.endCell());
    }
  });

  // Build final cell: 0x00 prefix + dictionary
  return beginCell()
    .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
    .storeDict(dict)
    .endCell();
}

export interface JettonMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  decimals?: number;
}

/**
 * Create on-chain content cell from metadata object
 */
export function createOnchainContent(metadata: JettonMetadata): Cell {
  return buildOnchainMetadataCell({
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    image: metadata.image,
    decimals: metadata.decimals?.toString(),
  });
}

/**
 * Build off-chain metadata cell (URL to JSON)
 * 
 * Format: 0x01 + URL in snake format
 */
export function buildOffchainMetadataCell(uri: string): Cell {
  const data = Buffer.from(uri, 'utf-8');
  
  if (data.length <= 126) {
    return beginCell()
      .storeUint(OFFCHAIN_CONTENT_PREFIX, 8)
      .storeBuffer(data)
      .endCell();
  }
  
  // For longer URIs, use snake format
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
 * Build message body for changing metadata (Jetton 2.0)
 * Opcode: 0xcb862902 (change_metadata_url)
 */
export function buildChangeMetadataMessage(newMetadataCell: Cell): Cell {
  return beginCell()
    .storeUint(0xcb862902, 32) // change_metadata_url opcode
    .storeUint(0, 64) // query_id
    .storeRef(newMetadataCell)
    .endCell();
}
