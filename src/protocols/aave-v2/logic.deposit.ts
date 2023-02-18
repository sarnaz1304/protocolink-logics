import { BigNumberish } from 'ethers';
import { LendingPool__factory } from './contracts';
import { Service } from './service';
import * as common from '@composable-router/common';
import * as core from '@composable-router/core';
import invariant from 'tiny-invariant';

export type DepositLogicParams = core.TokenToTokenExactInParams;

export type DepositLogicFields = core.TokenToTokenFields<{ referralCode?: number }>;

@core.LogicDefinitionDecorator()
export class DepositLogic extends core.ExchangeLogic {
  static readonly supportedChainIds = [common.ChainId.mainnet, common.ChainId.polygon, common.ChainId.avalanche];

  async getPrice(params: DepositLogicParams) {
    const { input, tokenOut } = params;
    invariant(!input.token.isNative(), 'tokenIn should not be native token');
    const output = new common.TokenAmount(tokenOut, input.amount);

    return output;
  }

  async getLogic(fields: DepositLogicFields) {
    const { input, amountBps, referralCode = 0 } = fields;
    invariant(!input.token.isNative(), 'tokenIn should not be native token');

    const service = new Service(this.chainId, this.provider);
    const to = await service.getLendingPoolAddress();
    const data = LendingPool__factory.createInterface().encodeFunctionData('deposit', [
      input.token.address,
      input.amountWei,
      core.getContractAddress(this.chainId, 'Router'),
      referralCode,
    ]);
    let amountOffset: BigNumberish | undefined;
    if (amountBps) amountOffset = common.getParamOffset(1);
    const inputs = [core.newLogicInput({ input, amountBps, amountOffset })];

    return core.newLogic({ to, data, inputs });
  }
}
