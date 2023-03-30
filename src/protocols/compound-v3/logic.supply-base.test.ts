import { Comet__factory } from './contracts';
import { LogicTestCase } from 'test/types';
import { MarketId, getMarket } from './config';
import { SupplyBaseLogic, SupplyBaseLogicFields } from './logic.supply-base';
import * as common from '@composable-router/common';
import { constants, utils } from 'ethers';
import * as core from '@composable-router/core';
import { expect } from 'chai';
import { mainnetTokens } from './tokens';

describe('CompoundV3 SupplyBaseLogic', function () {
  context('Test getTokenList', async function () {
    SupplyBaseLogic.supportedChainIds.forEach((chainId) => {
      it(`network: ${common.getNetworkId(chainId)}`, async function () {
        const compoundV3SupplyBaseLogic = new SupplyBaseLogic(chainId);
        const tokenList = await compoundV3SupplyBaseLogic.getTokenList();
        const marketIds = Object.keys(tokenList);
        expect(marketIds).to.have.lengthOf.above(0);
        for (const marketId of marketIds) {
          expect(tokenList[marketId]).to.have.lengthOf.above(0);
          for (const tokenPair of tokenList[marketId]) {
            expect(tokenPair).to.have.lengthOf(2);
          }
        }
      });
    });
  });

  context('Test getLogic', function () {
    const chainId = common.ChainId.mainnet;
    const compoundV3SupplyBaseLogic = new SupplyBaseLogic(chainId);
    const ifaceComet = Comet__factory.createInterface();

    const testCases: LogicTestCase<SupplyBaseLogicFields>[] = [
      {
        fields: {
          marketId: MarketId.USDC,
          input: new common.TokenAmount(mainnetTokens.USDC, '1'),
          output: new common.TokenAmount(mainnetTokens.cUSDCv3, '0'),
        },
      },
      {
        fields: {
          marketId: MarketId.USDC,
          input: new common.TokenAmount(mainnetTokens.USDC, '1'),
          output: new common.TokenAmount(mainnetTokens.cUSDCv3, '0'),
          amountBps: 5000,
        },
      },
      {
        fields: {
          marketId: MarketId.ETH,
          input: new common.TokenAmount(mainnetTokens.ETH, '1'),
          output: new common.TokenAmount(mainnetTokens.cWETHv3, '0'),
        },
      },
      {
        fields: {
          marketId: MarketId.ETH,
          input: new common.TokenAmount(mainnetTokens.ETH, '1'),
          output: new common.TokenAmount(mainnetTokens.cWETHv3, '0'),
          amountBps: 5000,
        },
      },
      {
        fields: {
          marketId: MarketId.ETH,
          input: new common.TokenAmount(mainnetTokens.WETH, '1'),
          output: new common.TokenAmount(mainnetTokens.cWETHv3, '0'),
        },
      },
      {
        fields: {
          marketId: MarketId.ETH,
          input: new common.TokenAmount(mainnetTokens.WETH, '1'),
          output: new common.TokenAmount(mainnetTokens.cWETHv3, '0'),
          amountBps: 5000,
        },
      },
    ];

    testCases.forEach(({ fields }) => {
      it(`supply ${fields.input.token.symbol} to ${fields.marketId} market${
        fields.amountBps ? ' with amountBps' : ''
      }`, async function () {
        const routerLogic = await compoundV3SupplyBaseLogic.getLogic(fields);
        const sig = routerLogic.data.substring(0, 10);
        const { marketId, input, amountBps } = fields;
        const market = getMarket(chainId, marketId);

        expect(routerLogic.to).to.eq(market.cometAddress);
        expect(utils.isBytesLike(routerLogic.data)).to.be.true;
        expect(sig).to.eq(ifaceComet.getSighash('supply'));
        expect(routerLogic.inputs[0].token).to.eq(input.token.wrapped.address);
        if (amountBps) {
          expect(routerLogic.inputs[0].amountBps).to.eq(amountBps);
          expect(routerLogic.inputs[0].amountOrOffset).to.eq(32);
        } else {
          expect(routerLogic.inputs[0].amountBps).to.eq(constants.MaxUint256);
          expect(routerLogic.inputs[0].amountOrOffset).to.eq(input.amountWei);
        }
        expect(routerLogic.wrapMode).to.eq(input.token.isNative ? core.WrapMode.wrapBefore : core.WrapMode.none);
        expect(routerLogic.approveTo).to.eq(constants.AddressZero);
        expect(routerLogic.callback).to.eq(constants.AddressZero);
      });
    });
  });
});
