import { ethers } from 'ethers';
import readline from 'readline';
import chalk from 'chalk';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url), 'utf-8'));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chooseNetwork() {
  console.log(chalk.yellow("Jaringan tersedia:"));
  Object.keys(config.networks).forEach((key, index) => {
    console.log(chalk.yellow(`${index + 1}. ${config.networks[key].name}`));
  });

  rl.question(chalk.yellow('Pilih jaringan (nomor jaringan): '), async (choice) => {
    const networkKey = Object.keys(config.networks)[parseInt(choice) - 1];
    if (!networkKey) {
      console.error('Jaringan tidak valid');
      rl.close();
      return;
    }

    const network = config.networks[networkKey];
    console.log(chalk.cyan(`Jaringan yang dipilih: ${network.name}`));

    if (network.name === 'Solana') {
      await handleSolanaTransaction(network);
    } else {
      await chooseTransactionType(network);
    }
  });
}

async function chooseTransactionType(network) {
  rl.question(chalk.bgRed('Pilih jenis transaksi (1 untuk Token, 2 untuk ETH): '), async (type) => {
    console.log(chalk.yellow(`Jenis transaksi yang dipilih: ${type}`));
    if (type === '1') {
      await handleTokenTransaction(network);
    } else if (type === '2') {
      await handleEthTransaction(network);
    } else {
      console.error('Jenis transaksi tidak valid');
      rl.close();
    }
  });
}

function getInput(question) {
  return new Promise((resolve) => {
    rl.question(chalk.yellow(question), (answer) => {
      console.log(chalk.bgRed(`Jawaban pengguna: ${answer}`));
      resolve(answer);
    });
  });
}

function generateRandomAddress() {
  const randomHex = '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return randomHex;
}

async function getNonce(provider, wallet) {
  try {
    const nonce = await provider.getTransactionCount(wallet.address, 'latest');
    console.log(chalk.cyan(`Nonce terbaru: ${nonce}`));
    return nonce;
  } catch (error) {
    console.error('Kesalahan saat mendapatkan nonce:', error.message);
    throw error;
  }
}

async function handleTokenTransaction(network) {
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  const tokenContractAddress = network.tokenContractAddress;
  const tokenAbi = [
    "function transfer(address to, uint amount) public returns (bool)",
    "function balanceOf(address account) public view returns (uint)"
  ];

  const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, wallet);

  console.log(chalk.bgBlueBright("Pilih jenis penerima:"));
  console.log(chalk.hex('#7FFF00')("1: Alamat Target"));
  console.log(chalk.hex('#FF00FF')("2: Alamat Acak"));

  const recipientType = await getInput(chalk.yellow("Pilih jenis penerima (1/2) atau tekan Enter untuk default: ")) || '1';

  let recipientAddress;

  if (recipientType === '1') {
    recipientAddress = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E';
    console.log(chalk.red("Alamat target yang digunakan:"));
    console.log(chalk.hex('#ed64bd')(`Alamat target yang digunakan: ${recipientAddress}`));
  } else if (recipientType === '2') {
    recipientAddress = generateRandomAddress();
    console.log(chalk.cyan(`Alamat acak yang dihasilkan: ${recipientAddress}`));
  } else {
    console.error(chalk.red("Jenis penerima tidak valid. Menggunakan alamat default."));
    recipientAddress = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E';
    console.log(chalk.red(`Alamat target yang digunakan: ${recipientAddress}`));
  }

  const amount = ethers.parseUnits(await getInput(chalk.blue(`Masukkan jumlah token yang ingin dikirim (TOKEN ATAU ETH/NATIVE): `)), network.decimals);
  const targetAmount = ethers.parseUnits(await getInput(chalk.yellow('Masukkan total jumlah token yang ingin dikirim: ')), network.decimals);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Helper untuk delay

  let totalTransferred = ethers.BigNumber.from('0');

  while (totalTransferred.lt(targetAmount)) {
    const balance = await tokenContract.balanceOf(wallet.address);

    if (balance.lt(amount)) {
      console.log(chalk.yellow('Saldo tidak mencukupi untuk transfer saat ini. Menunggu saldo mencukupi...'));
      await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
      continue; // Coba lagi
    }

    const maxTransferable = balance.div(amount);
    const transferTimes = ethers.BigNumber.from(Math.min(Number(targetAmount.sub(totalTransferred).div(amount).toNumber()), maxTransferable.toNumber()));

    for (let i = 0; i < transferTimes.toNumber(); i++) {
      let success = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const nonce = await getNonce(provider, wallet);
          const txResponse = await tokenContract.transfer(recipientAddress, amount, { nonce });
          const txHashUrl = `${network.explorer}tx/${txResponse.hash}`;
          console.log(chalk.bgGreen(`Token berhasil dikirim! Lihat detail transaksi di: ${txHashUrl}`));
          totalTransferred = totalTransferred.add(amount);
          success = true;
          break; // keluar dari loop jika sukses
        } catch (error) {
          if (error.code === 'NONCE_EXPIRED' || error.code === 'NONCE_TOO_LOW') {
            console.log(chalk.hex('#FF00FF')('Nonce kadaluarsa. Mengambil nonce terbaru dan mencoba lagi...'));
          } else {
            console.error(chalk.red('Kesalahan saat mengirim token:', error.message));
            break; // keluar dari loop jika kesalahan tidak terkait nonce
          }
        }
      }

      if (!success) {
        console.log(chalk.red('Gagal mengirim token setelah 3 kali percobaan. Melanjutkan...'));
        continue; // lanjut ke pengiriman berikutnya
      }
    }

    // Jika sudah mencapai targetAmount, keluar dari loop
    if (totalTransferred.gte(targetAmount)) {
      break;
    }
  }

  const updatedBalance = await tokenContract.balanceOf(wallet.address);
  console.log(chalk.bgBlue(`Sisa saldo: ${ethers.formatUnits(updatedBalance, network.decimals)} ${network.symbol}`));

  process.exit(0);
}

async function handleEthTransaction(network) {
  const provider = new ethers.JsonRpcProvider(network.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  console.log(chalk.red("Pilih jenis penerima:"));
  console.log(chalk.hex('#7FFF00')("1: Alamat Target"));
  console.log(chalk.red("2: Alamat Acak"));

  const recipientType = await getInput(chalk.yellow("Pilih jenis penerima (1/2) atau tekan Enter untuk default: ")) || '1';

  let recipientAddress;

  if (recipientType === '1') {
    recipientAddress = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E';
    console.log(chalk.red(`Alamat target yang digunakan: ${recipientAddress}`));
  } else if (recipientType === '2') {
    recipientAddress = generateRandomAddress();
    console.log(chalk.cyan(`Alamat acak yang dihasilkan: ${recipientAddress}`));
  } else {
    console.error(chalk.red("Jenis penerima tidak valid. Menggunakan alamat default."));
    recipientAddress = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E';
    console.log(chalk.red(`Alamat target yang digunakan: ${recipientAddress}`));
  }

  const amount = ethers.parseUnits(await getInput(chalk.blue('Masukkan jumlah ETH yang ingin dikirim (dalam ETH): ')), 18);
  const targetAmount = ethers.parseUnits(await getInput(chalk.yellow('Masukkan total jumlah ETH yang ingin dikirim: ')), 18);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Helper untuk delay

  let totalTransferred = ethers.BigNumber.from('0');

  while (totalTransferred.lt(targetAmount)) {
    const balance = await provider.getBalance(wallet.address);

    if (balance.lt(amount)) {
      console.log(chalk.yellow('Saldo tidak mencukupi untuk transfer saat ini. Menunggu saldo mencukupi...'));
      await delay(5000); // Tunggu 5 detik sebelum mencoba lagi
      continue; // Coba lagi
    }

    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const nonce = await getNonce(provider, wallet);
        const txResponse = await wallet.sendTransaction({
          to: recipientAddress,
          value: amount,
          nonce: nonce
        });
        const txHashUrl = `${network.explorer}tx/${txResponse.hash}`;
        console.log(chalk.bgGreen(`ETH berhasil dikirim! Lihat detail transaksi di: ${txHashUrl}`));
        totalTransferred = totalTransferred.add(amount);
        success = true;
        break; // keluar dari loop jika sukses
      } catch (error) {
        if (error.code === 'NONCE_EXPIRED' || error.code === 'NONCE_TOO_LOW') {
          console.log(chalk.hex('#FF00FF')('Nonce kadaluarsa. Mengambil nonce terbaru dan mencoba lagi...'));
        } else {
          console.error(chalk.red('Kesalahan saat mengirim ETH:', error.message));
          break; // keluar dari loop jika kesalahan tidak terkait nonce
        }
      }
    }

    if (!success) {
      console.log(chalk.red('Gagal mengirim ETH setelah 3 kali percobaan. Melanjutkan...'));
      continue; // lanjut ke pengiriman berikutnya
    }
  }

  const updatedBalance = await provider.getBalance(wallet.address);
  console.log(chalk.bgBlue(`Sisa saldo: ${ethers.formatUnits(updatedBalance, 18)} ETH`));

  process.exit(0);
}

chooseNetwork();
