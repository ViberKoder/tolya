import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react'

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI()
  const address = useTonAddress()

  return {
    connected: !!address,
    address,
    tonConnectUI,
  }
}
