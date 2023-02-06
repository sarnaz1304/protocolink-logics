import { BigNumberish, constants } from 'ethers';
import { IRouter } from '../contracts/Router';
import * as core from 'src/core';
import * as utils from '../utils';

export interface NewLogicInputOptions {
  input: core.tokens.TokenAmount;
  amountBps?: BigNumberish;
  amountOffset?: BigNumberish;
}

export function newLogicInput(options: NewLogicInputOptions): IRouter.InputStruct {
  const { input } = options;

  let amountBps: BigNumberish;
  let amountOrOffset: BigNumberish;
  if (options.amountBps && options.amountOffset) {
    amountBps = options.amountBps;
    amountOrOffset = options.amountOffset;
  } else {
    amountBps = constants.MaxUint256;
    amountOrOffset = input.amountWei;
  }

  return { token: input.token.elasticAddress, amountBps, amountOrOffset, doApprove: !input.token.isNative() };
}

export interface NewLogicOutputOptions {
  output: core.tokens.TokenAmount;
  slippage: number;
}

export function newLogicOutput(options: NewLogicOutputOptions): IRouter.OutputStruct {
  const { output, slippage } = options;

  return {
    token: output.token.elasticAddress,
    amountMin: utils.calcAmountMin(output.amountWei, slippage),
  };
}