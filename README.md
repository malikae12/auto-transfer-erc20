# Penjelasan: {anda juga bisa menambahkan jaringan lain seperti testnet dll}

Ethereum: Jaringan Ethereum utama.
Arbitrum: Jaringan Ethereum Arbitrum.
Optimism: Jaringan Ethereum Optimism.
Base: Jaringan Ethereum Base.
Binance Smart Chain: Jaringan BSC.
Solana: Jaringan Solana.
ETC..

Pastikan untuk mengganti placeholder seperti
 0xYourEthereumTokenContractAddress, 0xYourArbitrumTokenContractAddress, 0xYourOptimismTokenContractAddress, 0xYourBaseTokenContractAddress, 0xYourBSCAndTokenContractAddress, dan 0x_your_private_key 0x harus menggunakan jika tidak private akan invalid

 # digunakan untuk mentrasfer token ERC-20 atau token contract
anda bisa mengganti contract yang anda inginkan di CONFIG.JS

Dalam konteks transfer token atau cryptocurrency, angka 1 dan 2 bisa digunakan untuk menentukan jenis transaksi yang ingin dilakukan. Berikut adalah contohnya:

1. Transfer Token
1: Untuk mentransfer token berdasarkan kontrak token yang spesifik di jaringan yang dipilih. Ini biasanya digunakan jika Anda ingin mengirim token yang sesuai dengan standar ERC-20, BEP-20, atau standar token lainnya di jaringan blockchain yang mendukung kontrak token.

2. Transfer Ether atau Solana (atau aset native lainnya)
2: Untuk mentransfer aset native dari jaringan tersebut, seperti Ether di Ethereum, BNB di Binance Smart Chain, atau SOL di Solana. Ini adalah transfer langsung dari alamat ke alamat tanpa melibatkan kontrak token.

=======
# trasnfer-erc20
all trasnfer


# install
`` https://github.com/malikae12/auto-transfer-erc20 ``

# rubah 0x private key di #config.js {scroll paling bawah}
# noted private key must use 0x exemple: 0xYOURPRIVATEKEY

# start to run recomend use ```npm start```
``` npm start ```
or 
```node mormal.js```
or 
``` node arb.js```
