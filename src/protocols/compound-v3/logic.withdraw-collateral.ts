import { Comet__factory } from './contracts';
import { Service } from './service';
import * as common from '@composable-router/common';
import * as core from '@composable-router/core';
import { getMarket, getMarkets } from './config';

export type WithdrawCollateralLogicFields = core.TokenOutFields<{ marketId: string }>;

export type WithdrawCollateralLogicOptions = Pick<core.GlobalOptions, 'account'>;

@core.LogicDefinitionDecorator()
export class WithdrawCollateralLogic extends core.Logic implements core.LogicTokenListInterface {
  static readonly supportedChainIds = [common.ChainId.mainnet, common.ChainId.polygon];

  async getTokenList() {
    const tokenList: Record<string, common.Token[]> = {};

    const service = new Service(this.chainId, this.provider);
    const markets = getMarkets(this.chainId);
    for (const market of markets) {
      const collaterals = await service.getCollaterals(market.id);
      tokenList[market.id] = collaterals.map((collateral) => collateral.wrapped);
    }

    return tokenList;
  }

  async getLogic(fields: WithdrawCollateralLogicFields, options: WithdrawCollateralLogicOptions) {
    const { marketId, output } = fields;
    const { account } = options;

    const market = getMarket(this.chainId, marketId);
    const userAgent = core.calcAccountAgent(this.chainId, account);

    const to = market.cometAddress;
    const data = Comet__factory.createInterface().encodeFunctionData('withdrawFrom', [
      account,
      userAgent,
      output.token.address,
      output.amountWei,
    ]);

    return core.newLogic({ to, data });
  }
}
