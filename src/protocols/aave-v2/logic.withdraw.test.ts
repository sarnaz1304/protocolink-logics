import { LendingPool__factory } from './contracts';
import { LogicTestCase } from 'test/types';
import { Service } from './service';
import { WithdrawLogic, WithdrawLogicFields } from './logic.withdraw';
import * as common from '@composable-router/common';
import { constants, utils } from 'ethers';
import { expect } from 'chai';
import { mainnetTokens } from './tokens';

describe('AaveV2 WithdrawLogic', function () {
  const chainId = common.ChainId.mainnet;
  const aaveV2WithdrawLogic = new WithdrawLogic(chainId);
  let lendingPoolAddress: string;

  before(async function () {
    const service = new Service(chainId);
    lendingPoolAddress = await service.getLendingPoolAddress();
  });

  context('Test getLogic', function () {
    const lendingPoolIface = LendingPool__factory.createInterface();

    const testCases: LogicTestCase<WithdrawLogicFields>[] = [
      {
        fields: {
          input: new common.TokenAmount(mainnetTokens.aWETH, '1'),
          output: new common.TokenAmount(mainnetTokens.WETH, '1'),
        },
      },
      {
        fields: {
          input: new common.TokenAmount(mainnetTokens.aUSDC, '1'),
          output: new common.TokenAmount(mainnetTokens.USDC, '1'),
        },
      },
      {
        fields: {
          input: new common.TokenAmount(mainnetTokens.aWETH, '1'),
          output: new common.TokenAmount(mainnetTokens.WETH, '1'),
          amountBps: 5000,
        },
      },
      {
        fields: {
          input: new common.TokenAmount(mainnetTokens.aUSDC, '1'),
          output: new common.TokenAmount(mainnetTokens.USDC, '1'),
          amountBps: 5000,
        },
      },
    ];

    testCases.forEach(({ fields }) => {
      it(`withdraw ${fields.input.token.symbol}${fields.amountBps ? ' with amountBps' : ''}`, async function () {
        const routerLogic = await aaveV2WithdrawLogic.getLogic(fields);
        const sig = routerLogic.data.substring(0, 10);
        const { input, amountBps } = fields;

        expect(utils.isBytesLike(routerLogic.data)).to.be.true;
        expect(routerLogic.to).to.eq(lendingPoolAddress);
        expect(sig).to.eq(lendingPoolIface.getSighash('withdraw'));
        expect(routerLogic.inputs[0].token).to.eq(input.token.address);
        if (amountBps) {
          expect(routerLogic.inputs[0].amountBps).to.eq(amountBps);
          expect(routerLogic.inputs[0].amountOrOffset).to.eq(common.getParamOffset(1));
        } else {
          expect(routerLogic.inputs[0].amountBps).to.eq(constants.MaxUint256);
          expect(routerLogic.inputs[0].amountOrOffset).eq(input.amountWei);
        }
        expect(routerLogic.outputs).to.deep.eq([]);
        expect(routerLogic.approveTo).to.eq(constants.AddressZero);
        expect(routerLogic.callback).to.eq(constants.AddressZero);
      });
    });
  });
});