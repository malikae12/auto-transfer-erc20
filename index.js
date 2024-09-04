import { ethers } from 'ethers';
import readline from 'readline'; // To get user input from the terminal
import chalk from 'chalk'; // To add color to terminal output
import config from './config.json' assert { type: 'json' }; // Ensure config.json exists and contains rpcUrl

const privateKey = '0x_your_private_key'; //must use 0x
const tokenContractAddress = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'; //your received address

// Token ABI definition
const tokenAbi = [
  "function transfer(address to, uint amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint)"
];

// Create provider and wallet
const provider = new ethers.JsonRpcProvider(config.rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Create contract instance
const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, wallet);

// Define recipient address
const recipient = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E';

// Define a custom orange color using RGB values
const orange = chalk.rgb(255, 165, 0);

// Setup readline to get user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for both the amount and number of times to send the tokens
rl.question(orange('Enter the amount of tokens to send (in USDC.e): '), (inputAmount) => {
  rl.question(orange('How many times do you want to send the tokens?: '), async (inputTimes) => {
    const amount = ethers.parseUnits(inputAmount, 6); // Parse the amount to 6 decimals (for USDC.e)
    const times = BigInt(inputTimes); // Convert the number of times to BigInt

    // Check balance and send tokens multiple times
    await checkBalance();
    await sendMultipleTokens(amount, times);
    
    rl.close(); // Close the readline interface when done
  });
});

// Function to send tokens multiple times
async function sendMultipleTokens(amount, times) {
  try {
    // Retrieve balance before sending
    const balance = await tokenContract.balanceOf(wallet.address);

    // Check if balance is sufficient
    if (balance < (amount * times)) {  // Use BigInt for multiplication
      throw new Error('Insufficient balance to send the tokens multiple times.');
    }

    for (let i = 0; i < times; i++) {
      // Transfer the tokens
      const txResponse = await tokenContract.transfer(recipient, amount);
      const txHashUrl = `https://arbiscan.io/tx/${txResponse.hash}`; // Arbiscan URL for the transaction
      
      // Print the hash in green
      console.log(chalk.green(`Transaction ${i + 1} hash: ${txResponse.hash}`));
      console.log(chalk.green(`Track the transaction here: ${txHashUrl}`));

      // Wait for the transaction to be confirmed
      const receipt = await txResponse.wait();
      console.log(chalk.green(`Transaction ${i + 1} confirmed in block ${receipt.blockNumber}`));

      // Print the congratulatory message in green
      console.log(chalk.green(`YOUR TRANSACTION ALREADY DONE CONGRATS`));
    }
  } catch (error) {
    // Print the error in red
    console.error(chalk.red('Error sending tokens:', error));
  }
}

// Function to check balance
async function checkBalance() {
  try {
    const balance = await tokenContract.balanceOf(wallet.address);
    // Print the balance in blue
    console.log(chalk.blue(`Current Balance: ${ethers.formatUnits(balance, 6)} USDC.e`)); // 6 decimals for USDC.e
  } catch (error) {
    // Print the error in red if balance check fails
    console.error(chalk.red('Error checking balance:', error));
  }
}
