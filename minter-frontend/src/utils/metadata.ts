import { beginCell, Cell, Dictionary } from '@ton/core';

// TEP-64 metadata keys
const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

const sha256 = async (str: string): Promise<bigint> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  let hex = '';
  hashArray.forEach(b => hex += b.toString(16).padStart(2, '0'));
  return BigInt('0x' + hex);
};

// Pre-computed SHA256 hashes for standard metadata keys
const METADATA_KEYS = {
  name: BigInt('0x' + '82a3537ff0dbce7eec35d69edc3a189ee6f17d82f353a553f9aa96cb0be3ce89'),
  description: BigInt('0x' + 'c9046f7a37ad0ea7cee73355984fa5428982f8b37c8f7bcec91f7ac71a7cd104'),
  image: BigInt('0x' + '6105d6cc76af400325e94d588ce511be5bfdbb73b437dc51eca43917d7a43e3d'),
  symbol: BigInt('0x' + 'b76a7ca153c24671658335bbd08946350ffc621fa1c516e7123095d4ffd5c581'),
  decimals: BigInt('0x' + 'ee80fd2f1e03480e2282363596ee752d7bb27f50776b95086a0279189675923e'),
  image_data: BigInt('0x' + 'd9a88ccec79eef59c84b671136a20ece4cd00caaad5bc47e2c208829154ee9e4'),
};

function makeSnakeCell(data: string): Cell {
  const bytes = new TextEncoder().encode(data);
  
  if (bytes.length <= 127) {
    return beginCell()
      .storeUint(SNAKE_PREFIX, 8)
      .storeBuffer(Buffer.from(bytes))
      .endCell();
  }
  
  // For longer strings, we need to chain cells
  const chunks: Buffer[] = [];
  let offset = 0;
  const firstChunkSize = 127 - 1; // minus snake prefix
  
  chunks.push(Buffer.from(bytes.slice(0, firstChunkSize)));
  offset = firstChunkSize;
  
  while (offset < bytes.length) {
    const chunkSize = Math.min(127, bytes.length - offset);
    chunks.push(Buffer.from(bytes.slice(offset, offset + chunkSize)));
    offset += chunkSize;
  }
  
  let lastCell: Cell | null = null;
  
  for (let i = chunks.length - 1; i >= 0; i--) {
    const builder = beginCell().storeBuffer(chunks[i]);
    if (lastCell) {
      builder.storeRef(lastCell);
    }
    lastCell = builder.endCell();
  }
  
  return beginCell()
    .storeUint(SNAKE_PREFIX, 8)
    .storeRef(lastCell!)
    .endCell();
}

function makeSnakeCellSimple(data: string): Cell {
  const bytes = new TextEncoder().encode(data);
  return beginCell()
    .storeUint(SNAKE_PREFIX, 8)
    .storeBuffer(Buffer.from(bytes))
    .endCell();
}

export interface JettonMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  decimals: number;
}

export function buildOnchainMetadata(metadata: JettonMetadata): Cell {
  const dict = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
  
  // Name
  if (metadata.name) {
    dict.set(METADATA_KEYS.name, makeSnakeCellSimple(metadata.name));
  }
  
  // Symbol
  if (metadata.symbol) {
    dict.set(METADATA_KEYS.symbol, makeSnakeCellSimple(metadata.symbol));
  }
  
  // Description
  if (metadata.description) {
    dict.set(METADATA_KEYS.description, makeSnakeCellSimple(metadata.description));
  }
  
  // Image
  if (metadata.image) {
    dict.set(METADATA_KEYS.image, makeSnakeCellSimple(metadata.image));
  }
  
  // Decimals
  dict.set(METADATA_KEYS.decimals, makeSnakeCellSimple(metadata.decimals.toString()));
  
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
