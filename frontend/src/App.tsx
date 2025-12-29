import { useState } from 'react'
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import styled, { createGlobalStyle } from 'styled-components';
import { Address, beginCell, toNano, Cell, Dictionary, BitBuilder, DictionaryValue } from '@ton/core';
import { JETTON_MINTER_CODE, JETTON_WALLET_CODE } from './contracts';
import { sha256 } from '@ton/crypto';
import { Buffer } from 'buffer';

// Polyfill Buffer
window.Buffer = window.Buffer || Buffer;

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #f1f3f5;
    color: #000;
    font-family: 'Mulish', sans-serif;
    margin: 0;
    padding: 0;
  }
`;

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60px;
`;

const Logo = styled.div`
  font-weight: 800;
  font-size: 24px;
  color: #0098EA;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h2`
  margin-top: 0;
  font-size: 32px;
  margin-bottom: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #506173;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #E3E8EC;
  font-size: 16px;
  transition: border-color 0.2s;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #0098EA;
  }
`;

const Button = styled.button`
  background-color: #0098EA;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  width: 100%;
  margin-top: 20px;

  &:hover {
    background-color: #0084CC;
  }
  
  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #B0C4DB;
    cursor: not-allowed;
  }
`;

const ONCHAIN_CONTENT_PREFIX = 0x00;
const SNAKE_PREFIX = 0x00;

const makeSnakeCell = (data: Buffer): Cell => {
  const chunks = [];
  const buffer = data;
  const index = 0;
  for (let i = 0; i < buffer.length; i += 127) {
      chunks.push(buffer.slice(i, i + 127));
  }
  if (chunks.length === 0) {
      return beginCell().storeUint(SNAKE_PREFIX, 8).endCell();
  }
  
  let curCell = beginCell();
  curCell.storeUint(SNAKE_PREFIX, 8);
  curCell.storeBuffer(chunks[0]);
  if (chunks.length > 1) {
    let nextCell = curCell;
    for (let i = 1; i < chunks.length; i++) {
        const b = beginCell();
        b.storeBuffer(chunks[i]);
        nextCell.storeRef(b);
        nextCell = b;
    }
  }
  return curCell.endCell();
}

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    decimals: '9',
    amount: '1000000'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDeploy = async () => {
    if (!wallet) return;
    
    try {
        const minterCode = Cell.fromBoc(Buffer.from(JETTON_MINTER_CODE, 'hex'))[0];
        
        // Build metadata dict
        const dict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
        
        const keys = ['name', 'symbol', 'description', 'image', 'decimals'];
        const values = [formData.name, formData.symbol, formData.description, formData.image, formData.decimals];
        
        for (let i = 0; i < keys.length; i++) {
            if (!values[i]) continue;
            const keyHash = await sha256(values[i]); // Wait, keys are 'name' etc. Hash of KEY.
            // sha256 takes Buffer or string? @ton/crypto sha256 takes Buffer.
            const keyHashBuf = await sha256(Buffer.from(keys[i], 'utf8'));
            dict.set(keyHashBuf, makeSnakeCell(Buffer.from(values[i], 'utf8')));
        }
        
        const contentCell = beginCell()
            .storeUint(ONCHAIN_CONTENT_PREFIX, 8)
            .storeDict(dict)
            .endCell();

        // Initial Data: (admin_address, total_supply, jetton_content, mintable)
        const ownerAddress = Address.parse(wallet.account.address);
        const totalSupply = toNano(formData.amount); // Initial supply? Minter usually starts with 0 and mints to owner, OR starts with pre-mint.
        // My contract logic:
        // load_data: (admin, total_supply, content, mintable)
        // mint op increases supply.
        
        // If we want initial supply, we must MINT it in a separate transaction or have logic in init?
        // Standard Minter usually starts with 0 supply.
        // But user wants to "create tokens" which implies getting them.
        // So we might need to send a "Mint" message immediately after deploy, or use a Minter that pre-mints.
        // The official minter usually mints via "Mint" op.
        
        // Let's assume we deploy with 0 supply, and then user mints.
        // OR we can hack data to set total_supply, but we also need to deploy the wallet for the owner with that balance.
        // Usually safer to deploy Minter (supply 0), then send Mint message.
        
        // But for simplicity in one go:
        // We can deploy Minter. Then Send Mint Body.
        
        const data = beginCell()
            .storeAddress(ownerAddress)
            .storeCoins(0) // Start with 0 supply
            .storeRef(contentCell)
            .storeUint(1, 1) // Mintable = true (-1? or 1? logic checks mintable != 0)
            .endCell();
            
        const stateInit = beginCell()
            .storeBit(0) // split_depth
            .storeBit(0) // special
            .storeBit(1) // code present
            .storeRef(minterCode)
            .storeBit(1) // data present
            .storeRef(data)
            .storeBit(0) // library
            .endCell();
            
        const stateInitCell = stateInit;
        const stateInitBase64 = stateInitCell.toBoc().toString('base64');
        
        // Compute contract address
        // Using ton-core Address.contractAddress(0, {code, data})
        const contractAddress = new Address(0, stateInit.hash()); // Simplification, need actual calculation
        
        // We will send a deployment message.
        // We can also attach a MINT message payload if we want to mint immediately.
        // Op::Mint = 21.
        
        const mintBody = beginCell()
            .storeUint(21, 32) // Op::Mint
            .storeUint(0, 64) // QueryID
            .storeCoins(toNano(formData.amount)) // Amount
            .storeAddress(ownerAddress) // To
            .storeUint(0, 1) // Response destination? No, from my contract: (int response_dest...) - wait, strict typing in my contract?
            // My contract:
            // int amount = in_msg_body~load_coins();
            // slice owner_address = in_msg_body~load_msg_addr();
            // int response_destination = in_msg_body~load_int(1); // unused
            // int custom_payload = in_msg_body~load_int(1); // unused
            // int forward_ton_amount = in_msg_body~load_coins();
            // slice forward_payload = in_msg_body~load_slice_ref();

            .storeBit(0) // response_destination (0 as int 1 bit? No, int(1) is 1 bit signed/unsigned? load_int(1) loads 1 bit signed. 0 is 0. -1 is 1.)
            .storeBit(0) // custom_payload
            .storeCoins(toNano('0.01')) // forward_ton_amount
            .storeRef(beginCell().endCell()) // forward_payload (as ref or slice?)
            // "slice forward_payload = in_msg_body~load_slice_ref();"
            // If I store Ref, load_slice_ref will load it.
            .endCell();

        const myAddress = Address.contractAddress(0, { code: minterCode, data: data });

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: myAddress.toString(),
                    amount: toNano('0.05').toString(), // Deployment fees
                    stateInit: stateInitBase64,
                    payload: mintBody.toBoc().toString('base64')
                }
            ]
        };
        
        await tonConnectUI.sendTransaction(transaction);
        alert('Transaction sent! Contract Address: ' + myAddress.toString());

    } catch (e: any) {
        console.error(e);
        alert('Error: ' + e.message);
    }
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Header>
          <Logo>
            <img src="https://ton.org/download/ton_symbol.svg" alt="TON" width="32" />
            <span>Jetton 2.0 Minter</span>
          </Logo>
          <TonConnectButton />
        </Header>

        <Card>
          <Title>Create Jetton</Title>
          <FormGroup>
            <Label>Name</Label>
            <Input name="name" placeholder="Bitcoin" value={formData.name} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label>Symbol</Label>
            <Input name="symbol" placeholder="BTC" value={formData.symbol} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label>Decimals</Label>
            <Input name="decimals" type="number" placeholder="9" value={formData.decimals} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label>Initial Supply</Label>
            <Input name="amount" type="number" placeholder="1000000" value={formData.amount} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label>Description</Label>
            <Input name="description" placeholder="The best token..." value={formData.description} onChange={handleChange} />
          </FormGroup>
          <FormGroup>
            <Label>Image URL</Label>
            <Input name="image" placeholder="https://..." value={formData.image} onChange={handleChange} />
          </FormGroup>

          <Button onClick={handleDeploy} disabled={!wallet}>
            {wallet ? 'Deploy Jetton' : 'Connect Wallet to Deploy'}
          </Button>
        </Card>
      </Container>
    </>
  )
}

export default App
