/**
 * Ethereum network connection / contract lookup.
 */

"use strict";

var clone = require("clone");
var abi = require("augur-abi");
var connector = require("ethereumjs-connect");
var Contracts = require("augur-contracts");
var constants = require("../constants");
var compose = require("../utils/compose");
var isFunction = require("../utils/is-function");
var store = require("../store");

module.exports = {

  /**
   * Direct no-frills bindings to Augur's Serpent (contract) API.
   *  - Parameter positions and types are the same as the underlying
   *    contract method's parameters.
   *  - Parameters should be passed in exactly as they would be
   *    passed to the contract method (e.g., if the contract method
   *    expects a fixed-point number, you must do that conversion
   *    yourself and pass the fixed-point number in).
   */
  bindContractMethod: function (contract, method) {
    var self = this;
    return function () {
      var tx, params, numInputs, numFixed, cb, i, onSent, onSuccess, onFailed;
      tx = clone(store.getState().contractsAPI.functions[contract][method]);
      if (!arguments || !arguments.length) {
        if (!tx.send) return self.fire(tx);
        return self.transact(tx);
      }
      params = Array.prototype.slice.call(arguments);
      numInputs = (tx.inputs && tx.inputs.length) ? tx.inputs.length : 0;
      if (!tx.send) {
        if (params && params[0] !== undefined && params[0] !== null && params[0].constructor === Object) {
          cb = params[0].callback;
          if (numInputs) {
            tx.params = new Array(numInputs);
            for (i = 0; i < numInputs; ++i) {
              tx.params[i] = params[0][tx.inputs[i]];
            }
          }
        } else {
          if (numInputs) {
            tx.params = new Array(numInputs);
            for (i = 0; i < numInputs; ++i) {
              tx.params[i] = params[i];
            }
          }
          if (params.length > numInputs && isFunction(params[numInputs])) {
            cb = params[numInputs];
          }
        }
        if (tx.fixed && tx.fixed.length) {
          numFixed = tx.fixed.length;
          for (i = 0; i < numFixed; ++i) {
            tx.params[tx.fixed[i]] = abi.fix(tx.params[tx.fixed[i]], "hex");
          }
        }
        if (!tx.parser) {
          if (!isFunction(cb)) return self.fire(tx);
          return self.fire(tx, cb);
        }
        if (!isFunction(cb)) return self[tx.parser](self.fire(tx));
        return self.fire(tx, cb, self[tx.parser]);
      }
      if (params && params[0] !== undefined && params[0] !== null && params[0].constructor === Object) {
        onSent = params[0].onSent;
        onSuccess = params[0].onSuccess;
        onFailed = params[0].onFailed;
        if (numInputs) {
          tx.params = new Array(numInputs);
          for (i = 0; i < tx.inputs.length; ++i) {
            tx.params[i] = params[0][tx.inputs[i]];
          }
        }
      } else {
        if (numInputs) {
          tx.params = new Array(numInputs);
          for (i = 0; i < tx.inputs.length; ++i) {
            tx.params[i] = params[i];
          }
        }
        if (params.length > numInputs && isFunction(params[numInputs])) {
          onSent = params[numInputs];
        }
        if (params.length > numInputs && isFunction(params[numInputs + 1])) {
          onSuccess = params[numInputs + 1];
        }
        if (params.length > numInputs && isFunction(params[numInputs + 2])) {
          onFailed = params[numInputs + 2];
        }
      }
      if (tx.fixed && tx.fixed.length) {
        numFixed = tx.fixed.length;
        for (i = 0; i < numFixed; ++i) {
          tx.params[tx.fixed[i]] = abi.fix(tx.params[tx.fixed[i]], "hex");
        }
      }
      if (!tx.parser) {
        return self.transact(tx, onSent, onSuccess, onFailed);
      }
      return self.transact(tx, onSent, compose(self[tx.parser], onSuccess), onFailed);
    };
  },

  bindContractAPI: function (methods) {
    var contract, method;
    methods = methods || store.getState().contractsAPI.functions;
    for (contract in methods) {
      if (methods.hasOwnProperty(contract)) {
        this[contract] = {};
        for (method in methods[contract]) {
          if (methods[contract].hasOwnProperty(method)) {
            this[contract][method] = this.bindContractMethod(contract, method);
            // TODO remove root-level auto bindings
            if (!this[method]) this[method] = this[contract][method];
          }
        }
      }
    }
    return methods;
  },

  sync: function () {
    var api;
    if (connector && connector.constructor === Object) {
      store.dispatch({
        type: "SET_FROM_ADDRESS",
        fromAddress: connector.state.from
      });
      store.dispatch({
        type: "SET_COINBASE_ADDRESS",
        coinbaseAddress: connector.state.coinbase
      });
      this.rpc = connector.rpc;
      if (!connector.state.contracts) {
        connector.configure({contracts: Contracts, api: Contracts.api});
        if (!connector.state.networkID) {
          connector.state.networkID = constants.DEFAULT_NETWORK_ID;
        }
        connector.setContracts();
      }
      store.dispatch({
        type: "SET_CONTRACT_ADDRESSES",
        contractAddresses: connector.state.contracts
      });
      connector.setupFunctionsAPI();
      connector.setupEventsAPI();
      if (connector.state.api && connector.state.api.functions) {
        api = connector.state.api;
      } else {
        api = Contracts.api;
      }
      store.dispatch({
        type: "SET_CONTRACTS_API",
        contractsAPI: api
      });
      // this.tx = store.getState().contractsAPI.functions; // TODO remove tx prop
      this.bindContractAPI();
      return true;
    }
    return false;
  },

  useAccount: function (account) {
    connector.from = account;
    connector.setFrom(account);
    this.sync();
  },

  /**
   * @param rpcinfo {Object|string=} Two forms accepted:
   *    1. Object with connection info fields:
   *       { http: "https://eth3.augur.net",
   *         ipc: "/path/to/geth.ipc",
   *         ws: "wss://ws.augur.net" }
   *    2. URL string for HTTP RPC: "https://eth3.augur.net"
   * @param cb {function=} Callback function.
   */
  connect: function (rpcinfo, cb) {
    var options, connection, self = this;
    options = {
      contracts: Contracts,
      api: Contracts.api,
      httpAddresses: [],
      wsAddresses: [],
      ipcAddresses: []
    };
    if (rpcinfo) {
      switch (rpcinfo.constructor) {
        case String:
          options.httpAddresses.push(rpcinfo);
          break;
        case Function:
          cb = rpcinfo;
          break;
        case Object:
          if (rpcinfo.httpAddresses) options.httpAddresses = rpcinfo.httpAddresses;
          if (rpcinfo.wsAddresses) options.wsAddresses = rpcinfo.wsAddresses;
          if (rpcinfo.ipcAddresses) options.ipcAddresses = rpcinfo.ipcAddresses;
          if (rpcinfo.http) options.httpAddresses.push(rpcinfo.http);
          if (rpcinfo.ws) options.wsAddresses.push(rpcinfo.ws);
          if (rpcinfo.ipc) options.ipcAddresses.push(rpcinfo.ipc);
          options.contracts = Contracts;
          options.api = Contracts.api;
          break;
        default:
          break;
      }
    }
    if (!isFunction(cb)) {
      connection = connector.connect(options);
      this.sync();
      return connection;
    }
    connector.connect(options, function (connection) {
      self.sync();
      cb(connection);
    });
  }
};
