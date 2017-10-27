/// <reference types="node" />

type AbiEncodedData = string;
type Address = string;
type Bytes32 = string;
type Int256 = string;

interface AugurJsOptions {
  debug: {
    [optionName: string]: boolean,
  };
}

// TODO replace ApiParams and ApiFunction with specific param names/types where possible (use jsdoc comments)

export interface ApiParams {
  [paramName: string]: any;
}

export type ApiCallback = (err?: Error|string|object|null, result?: any) => void;

export type ApiFunction = (p: ApiParams, callback?: ApiCallback) => any;

export interface AutogeneratedContractApi {
  [contractName: string]: {
    [functionName: string]: ApiFunction,
  };
}

export interface FunctionAbi {
  constant: boolean;
  name: string;
  inputs: Array<string>;
  signature: Array<string>;
  returns?: string;
}

export interface EventAbiInput {
  indexed: boolean;
  type: string;
  name: string;
}

export interface FunctionsAbiMap {
  [contractName: string]: {
    [functionName: string]: FunctionAbi,
  };
}

export interface EventsAbiMap {
  [contractName: string]: {
    [eventName: string]: {
      contract?: string;
      inputs: Array<EventAbiInput>
    },
  };
}

export interface AbiMap {
  functions: FunctionsAbiMap;
  events: EventsAbiMap;
}

export interface ContractNameToAddressMap {
  [networkID: string]: {
    [contractName: string]: Address,
  };
}

export interface EventLog {
  address: Address;
  categories: Array<Int256>;
  data: AbiEncodedData;
  blockNumber: Int256;
  transactionIndex: Int256;
  transactionHash: Bytes32;
  blockHash: Bytes32;
}

export interface FormattedEventLog {
  address: Address;
  blockNumber: number;
  transactionIndex: Int256;
  transactionHash: Bytes32;
  blockHash: Bytes32;
  [inputName: string]: any;
}

type EventSubscriptionCallback = (eventLog: FormattedEventLog) => void;

interface EventSubscriptionCallbacks {
  [contractName: string]: {
    [eventName: string]: EventSubscriptionCallback,
  };
}

export interface CalculatedProfitLoss {
  realized: string;
  unrealized: string;
  position: string;
  meanOpenPrice: string;
  queued: string;
}

export interface SimulatedTrade {
  settlementFees: string;
  gasFees: string;
  sharesDepleted: string;
  otherSharesDepleted: string;
  tokensDepleted: string;
  shareBalances: Array<string>;
}

export interface RpcInterface {
  errors: any; // TODO define RPC errors object
  eth: {
    [jsonRpcMethodName: string]: (params?: any, callback?: (response: any) => void) => string|number|null;
  };
  createRpcInterface(): RpcInterface;
  clear(): void;
  getBlockStream(): any; // TODO import blockstream type from ethereumjs-blockstream
  getCoinbase(): Address;
  getCurrentBlock(): any; // TODO define block type
  getGasPrice(): number;
  getNetworkID(): string;
  getLogs(filter: any, callback: (logs: Array<EventLog>) => void): Array<string>|null; // TODO define log filter type
  getTransactionReceipt(transactionHash: Bytes32, callback?: (transactionReceipt: any) => void): any; // TODO define transaction receipt type
  isUnlocked(account: Address, callback?: (isUnlocked: boolean) => void): boolean|void;
  sendEther(to: Address, value: string|number, from: Address, onSent: (result: any) => void, onSuccess: (result: any) => void, onFailed: (err: any) => void): any;
  packageAndSubmitRawTransaction(payload: any, address: Address, privateKeyOrSigner: Buffer|null, callback: (transactionHash: Bytes32|Error) => void): void; // TODO define payload type
  callContractFunction(payload: any, callback: (returnValue: Bytes32|Error) => void): Bytes32|void;
  transact(payload: any, privateKeyOrSigner: Buffer|null, onSent: (result: any) => void, onSuccess: (result: any) => void, onFailed: (err: any) => void): void;
  excludeFromTransactionRelay(method: string): void;
  registerTransactionRelay(relayer: any): void; // TODO define relayer type
  setDebugOptions(debugOptions: {[debugOptionName: string]: boolean}): void;
}

export class Augur {
  public version: string;
  public options: AugurJsOptions;
  public accounts: {
    getAccountTransferHistory: ApiFunction;
    importAccount: ApiFunction;
    login: ApiFunction;
    register: ApiFunction
    loginWithMasterKey(p: ApiParams): {
      address: Address;
      privateKey: Buffer;
      derivedKey: Buffer;
    };
    logout(): void;
  };
  public api: AutogeneratedContractApi;
  public assets: {
    [functionName: string]: ApiFunction,
  };
  public constants: {
    [constantName: string]: any;
  };
  public contracts: {
    abi: AbiMap;
    addresses: ContractNameToAddressMap
  };
  public createMarket: {
    [functionName: string]: ApiFunction,
  };
  public events: {
    getAllAugurLogs: ApiFunction;
    startListeners(onEventCallbacks?: EventSubscriptionCallbacks, onBlockAdded?: (blockNumber: Int256) => void, onBlockRemoved?: (blockNumber: Int256) => void, onSetupComplete?: () => void): void;
    stopListeners(): boolean
  };
  public markets: {
    getMarketInfo: ApiFunction;
    getMarketsInfo: ApiFunction;
    batchGetMarketInfo: ApiFunction;
    getMarketPriceHistory: ApiFunction;
    getMarketsCreatedByUser: ApiFunction
  };
  public reporting: {
    getReportingHistory: ApiFunction;
    submitReport: ApiFunction;
    finalizeMarket: ApiFunction;
    migrateLosingTokens: ApiFunction;
    redeem: ApiFunction;
    getCurrentPeriodProgress(reportingPeriodDurationInSeconds: number, timestamp?: number|null): number;
  };
  public rpc: RpcInterface;
  public trading: {
    claimMarketsProceeds: ApiFunction;
    getPositionInMarket: ApiFunction;
    tradeUntilAmountIsZero: ApiFunction;
    orderBook: {
      getOrderBook: ApiFunction;
      filterByPriceAndOutcomeAndUserSortByPrice(orderBook: any, orderType: number, price: any, userAddress: Address): any // TODO define order book type, import BigNumber type for price
    }
    simulateTrade(p: ApiParams): SimulatedTrade;
    calculateProfitLoss(p: ApiParams): CalculatedProfitLoss;
    normalizePrice(p: ApiParams): string;
    denormalizePrice(p: ApiParams): string;
  };
  public connect(p: ApiParams, callback?: ApiCallback): void;
  public generateContractApi(functionsAbi: any): AutogeneratedContractApi;
}

export default Augur;
