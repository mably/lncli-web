const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

// set log verbosity level
grpc.setLogVerbosity(0);

// load app default configuration data
const config = require('./config/config');

// load proto file
const lnrpcProto = grpc.loadPackageDefinition(protoLoader.loadSync(config.lndProto));
const lnrpc = lnrpcProto.lnrpc;

/**
 * TODO
 */
function empty(call, callback) {
  callback(null, { });
}

/**
 * TODO
 */
function getInfo(call, callback) {
  const response = {
    identity_pubkey: '03c892e3f3f077ea1e381c081abb36491a2502bc43ed37ffb82e264224f325ff27',
    alias: '',
    num_pending_channels: 0,
    num_active_channels: 1,
    num_peers: 2,
    block_height: 1088114,
    block_hash: '0000000000000879ae5706f8a665d46f0efe8b4f760f622262e844f5c31ef6fb',
    synced_to_chain: true,
    testnet: true,
  };
  callback(null, response);
}

/**
 * TODO
 */
function getNetworkInfo(call, callback) {
  const response = {
    graph_diameter: 0,
    avg_out_degree: 1.1016949152542372,
    max_out_degree: 44,
    num_nodes: 59,
    num_channels: 65,
    total_network_capacity: 1184278595,
    avg_channel_size: 18219670.692307692,
    min_channel_size: -4400,
    max_channel_size: 300000000,
  };
  callback(null, response);
}

/**
 * TODO
 */
function walletBalance(call, callback) {
  const response = {
    balance: 0.09943829,
  };
  callback(null, response);
}

/**
 * TODO
 */
function channelBalance(call, callback) {
  const response = {
    balance: 3002010,
  };
  callback(null, response);
}

/**
 * TODO
 */
function listPeers(call, callback) {
  const response = {
    peers: [
      {
        pub_key: '036a0c5ea35df8a528b98edf6f290b28676d51d0fe202b073fe677612a39c0aa09',
        peer_id: 1,
        address: '159.203.125.125:10011',
        bytes_sent: 74268,
        bytes_recv: 104836,
        sat_sent: 0,
        sat_recv: 2000,
        inbound: false,
        ping_time: 85241,
      },
      {
        pub_key: '034106ba0a6ffdb98f345b2d39173d236575aa9b18f68542db7c5dc7d561ff68da',
        peer_id: 3,
        address: '107.131.125.191:51953',
        bytes_sent: 73518,
        bytes_recv: 65666,
        sat_sent: 0,
        sat_recv: 0,
        inbound: false,
        ping_time: 175660,
      },
    ],
  };
  callback(null, response);
}

/**
 * TODO
 */
function listChannels(call, callback) {
  const response = {
    channels: [
      {
        remote_pubkey: '036a0c5ea35df8a528b98edf6f290b28676d51d0fe202b073fe677612a39c0aa09',
        channel_point: '5780f0165552e5d36d1fba7fcd43f555cb3abfa75cc636318595f823e8886261:0',
        chan_id: '1196350014884020224',
        capacity: 4005000,
        local_balance: 3002000,
        remote_balance: 998000,
        unsettled_balance: 0,
        total_satoshis_sent: 0,
        total_satoshis_received: 2000,
        num_updates: 4000,
        pending_htlcs: [],
      },
      {
        remote_pubkey: '03f5f555553eb38ba65bac34b58a042c4fc9bac2078d1d5a978a80affae6cddf4b',
        channel_point: 'bce9f7f56e580f599fffc323ae337c52c3636c020f5e8220c60ff56524a8c20e:0',
        chan_id: '1196348915372654592',
        capacity: '7000',
        local_balance: '10',
        remote_balance: '1990',
        unsettled_balance: '0',
        total_satoshis_sent: '1000',
        total_satoshis_received: '10',
        num_updates: '4',
        pending_htlcs: [],
      },
    ],
  };
  callback(null, response);
}

/**
 * TODO
 */
function pendingChannels(call, callback) {
  const response = {
    pending_channels: [
      {
        peer_id: 1,
        identity_key: '036a0c5ea35df8a528b98edf6f290b28676d51d0fe202b073fe677612a39c0aa09',
        channel_point: 'cb7ee1e3018c61a271347e8a8dd1147f6e508a3ff32ecfb1335cbc17ba24e96a:0',
        capacity: 1500000,
        local_balance: 500000,
        remote_balance: 1000000,
        closing_txid: '',
        status: 'OPENING',
      },
    ],
  };
  callback(null, response);
}

/**
 * TODO
 */
function listInvoices(call, callback) {
  const response = {
    invoices: [
      {
        memo: 'test home->droplet',
        receipt: Buffer.from([]),
        r_preimage: Buffer.from([
          26, 159, 8, 50, 177, 27, 124, 82,
          151, 41, 7, 110, 78, 21, 185, 199,
          28, 207, 117, 78, 22, 39, 32, 185,
          61, 25, 92, 30, 14, 209, 220, 22,
        ]),
        r_hash: Buffer.from([]),
        value: 10,
        settled: true,
        creation_date: 1486625141,
        settle_date: 0,
        payment_request: 'yxrjfa9u6b56w8tadorbiq3sjrpnkyihexsux97afaurrj8urz91qqfhdmamza7ykerr4iuwgj1pr4d9zot4bubauagj3we6k11r6eh8yyyyyyyyyyyyw3418wwy',
      },
    ],
  };
  callback(null, response);
}

/**
 * TODO
 */
function listPayments(call, callback) {
  const response = {
    payments: [
      {
        payment_hash: 'd4c96aa1853976a9636ebca51ed937903173b3c91eec5254d8addb19cef51242',
        value: '1000',
        creation_date: '1486625092',
        path: [
          '03f5f555553eb38ba65bac34b58a042c4fc9bac2078d1d5a978a80affae6cddf4b',
        ],
        fee: '0',
      },
    ],
  };
  callback(null, response);
}

/**
 * Get a new server with the handler functions in this file bound to the methods
 * it serves.
 * @return {Server} The new server object
 */
function getServer() {
  const server = new grpc.Server();
  server.addProtoService(lnrpc.Lightning.service, {
    getInfo,
    getNetworkInfo,
    walletBalance,
    channelBalance,
    getTransactions: empty,
    sendCoins: empty,
    subscribeTransactions: empty,
    sendMany: empty,
    newAddress: empty,
    newWitnessAddress: empty,
    connectPeer: empty,
    listPeers,
    pendingChannels,
    listChannels,
    openChannelSync: empty,
    openChannel: empty,
    closeChannel: empty,
    sendPayment: empty,
    sendPaymentSync: empty,
    addInvoice: empty,
    listInvoices,
    lookupInvoice: empty,
    subscribeInvoices: empty,
    decodePayReq: empty,
    listPayments,
    deleteAllPayments: empty,
    describeGraph: empty,
    getChanInfo: empty,
    getNodeInfo: empty,
    queryRoute: empty,
    setAlias: empty,
    debugLevel: empty,
  });
  return server;
}

if (require.main === module) {
  const server = getServer();
  const lndPort = config.lndHost.split(':')[1];
  server.bind(`0.0.0.0:${lndPort}`, grpc.ServerCredentials.createInsecure());
  server.start();
  console.log(`lnd mockup server started, listening on port ${lndPort}`);
}

exports.getServer = getServer;
