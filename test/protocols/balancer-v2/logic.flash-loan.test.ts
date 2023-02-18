import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import * as common from '@composable-router/common';
import * as core from '@composable-router/core';
import { expect } from 'chai';
import { getChainId, mainnetTokens } from '@composable-router/test-helpers';
import hre from 'hardhat';
import * as protocols from 'src/protocols';

describe('Test BalancerV2 FlashLoan Logic', function () {
  let chainId: number;
  let user: SignerWithAddress;

  before(async function () {
    chainId = await getChainId();
    [, user] = await hre.ethers.getSigners();
  });

  const testCases = [
    { outputs: new common.TokenAmounts([mainnetTokens.WETH, '1'], [mainnetTokens.USDC, '1']) },
    { outputs: new common.TokenAmounts([mainnetTokens.USDT, '1'], [mainnetTokens.DAI, '1']) },
  ];

  testCases.forEach(({ outputs }, i) => {
    it(`case ${i + 1}`, async function () {
      // 1. build funds and router logics for flash loan
      const flashLoanRouterLogics: core.IRouter.LogicStruct[] = [];
      const sendToken = new protocols.tokens.SendTokenLogic(chainId);
      for (const output of outputs.toArray()) {
        flashLoanRouterLogics.push(
          await sendToken.getLogic({
            input: output,
            recipient: protocols.balancerv2.getContractAddress(chainId, 'FlashLoanCallbackBalancerV2'),
          })
        );
      }

      // 2. build router logics
      const routerLogics: core.IRouter.LogicStruct[] = [];

      const userData = core.Router__factory.createInterface().encodeFunctionData('execute', [
        flashLoanRouterLogics,
        [],
      ]);
      const balancerV2FlashLoan = new protocols.balancerv2.FlashLoanLogic(chainId);
      routerLogics.push(await balancerV2FlashLoan.getLogic({ outputs, params: userData }));

      // 3. send router tx
      const transactionRequest = core.newRouterExecuteTransactionRequest({ chainId, routerLogics });
      await expect(user.sendTransaction(transactionRequest)).not.to.be.reverted;
    });
  });
});
