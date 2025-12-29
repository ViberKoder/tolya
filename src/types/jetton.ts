export interface JettonMetadata {
  name: string
  symbol: string
  decimals: number
  description?: string
  image?: string
}

export interface JettonData {
  totalSupply: bigint
  mintable: boolean
  adminAddress: string
  content: JettonMetadata
  jettonWalletCode: string
}

export interface JettonWalletData {
  balance: bigint
  owner: string
  jetton: string
  jettonWalletCode: string
}
