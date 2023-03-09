import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { claimToken, getChainId, mainnetTokens } from '@composable-router/test-helpers';
import * as common from '@composable-router/common';
import * as core from '@composable-router/core';
import { expect } from 'chai';
import * as helpers from './helpers';
import hre from 'hardhat';
import * as protocols from 'src/protocols';
import * as utils from 'test/utils';

describe('Test AaveV2 Withdraw Logic', function () {
  let chainId: number;
  let user: SignerWithAddress;

  before(async function () {
    chainId = await getChainId();
    [, user] = await hre.ethers.getSigners();
    await claimToken(chainId, user.address, mainnetTokens.WETH, '100');
    await claimToken(chainId, user.address, mainnetTokens.USDC, '100');
  });

  const testCases = [
    {
      input: new common.TokenAmount(protocols.aavev2.mainnetTokens.aWETH, '1'),
      tokenOut: protocols.aavev2.mainnetTokens.WETH,
    },
    {
      input: new common.TokenAmount(protocols.aavev2.mainnetTokens.aUSDC, '1'),
      tokenOut: protocols.aavev2.mainnetTokens.USDC,
    },
    {
      input: new common.TokenAmount(protocols.aavev2.mainnetTokens.aWETH, '1'),
      tokenOut: protocols.aavev2.mainnetTokens.WETH,
      amountBps: 5000,
    },
    {
      input: new common.TokenAmount(protocols.aavev2.mainnetTokens.aUSDC, '1'),
      tokenOut: protocols.aavev2.mainnetTokens.USDC,
      amountBps: 5000,
    },
  ];

  testCases.forEach(({ input, tokenOut, amountBps }, i) => {
    it(`case ${i + 1}`, async function () {
      // 1. deposit first
      const assetsAmount = new common.TokenAmount(tokenOut, '3');
      await helpers.deposit(chainId, user, assetsAmount);

      // 2. get output
      const aaveV2Withdraw = new protocols.aavev2.WithdrawLogic(chainId);
      const output = await aaveV2Withdraw.getPrice({ input, tokenOut });

      // 3. build funds, tokensReturn
      const tokensReturn = [output.token.elasticAddress];
      const funds = new common.TokenAmounts();
      if (amountBps) {
        funds.add(utils.calcRequiredFundByAmountBps(input, amountBps));
        tokensReturn.push(input.token.elasticAddress);
      } else {
        funds.add(input);
      }

      // 4. build router logics
      const erc20Funds = funds.erc20;
      const routerLogics = await utils.getPermitAndPullTokenRouterLogics(chainId, user, erc20Funds);
      routerLogics.push(await aaveV2Withdraw.getLogic({ input, output, amountBps }));

      // 5. send router tx
      const transactionRequest = core.newRouterExecuteTransactionRequest({ chainId, routerLogics, tokensReturn });
      await expect(user.sendTransaction(transactionRequest)).not.to.be.reverted;
      await expect(user.address).to.changeBalance(input.token, -input.amount, 1);
      await expect(user.address).to.changeBalance(output.token, output.amount);
    });
  });
});