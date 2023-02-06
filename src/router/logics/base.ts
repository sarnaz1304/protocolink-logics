import { IRouter } from '../contracts/Router';
import { PromiseOrValue } from 'src/types';
import * as config from '../config';
import * as core from 'src/core';

export type LogicBaseOptions<T extends object = object> = core.Web3ToolkitOptions<T>;

export abstract class LogicBase extends core.Web3Toolkit {
  public readonly routerConfig: config.RouterConfig;

  constructor(options: core.Web3ToolkitOptions) {
    super(options);

    const { chainId } = options;
    this.routerConfig = config.getConfig(chainId);
  }

  abstract getLogic(options: unknown): PromiseOrValue<IRouter.LogicStruct>;
}