import * as core from 'src/core';
import { expect } from 'chai';
import * as utils from './utils';

describe('Test calcAmountBps', function () {
  const cases = [
    { amountWei: 0, balanceWei: 200, expected: 0 },
    { amountWei: 20, balanceWei: 200, expected: 1000 },
    { amountWei: 100, balanceWei: 200, expected: 5000 },
    { amountWei: 123, balanceWei: 200, expected: 6150 },
    { amountWei: 123, balanceWei: 456, expected: 2697 },
    { amountWei: 200, balanceWei: 200, expected: 10000 },
  ];

  cases.forEach(({ amountWei, balanceWei, expected }, i) => {
    it(`case ${i + 1}`, function () {
      expect(utils.calcAmountBps(amountWei, balanceWei)).to.eq(expected);
    });
  });
});

describe('Test calcAmountMin', function () {
  const cases = [
    { amountWei: 100, slippage: 100, expected: 99 },
    { amountWei: 100, slippage: 1000, expected: 90 },
    { amountWei: 100, slippage: 10000, expected: 0 },
    { amountWei: 123, slippage: 4567, expected: 66 },
  ];

  cases.forEach(({ amountWei, slippage, expected }, i) => {
    it(`case ${i + 1}`, function () {
      expect(utils.calcAmountMin(amountWei, slippage)).to.eq(expected);
    });
  });
});

describe('Test calcAmountMin', function () {
  const cases: Array<{ balances: core.tokens.TokenAmounts; expected: string[] }> = [
    {
      balances: new core.tokens.TokenAmounts([core.tokens.mainnet.ETH, '1'], [core.tokens.mainnet.USDC, '1']),
      expected: [core.tokens.mainnet.ETH.elasticAddress, core.tokens.mainnet.USDC.address],
    },
    {
      balances: new core.tokens.TokenAmounts([core.tokens.mainnet.WETH, '1'], [core.tokens.mainnet.DAI, '1']),
      expected: [core.tokens.mainnet.WETH.address, core.tokens.mainnet.DAI.address],
    },
  ];

  cases.forEach(({ balances, expected }, i) => {
    it(`case ${i + 1}`, function () {
      expect(utils.toTokensReturn(balances)).to.deep.eq(expected);
    });
  });
});