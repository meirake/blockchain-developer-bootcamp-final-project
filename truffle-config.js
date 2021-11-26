const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require('dotenv');

dotenv.config();
const mnemonic = process.env.MNEMONIC;
const infuraUrl = process.env.INFURA_URL;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      host: "127.0.0.1",
      port: "9545",
      network_id: "*",
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, infuraUrl),
      network_id: 4,     
      gas: 5500000,      
      confirmations: 2,  
      timeoutBlocks: 20000,
      skipDryRun: true   
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY,
  },
  plugins: [
    'truffle-plugin-verify'
  ]
};
