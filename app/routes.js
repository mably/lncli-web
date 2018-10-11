// app/routes.js

const graphviz = require('graphviz');

const DEFAULT_MAX_NUM_ROUTES_TO_QUERY = 10;
const DEFAULT_FINAL_CLTV_DELTA = 144;

// expose the routes to our app with module.exports
module.exports = function factory(app, lightning, db, config) {
  /*
   * Creates an adapter between Express requests and Lightning gRPC requests via LightningManager.
   *
   * @param {string} methodName - the RPC call to perform on the Lightning service
   * @param {?bool} options.isLimitedToAuthorizedUser - forces request to come from an autorized
   *                                                    client
   * @param {?function} options.preHook - if present, calls the function associated with this
   *                                      variable,
   *                                      and feeds the result as parameters to the RPC call.
   * @param {?function} options.postHook - if present, calls the function associated with this
   *                                       variable, and transforms the result from the RPC call.
   *                                       This function must return a valid Object.
   */
  const lightningRPCAdapter = (methodName, options) => async (req, res) => {
    options = options || {};

    // if isLimitedToAuthorizedUser is true, we check if the `limituser` flag
    // is set on the request, and short-circuit the request if the user is not
    // authorized.
    if (options.isLimitedToAuthorizedUser && req.limituser) {
      res.sendStatus(403);
    }

    // By default, input parameters are empty. if preHook was defined, we call
    // this and use the result and input parameters
    let params = {};
    if (options.preHook) {
      params = options.preHook(req);
    }

    try {
      let response = await lightning.call(methodName, params);

      // If result needs to be manipulated before it's returned
      // to the client (because postHook is defined), call postHook
      // and use the result as payload to return via JSON
      if (options.postHook) {
        response = options.postHook(req, response);
      }
      res.json(response);
    } catch (e) {
      res.json({ error: e });
    }
  };

  // api ---------------------------------------------------------------------
  app.get('/api/lnd/getnetworkinfo', lightningRPCAdapter('getNetworkInfo'));
  app.get('/api/lnd/listpeers', lightningRPCAdapter('listPeers'));
  app.get('/api/lnd/listchannels', lightningRPCAdapter('listChannels'));
  app.get('/api/lnd/pendingchannels', lightningRPCAdapter('pendingChannels'));
  app.get('/api/lnd/listpayments', lightningRPCAdapter('listPayments'));
  app.get('/api/lnd/walletbalance', lightningRPCAdapter('walletBalance'));
  app.get('/api/lnd/channelbalance', lightningRPCAdapter('channelBalance'));

  app.get('/api/lnd/listinvoices', lightningRPCAdapter('listInvoices', {
    preHook: (/* req */) => ({ reversed: true, num_max_invoices: 100000 }),
  }));

  app.get('/api/lnd/forwardinghistory', lightningRPCAdapter('forwardingHistory', {
    preHook: (/* req */) => ({ num_max_events: 100000 }),
  }));

  app.post('/api/lnd/getnodeinfo', lightningRPCAdapter('getNodeInfo', {
    preHook: req => ({ pub_key: req.body.pubkey }),
  }));

  app.get('/api/lnd/getinfo', lightningRPCAdapter('getInfo', {
    postHook: (req, response) => {
      if ((!response.uris || response.uris.length === 0) && (config.lndAddress)) {
        response.uris = [`${response.identity_pubkey}@${config.lndAddress}`];
      }
      return response;
    },
  }));

  app.post('/api/lnd/connectpeer', lightningRPCAdapter('connectPeer', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({ addr: { pubkey: req.body.pubkey, host: req.body.host }, perm: true }),
  }));

  app.post('/api/lnd/disconnectpeer', lightningRPCAdapter('disconnectPeer', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({ pub_key: req.body.pubkey }),
  }));

  app.post('/api/lnd/addinvoice', lightningRPCAdapter('addInvoice', {
    isLimitedToAuthorizedUser: true,
    preHook: (req) => {
      const invoiceRequest = { memo: req.body.memo };
      if (req.body.value) {
        invoiceRequest.value = req.body.value;
      }
      if (req.body.expiry) {
        invoiceRequest.expiry = req.body.expiry;
      }
      return invoiceRequest;
    },
  }));

  app.post('/api/lnd/sendpayment', lightningRPCAdapter('sendPaymentSync', {
    isLimitedToAuthorizedUser: true,
    preHook: (req) => {
      const paymentRequest = { payment_request: req.body.payreq };
      if (req.body.amt) {
        paymentRequest.amt = req.body.amt;
      }
      return paymentRequest;
    },
  }));

  app.post('/api/lnd/decodepayreq', lightningRPCAdapter('decodePayReq', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({ pay_req: req.body.payreq }),
  }));

  app.post('/api/lnd/queryroute', lightningRPCAdapter('queryRoutes', {
    preHook: (req) => {
      const numRoutes = config.maxNumRoutesToQuery || DEFAULT_MAX_NUM_ROUTES_TO_QUERY;
      const finalCltvDelta = config.finalCltvDelta || DEFAULT_FINAL_CLTV_DELTA;
      return {
        pub_key: req.body.pubkey,
        amt: req.body.amt,
        num_routes: numRoutes,
        final_cltv_delta: finalCltvDelta,
      };
    },
  }));

  app.post('/api/lnd/sendtoroute', lightningRPCAdapter('sendToRouteSync', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({
      payment_hash_string: req.body.payhash,
      routes: JSON.parse(req.body.routes),
    }),
  }));

  app.post('/api/lnd/newaddress', lightningRPCAdapter('newAddress', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({ type: req.body.type }),
  }));

  app.post('/api/lnd/sendcoins', lightningRPCAdapter('sendCoins', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({ addr: req.body.addr, amount: req.body.amount }),
  }));

  app.post('/api/lnd/rendergraph', lightningRPCAdapter('describeGraph', {
    isLimitedToAuthorizedUser: true,
    postHook: (req, response) => {
      const peers = req.body.peers || {};

      const nodesMap = {};
      const { nodes } = response;
      let i;
      let node;
      for (i = 0; i < nodes.length; i += 1) {
        node = nodes[i];
        nodesMap[node.pub_key] = node;
      }

      const channeledNodes = {};
      const { edges } = response;
      let edge;
      for (i = 0; i < edges.length; i += 1) {
        edge = edges[i];
        if (nodesMap[edge.node1_pub] && nodesMap[edge.node2_pub]) { // skip buggy edges
          channeledNodes[edge.node1_pub] = edge.node1_pub;
          channeledNodes[edge.node2_pub] = edge.node2_pub;
        }
      }

      // Create digraph
      const graphName = 'LightningNetwork';
      const g = graphviz.graph(graphName);

      Object.keys(channeledNodes).forEach((nodePubKey) => {
        // Add node
        node = nodesMap[nodePubKey];
        const peer = peers[nodePubKey];
        let nodeLabel;
        if (peer && peer.alias) {
          nodeLabel = peer.alias;
        } else {
          nodeLabel = node.pub_key.substr(0, 10);
        }
        console.log(node, nodeLabel);
        g.addNode(node.pub_key, { label: nodeLabel });
      });

      for (i = 0; i < edges.length; i += 1) {
        // Add edge
        edge = edges[i];
        if (channeledNodes[edge.node1_pub] && channeledNodes[edge.node2_pub]) { // skip buggy edges
          const edgeLabel = `${edge.channel_id.substr(0, 10)}`;
          g.addEdge(edge.node1_pub, edge.node2_pub, { label: edgeLabel, fontsize: '12.0' });
        }
      }

      // Print the dot script
      console.log(g.to_dot());

      // Set GraphViz path (if not in your path)
      // g.setGraphVizPath("/usr/local/bin");
      // Generate a SVG output
      g.output('svg', `${__dirname}/../data/networkgraph.svg`);
    },
  }));

  // networkgraph.svg
  app.get('/api/lnd/networkgraph.svg', (req, res) => {
    if (req.limituser) {
      return res.sendStatus(403); // forbidden
    }
    return res.sendFile('networkgraph.svg', { root: `${__dirname}/../data/` });
  });

  app.post('/api/lnd/signmessage', lightningRPCAdapter('signMessage', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({ msg: Buffer.from(req.body.msg, 'utf8') }),
  }));

  app.post('/api/lnd/verifymessage', lightningRPCAdapter('verifyMessage', {
    isLimitedToAuthorizedUser: true,
    preHook: req => ({
      msg: Buffer.from(req.body.msg, 'utf8'),
      signature: req.body.signature,
    }),
  }));

  // ln-payreq-auth.html
  app.get('/ln-payreq-auth.html', (req, res) => {
    res.send('Payment verified!');
  });

  // ln-sign-auth.html
  app.get('/ln-sign-auth.html', (req, res) => {
    res.send(`Signature verified! Authentication message was properly signed by node ${req.userpubkey}.`);
  });

  // ln-signpayreq-auth.html
  app.get('/ln-signpayreq-auth.html', (req, res) => {
    res.send(`Payment and signature verified! Authentication message was properly signed by node ${req.userpubkey}.`);
  });

  // application -------------------------------------------------------------
  app.get('*', (req, res) => {
    res.sendFile('lnd.html', { root: `${__dirname}/../public/` }); // load the single view file (angular will handle the page changes on the front-end)
  });
};
