/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 * 
 * https://trufflesuite.com/docs/truffle/reference/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

 const HDWalletProvider = require('@truffle/hdwallet-provider');

 const fs = require('fs'); 
 let privateKey = ''
 try { privateKey = fs.readFileSync(".pk").toString().trim() }catch(ex){ console.log(ex.toString()) }
 
 module.exports = {
   /**
    * Networks define how you connect to your ethereum client and let you set the
    * defaults web3 uses to send transactions. If you don't specify one truffle
    * will spin up a development blockchain for you on port 9545 when you
    * run `develop` or `test`. You can ask a truffle command to use a specific
    * network from the command line, e.g
    *
    * $ truffle test --network <network-name>
    */

   // In order to select only one contract //Can be used to by command line using --contracts_directory <path/to/contract>
   contracts_directory: "./contracts/token",
 
   networks: {
     // Useful for testing. The `development` name is special - truffle uses it by default
     // if it's defined here and no other network is specified at the command line.
     // You should run a client (like ganache-cli, geth or parity) in a separate terminal
     // tab if you use this network and you must also set the `host`, `port` and `network_id`
     // options below to some value.
     //

     ganacheLocal: {
         acounts: 20, //test it
         host: "127.0.0.1",     // Localhost (default: none)
         port: 8545,            // Standard Ethereum port (default: none)
         network_id: "*",//,       // Any network (default: none)
         //timeoutBlocks: 200,
         //gas: 30000000,        // Ropsten has a lower block limit than mainnet
         //gasPrice: 7000000000,
         //confirmations: 1    // # of confs to wait between deployments. (default: 0)
         //from: ''
     },     

     bscMainnet: {
      provider: () => new HDWalletProvider(privateKey, `https://bsc-dataseed.binance.org/`),
      network_id: 56,       // Ropsten's id
      gas: 10000000,        // Ropsten has a lower block limit than mainnet
      gasPrice: 5000000000,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      networkCheckTimeout: 100000//,
      //skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
     },

     bscTestnet: {
       provider: () => new HDWalletProvider(privateKey, "https://data-seed-prebsc-1-s1.binance.org:8545/"),
       port: 8545,
       network_id: 97,       // Ropsten's id
       gas: 10000000,        // Ropsten has a lower block limit than mainnet
       gasPrice: 20000000000,
       confirmations: 2,    // # of confs to wait between deployments. (default: 0)
       timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
       networkCheckTimeout: 100000//,
       //skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
     }
   },
 
   // Set default mocha options here, use special reporters etc.
   mocha: {
    // FIX... not working
    // reporter: 'eth-gas-reporter',
    // reporterOptions: {
    //   excludeContracts: ['Migrations'],
    //   src: "contracts",
    //   url: "http://127.0.0.1:8545/",
    //   token: "BNB",
    //   gasPriceApi: "https://api.bscscan.com/api?module=proxy&action=eth_gasPrice",
    //   //default
    //   currency: "chf",
    //   coinmarketcap: process.env.COINMARKETCAP_API_KEY || null,
    //   onlyCalledMethods: false,
    //   noColors: true,
    //   rst: true,
    //   rstTitle: "Gas Usage",
    //   showTimeSpent: true,
    //   excludeContracts: ["Migrations"],
    //   //proxyResolver: "EtherRouter",
    //   codechecks: false,//true,
    //   showMethodSig: true
    // }
  },
 
   // Configure your compilers
   compilers: {
     solc: {
       version: "0.8.12",      // Fetch exact version from solc-bin (default: truffle's version)
       // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
       settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 999
        },
        //evmVersion: "homestead"
        evmVersion: "byzantium"
       }
     }
   },
   plugins: [
    'truffle-plugin-verify',
    //'truffle-contract-size',
    //'solidity-coverage',
  ],
  api_keys: {
    etherscan: "",
    bscscan: ""
  }

   // Truffle DB is currently disabled by default; to enable it, change enabled:
   // false to enabled: true. The default storage location can also be
   // overridden by specifying the adapter settings, as shown in the commented code below.
   //
   // NOTE: It is not possible to migrate your contracts to truffle DB and you should
   // make a backup of your artifacts to a safe location before enabling this feature.
   //
   // After you backed up your artifacts you can utilize db by running migrate as follows:
   // $ truffle migrate --reset --compile-all
   //
   // db: {
     // enabled: false,
     // host: "127.0.0.1",
     // adapter: {
     //   name: "sqlite",
     //   settings: {
     //     directory: ".db"
     //   }
     // }
   // }
 };
 