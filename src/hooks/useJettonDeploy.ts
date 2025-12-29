import { useState } from 'react'
import { useTonConnect } from './useTonConnect'
import { Address, beginCell, Cell, toNano } from '@ton/core'
import { JettonMinter } from '@/lib/JettonMinter'

interface JettonFormData {
  name: string
  symbol: string
  decimals: number
  description: string
  imageUrl: string
  totalSupply: string
  mintable: boolean
}

type DeploymentStatus = 'idle' | 'preparing' | 'deploying' | 'minting' | 'success' | 'error'

export function useJettonDeploy() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<DeploymentStatus>('idle')
  const [error, setError] = useState<string>()
  const [contractAddress, setContractAddress] = useState<string>()
  const { tonConnectUI, address } = useTonConnect()

  const deploy = async (formData: JettonFormData) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setStatus('preparing')
    setError(undefined)
    setContractAddress(undefined)
    
    try {
      // Create jetton content
      const content = createJettonContent(formData)
      
      setStatus('deploying')
      
      // Create init data for minter
      const minterData = beginCell()
        .storeAddress(Address.parse(address)) // admin
        .storeCoins(0) // total supply (will be minted)
        .storeRef(content) // jetton content
        .storeBit(formData.mintable) // mintable
        .endCell()

      // Get minter code (you'll need to load this from compiled contract)
      const minterCode = await JettonMinter.getMinterCode()
      
      // Create state init
      const stateInit = beginCell()
        .storeBit(0) // split_depth
        .storeBit(0) // special
        .storeBit(1) // code
        .storeRef(minterCode)
        .storeBit(1) // data
        .storeRef(minterData)
        .storeBit(0) // library
        .endCell()

      // Calculate contract address
      const contractAddress = new Address(0, stateInit.hash())

      // Create deployment message
      const deployMessage = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: contractAddress.toString(),
            amount: toNano('0.5').toString(),
            stateInit: stateInit.toBoc().toString('base64'),
            payload: beginCell().endCell().toBoc().toString('base64'),
          }
        ]
      }

      // Send transaction
      const result = await tonConnectUI.sendTransaction(deployMessage)
      
      console.log('Deployment result:', result)
      console.log('Contract address:', contractAddress.toString())
      
      setContractAddress(contractAddress.toString())

      // If initial supply > 0, mint tokens
      if (parseFloat(formData.totalSupply) > 0) {
        setStatus('minting')
        await mintTokens(contractAddress.toString(), formData.totalSupply, formData.decimals)
      }

      setStatus('success')
      
      return {
        success: true,
        address: contractAddress.toString(),
      }
    } catch (err) {
      console.error('Deployment error:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Failed to deploy jetton')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const mintTokens = async (minterAddress: string, amount: string, decimals: number) => {
    if (!address) return

    const mintAmount = BigInt(parseFloat(amount) * Math.pow(10, decimals))

    const mintBody = beginCell()
      .storeUint(0x15, 32) // op::mint
      .storeUint(0, 64) // query_id
      .storeCoins(mintAmount)
      .storeAddress(Address.parse(address)) // owner
      .storeBit(0) // response_destination
      .storeBit(0) // custom_payload
      .storeCoins(toNano('0.05')) // forward_ton_amount
      .storeRef(beginCell().endCell()) // forward_payload
      .endCell()

    const mintMessage = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [
        {
          address: minterAddress,
          amount: toNano('0.1').toString(),
          payload: mintBody.toBoc().toString('base64'),
        }
      ]
    }

    await tonConnectUI.sendTransaction(mintMessage)
  }

  return {
    deploy,
    isLoading,
    status,
    error,
    contractAddress,
  }
}

function createJettonContent(formData: JettonFormData): Cell {
  // Create metadata dictionary
  const contentDict = beginCell()
  
  // Store name
  const nameCell = beginCell()
    .storeUint(0, 8) // snake format
    .storeStringTail(formData.name)
    .endCell()
  
  // Store symbol  
  const symbolCell = beginCell()
    .storeUint(0, 8)
    .storeStringTail(formData.symbol)
    .endCell()
  
  // Store decimals
  const decimalsCell = beginCell()
    .storeUint(0, 8)
    .storeStringTail(formData.decimals.toString())
    .endCell()

  // Store description if provided
  let descriptionCell: Cell | undefined
  if (formData.description) {
    descriptionCell = beginCell()
      .storeUint(0, 8)
      .storeStringTail(formData.description)
      .endCell()
  }

  // Store image URL if provided
  let imageCell: Cell | undefined
  if (formData.imageUrl) {
    imageCell = beginCell()
      .storeUint(0, 8)
      .storeStringTail(formData.imageUrl)
      .endCell()
  }

  // Build dictionary (simplified version)
  // In production, you'd use proper dictionary building
  const content = beginCell()
    .storeUint(0, 8) // onchain content marker
    .storeRef(nameCell)
    .storeRef(symbolCell)
    .storeRef(decimalsCell)
    .endCell()

  return content
}
