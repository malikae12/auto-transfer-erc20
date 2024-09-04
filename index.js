const { ethers } = require('ethers');
const sleep = require('./sleep');
const displayHeader = require('./displayHeader');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

displayHeader();

async function checkBalance(contract, walletAddress, amount, decimals) {
  const balance = await contract.balanceOf(walletAddress);
  const balanceFormatted = ethers.formatUnits(balance, decimals);
  console.log(`Balance: ${balanceFormatted} tokens`);
  return balanceFormatted >= amount;
}

async function main() {
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  for (const token of config.tokens) {
    const contract = new ethers.Contract(token.address, [
      'function balanceOf(address owner) view returns (uint)',
      'function transfer(address to, uint amount) public returns (bool)'
    ], wallet);

    const amount = ethers.parseUnits(token.amount.toString(), token.decimals);
    
    // Check balance before transfer
    const hasSufficientBalance = await checkBalance(contract, wallet.address, ethers.formatUnits(amount, token.decimals), token.decimals);

    if (hasSufficientBalance) {
      await contract.transfer(token.recipient, amount);
      console.log(`Transferred ${token.amount} tokens to ${token.recipient}`);
    } else {
      console.log(`Insufficient balance to transfer ${token.amount} tokens`);
    }
    await sleep(config.sleepDuration);
  }
}

main().catch(console.error);
