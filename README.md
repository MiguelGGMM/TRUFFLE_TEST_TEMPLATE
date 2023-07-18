# TRUFFLE_TEST_TEMPLATE

[![Solidity testing CI](https://github.com/MiguelGGMM/TRUFFLE_TEST_TEMPLATE/actions/workflows/truffle-test-pnpm.js.yml/badge.svg)](https://github.com/MiguelGGMM/TRUFFLE_TEST_TEMPLATE/actions/workflows/truffle-test-pnpm.js.yml)

 Project template for testing smart contracts using truffle and ganache, includes linter, prettier and CI using github actions \
 The example contract imports openzeppelin standard contracts \
 During tests chainlink datafeeds are used for validations 

## INSTALLATION INSTRUCTIONS

```
npm install -g truffle@5.11.0
```

```
npm install -g ganache@7.9.0
```

```
npm install
```

Using 'npm run' you can check the commands you will need to deploy ganache, test your smart contract and run linter and prettier 

If you want to test deployments you have to include your pk on .pk.example and remove the .example 

You have to include your API KEY on truffle config 'api_keys' if you desire to test the verification plugin


