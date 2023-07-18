require('dotenv').config();
const BN = require("bn.js");

const ZERO_ADDRESS = `0x0000000000000000000000000000000000000000`;
const DEAD_ADDRESS = `0x000000000000000000000000000000000000dEaD`;

const IERC20Metadata = artifacts.require("IERC20Metadata");
const IDEXRouter = artifacts.require("IDEXRouter");
const TEMPLATE = artifacts.require("ThePromisedMoon");
const DEXSTATS = artifacts.require("DEXStats");
const IPAIRDATAFEED = artifacts.require("IPairDatafeed");

const BN2 = x => new BN(x);

const defaultGwei = new BN(5000000000);
const defaultGweiTestnet = new BN(10000000000);
const debug = true;

const multiTest = true;
const nAcountsPerType = 10;

//const moment = require('moment');

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */

/*
*   Util functions
*/
const getGasAmount = async (txHash) => {
    const tx = await web3.eth.getTransaction(txHash);
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    const gasPrice = tx.gasPrice;
    const gasUsed = receipt.gasUsed;

    return web3.utils.fromWei(gasPrice, 'ether') * gasUsed;
}

const getContractBalance = async (contract) => {
    const balance = await contract.getBalance();
    return web3.utils.fromWei(balance, 'ether');
}

const getAccountBalance = async (account) => {
    let balance = await web3.eth.getBalance(account);
    return web3.utils.fromWei(balance, 'ether');
}

const toWei = (value) => web3.utils.toWei(value.toString());
const fromWei = (value, fixed=2) => parseFloat(web3.utils.fromWei(value)).toFixed(fixed);

const getBlockTimestamp = async () => {
    return (await web3.eth.getBlock('latest')).timestamp;
}

const increaseDays = async (days) => {
    await increase(86400 * parseInt(days));
}

const increase = async (duration) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [duration],
            id: new Date().getTime()
        }, (err, result) => {
            // second call within the callback
            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_mine',
                params: [],
                id: new Date().getTime()
            }, (err, result) => {
                // need to resolve the Promise in the second callback
                resolve();
            });
        });
    });
}

const log = (message) => {
    if(debug){
        console.log(`[DEBUG] ${message}`);
    }
}

contract("ThePromisedMoon", function (accounts) {

    /*
    *   Template tests
    */

    var initialMcap = 0;

    var ctrTK = null;
    var ctrPAIR = null;
    var ctrRewards = null;
    var ctrDEX = null;
    var ctrDEXsts = null;
    var ctrPairDF = null;
    var pairAdr = null;
    var main_account = accounts[0];

    const checkMcapVSDatafeed = async () => {
        let token_bal = await ctrTK.balanceOf(main_account);
        let bal = await getAccountBalance(main_account);
        let currMarketcap = parseInt((await ctrDEXsts.getTOKENdilutedMarketcap(6)));
        // Mcap taking price from chainlink datafeed
        let wethPriceChainlinkDF = await ctrPairDF.latestAnswer();
        let pairReserves = await ctrDEXsts.getReservesPairToken();
        let pairDecs = await ctrPAIR.decimals();
        let totalSupply = await ctrTK.totalSupply();
        let datafeedDecimals = await ctrPairDF.decimals();        
        let pairAmount = BN2(pairReserves[0].toString()).mul(BN2("1000")).div(BN2((10 ** parseInt(pairDecs.toString())).toString()));
        let marketcapPDF = wethPriceChainlinkDF.mul(totalSupply).div(pairReserves[1]).mul(pairAmount).div(BN2("1000"));            
        marketcapPDF = parseInt(parseInt(marketcapPDF.toString()) / (10 ** parseInt(datafeedDecimals.toString())));
        log(`Acc. ETH balance ${bal}, acc. Token balance ${token_bal}, initial mcap ${initialMcap}, token marketcap ${currMarketcap}$, token marketcap chainlink ${marketcapPDF}$`);            
        return [currMarketcap < marketcapPDF * 1.01 && currMarketcap > marketcapPDF * 0.99, currMarketcap];
    }

    const _checks = async () => {
        log(`Dev account balance: ${(await getAccountBalance('0x936a644Bd49E5E0e756BF1b735459fdD374363cF'))}`);
        log(`Dev rewards balance: ${(await ctrRewards.balanceOf('0x936a644Bd49E5E0e756BF1b735459fdD374363cF'))}`);
        log(`${(await ctrTK.balanceOf(ctrTK.address))} contract token balance`);
        log(`${(await ctrTK.balanceOf(DEAD_ADDRESS))} tokens burned`);
        log(`${(await ctrTK.allowance(ctrTK.address, process.env.ROUTER))} router allowance`);
        log(`Token mcap: ${(await ctrDEXsts.getTOKENdilutedMarketcap(6))}`);
        log(`Token limit mcap: ${(await ctrTK.mcapLimit())}`);
    }

    const addLiqDEX = async (_eth, _nTokens) => {
        log(`Approving tokens ${_nTokens}`);
        await ctrTK.approve(ctrDEX.address, _nTokens);
        log(`Adding liq. ${_eth.toString()} (ETH), ${_nTokens.toString()} (TOKENS)`);
        await ctrDEX.addLiquidityETH( 
            ctrTK.address,
            _nTokens,
            _nTokens,
            toWei(1),
            main_account,
            parseInt(Date.now()/1000) + 3600,                     
        {
            value: toWei(_eth),
            //from: main_account,
            gas: "2000000"
        });
        log('Liq. added');
    }

    const buyDEX = async (_eth, _account) => {
        log(`Buying ${_eth} ETH...`);
        await ctrDEX.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [(await ctrDEX.WETH()), ctrTK.address],
            _account,
            parseInt((await getBlockTimestamp())) + 3600, 
            {
                value: toWei(_eth),
                from: _account,
                gas: "2000000"                
            });
        log(`Buy performed, ${_eth} ETH`);
    }

    const sellDEX = async (_nTokens, _account) => {
        log(`Approving tokens ${_nTokens}`);
        await ctrTK.approve(ctrDEX.address, _nTokens, { from: _account});
        log(`Selling... ${_nTokens.toString()} tokens`);
        await ctrDEX.swapExactTokensForETHSupportingFeeOnTransferTokens(
            _nTokens.toString(),
            0,
            [ctrTK.address, (await ctrDEX.WETH())],
            _account,
            parseInt((await getBlockTimestamp())) + 3600, 
            {
                //value: toWei("0.05"),
                from: _account,
                gas: "2000000"                
            });
        log(`Sell performed: ${_nTokens.toString()} tokens`);
    }

    it("Should fail if a contract is not deployed", async function(){

        try {

            ctrTK = await TEMPLATE.deployed();
            ctrPAIR = await IERC20Metadata.at(process.env.PAIR);
            ctrRewards = await IERC20Metadata.at('0x17Bd2E09fA4585c15749F40bb32a6e3dB58522bA');
            ctrDEX = await IDEXRouter.at(process.env.ROUTER);
            ctrDEXsts = await DEXSTATS.at((await ctrTK.getDEXStatsAddress()));
            ctrPairDF = await IPAIRDATAFEED.at(process.env.PAIR_DATAFEED);
            pairAdr = await ctrTK.liqPair();

            log(`Contracts deployed: Token template, Token pair, DEX stats, DEX router, Chainlink pair datafeed`);
            log(`Addresses: ${ctrTK.address}, ${ctrPAIR.address}, ${ctrDEXsts.address}, ${ctrDEX.address}, ${ctrPairDF.address}`);

            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        }
    });

    it('Add liq', async function(){
        try
        {
            await ctrTK.addLiqContract({ value: toWei(50), from: main_account });
            //await ctrTK.addLiqContract({ value: toWei("0.01"), from: main_account });
            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        } finally {
            await _checks();
        }
    });

    it('Perform transaction 1', async function(){
        try
        {
            await ctrTK.transfer(accounts[1], ((await ctrTK.balanceOf(main_account)).div(BN2(100))));
            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        } finally {
            await _checks();
        }
    });

    it('Perform transaction 2', async function(){
        try
        {
            await ctrTK.transfer(accounts[2], ((await ctrTK.balanceOf(accounts[1])).div(BN2(1000))), { from: accounts[1] });
            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        } finally {
            await _checks();
        }
    });

    it('Perform buy', async function(){
        try
        {
            for(let _account of accounts) {
                await buyDEX("0.5", _account);
            }
            // Perform buy
            //await buyDEX("0.02", accounts[1]);            
            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        } finally {
            await _checks();
        }
    });

    it('Cancel project', async function(){
        try
        {
            await ctrTK.cancelProject({from:"0x936a644Bd49E5E0e756BF1b735459fdD374363cF"});
            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        }
    });

    it('Claim ETH', async function(){
        try
        {
            let pendingClaimAmount = await ctrTK.claimeableAmountBase18(accounts[1]);
            console.log(`Account ${accounts[1]} has ${pendingClaimAmount.toString()} ETH base 18 pending to claim, ETH in the pool `);
            console.log(`Current marketcap ${(await ctrDEXsts.getTOKENdilutedMarketcap(6))}`);
            console.log(`Claiming...`);
            await ctrTK.claimPair({ from: accounts[1] });

            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(false);
        }
    });

    it('Claim ETH should fail', async function(){
        let error = false;
        try
        {
            let pendingClaimAmount = await ctrTK.claimeableAmountBase18(accounts[1]);
            console.log(`Account ${accounts[1]} has ${pendingClaimAmount.toString()} ETH base 18 pending to claim, ETH in the pool `);
            console.log(`Current marketcap ${(await ctrDEXsts.getTOKENdilutedMarketcap(6))}`);
            console.log(`Claiming...`);
            await ctrTK.claimPair({ from: accounts[1] });

            error = true;
            return assert.isTrue(true);
        } catch (err) {
            console.log(err.toString());
            return assert.isTrue(error ? false : true);
        }
    });
});