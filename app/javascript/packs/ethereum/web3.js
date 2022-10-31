import Web3 from 'web3';
import axios from "axios";
import WalletConnectProvider from '@walletconnect/web3-provider'

const tokenURIPrefix = gon.tokenURIPrefix
const transferProxyContractAddress = gon.transferProxyContractAddress
const tokenAddress = gon.tokenAddress
const tradeContractAddress = gon.tradeContractAddress
const sessionWallet = gon.wallet
const sessionAddress = gon.address
const chainId = gon.chainId
let walletConnect;
const rpcUrl = gon.ethereum_provider

async function loadWeb3() {
  if (window.ethereum && window.wallet == 'metamask') {
    window.web3 = new Web3(window.ethereum);
    const address = await web3.currentProvider.enable();
    return window.ethereum.selectedAddress = address[0] ?? '';
  }else if (window.wallet == 'walletConnect') { 
    walletConnect = new WalletConnectProvider({
      rpc: {  
        [chainId]: rpcUrl,
      },
    });
    window.web3 = new Web3(walletConnect);
    const address = await walletConnect.enable();
    return address[0] ?? '';
  }
  
}



async function createUserSession(address, balance, destroySession, wallet = window.wallet) {
  const config = {
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }
  const resp = await axios.post(`/sessions`, {
    address: address,
    balance: balance,
    destroy_session: destroySession,
    wallet
  }, config)
    .then((response) => {
      return resp
    })
    .catch(err => {
    })
  return resp;
}

async function destroyUserSession(address) {
  const config = {
    data: {},
    headers: {
      'X-CSRF-TOKEN': $('[name="csrf-token"]')[0].content,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }
  const resp = axios.delete(`/sessions/${address}`, config)
    .then(response => response)
    .catch(err =>{})
  return resp
}

function updateTokenId(tokenId, collectionId, hash) {
  var request = $.ajax({
    url: `/collections/${collectionId}/update_token_id`,
    async: false,
    type: "POST",
    data: {tokenId : tokenId, collectionId: collectionId, tx_id: hash},
    dataType: "script"
  });
  request.done(function (msg) {
  });
  request.fail(function (jqXHR, textStatus) {
  });
}

function saveContractNonceValue(collectionId, sign) {
  var request = $.ajax({
    url: `/collections/${collectionId}/save_contract_nonce_value`,
    async: false,
    type: "POST",
    data: {signature : sign},
    dataType: "script"
  });
  request.done(function (msg) {
  });
  request.fail(function (jqXHR, textStatus) {
  });
}

function createContract(name, symbol, contract_address, contractType, collectionId) {
  var request = $.ajax({
    url: '/users/create_contract',
    async: false,
    type: "POST",
    data: {
      name: name,
      symbol: symbol,
      contract_address: contract_address,
      contract_type: contractType,
      collection_id: collectionId
    },
    dataType: "script"
  });
  request.done(function (msg) {
  });
  request.fail(function (jqXHR, textStatus) {
  });
}

function updateCollectionBuy(collectionId, quantity, transactionHash, tokenId=0) {
  var request = $.ajax({
    url: '/collections/' + collectionId + '/buy',
    type: 'POST',
    async: false,
    data: {quantity: quantity, transaction_hash: transactionHash, tokenId },
    dataType: "script",
    success: function (respVal) {
    }
  });
}

function updateCollectionSell(collectionId, buyerAddress, bidId, transactionHash, tokenId=0) {
  var request = $.ajax({
    url: '/collections/' + collectionId + '/sell',
    type: 'POST',
    async: false,
    data: {address: buyerAddress, bid_id: bidId, transaction_hash: transactionHash, tokenId},
    dataType: "script",
    success: function (respVal) {
    }
  });
}

function updateOwnerTransfer(collectionId, recipientAddress, transactionHash, transferQuantity) {
  var request = $.ajax({
    url: '/collections/' + collectionId + '/owner_transfer',
    type: 'POST',
    async: false,
    data: {recipient_address: recipientAddress, transaction_hash: transactionHash, transaction_quantity: transferQuantity},
    dataType: "script",
    success: function (respVal) {
    }
  });
}

function updateBurn(collectionId, transactionHash, burnQuantity) {
  var request = $.ajax({
    url: '/collections/' + collectionId + '/burn',
    type: 'POST',
    async: false,
    data: {transaction_hash: transactionHash, transaction_quantity: burnQuantity},
    dataType: "script",
    success: function (respVal) {
    }
  });
}

async function isValidUser(address, token, wallet) {
  const config = {
    headers: {
      'X-CSRF-TOKEN': token,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }
  const resp = await axios.get(`/sessions/valid_user`, {params: {address: address, authenticity_token: token, wallet}}, config)
    .then((response) => {
      return response.data
    })
    .catch(err => {
    })
  return resp;
}

function placeBid(collectionId, sign, quantity, bidDetails) {
  var request = $.ajax({
    url: `/collections/${collectionId}/bid`,
    type: "POST",
    async: false,
    data: {sign: sign, quantity: quantity, details: bidDetails},
    dataType: "script"
  });
  request.done(function (msg) {
  });
  request.fail(function (jqXHR, textStatus) {
  });
}

function signMetadataHash(collectionId, contractAddress) {
  var sign;
  var request = $.ajax({
    url: `/collections/${collectionId}/sign_metadata_hash`,
    type: "POST",
    async: false,
    data: {contract_address: contractAddress},
    dataType: "json"
  });
  request.done(function (msg) {
    sign = {sign: msg['signature'], nonce: msg['nonce']}
  });
  request.fail(function (jqXHR, textStatus) {
  });
  return sign
}

function sign_metadata_with_creator(creator_address, tokenURI, collectionId, trade_address=nil) {
  var sign;
  $.ajax({
    url: `/collections/${collectionId}/sign_metadata_with_creator`,
    type: "POST",
    async: false,
    data: {address: creator_address, tokenURI: tokenURI, trade_address: trade_address},
    dataType: "json"
  })
  .done(function(msg) {
    sign = {sign: msg['signature'], nonce: msg['nonce']}
  })
  .fail(function(jqXHR, textStatus) {
  });
  return sign;
}

function updateSignature(collectionId, sign) {
  var request = $.ajax({
    url: `/collections/${collectionId}/sign_fixed_price`,
    type: "POST",
    async: false,
    data: {sign: sign},
    dataType: "script"
  });
  request.done(function (msg) {
  });
  request.fail(function (jqXHR, textStatus) {
  });
}

function getNonceValue(collectionId) {
  var nonce;
  var request = $.ajax({
    url: `/collections/${collectionId}/get_nonce_value`,
    type: "POST",
    async: false,
    data: {},
    dataType: "json"
  });
  request.done(function (data) {
    nonce = data['nonce']
  });
  request.fail(function (jqXHR, textStatus) {
  });
  return nonce
}

function save_NonceValue(collectionId, sign, nonce) {
  var request = $.ajax({
    url: `/collections/${collectionId}/save_nonce_value`,
    type: "POST",
    async: false,
    data: {sign: sign, nonce: nonce},
    dataType: "script"
  });
  request.done(function (msg) {
  });
  request.fail(function (jqXHR, textStatus) {
  });
}

function getContractSignNonce(collectionId, sign) {
  var nonce;
  var request = $.ajax({
    url: `/collections/${collectionId}/get_contract_sign_nonce`,
    type: "POST",
    async: false,
    data: {sign: sign},
    dataType: "json"
  });
  request.done(function (data) {
    nonce = data['nonce']
  });
  request.fail(function (jqXHR, textStatus) {
  });
  return nonce
}

window.approveCollection = function approveCollection(collectionId){
  $.ajax({
    url: `/collections/${collectionId}/approve`,
    type: "POST",
    async: false,
    dataType: "script"
  }).done(function(msg) {
  }).fail(function(jqXHR, textStatus) {
  });
}

window.getContractABIAndBytecode = function getContractABIAndBytecode(contractAddress, type, shared = true) {
  var res;
  var request = $.ajax({
    async: false,
    url: '/contract_abi',
    type: "GET",
    data: {contract_address: contractAddress, type: type, shared: shared},
    dataType: "json"
  });

  request.done(function (msg) {
    res = msg;
  });

  request.fail(function (jqXHR, textStatus) {
  });
  return res;
}

function splitSign(sign, nonce) {
  sign = sign.slice(2)
  var r = `0x${sign.slice(0, 64)}`
  var s = `0x${sign.slice(64, 128)}`
  var v = web3.utils.toDecimal(`0x${sign.slice(128, 130)}`)
  return [v, r, s, nonce]
}


async function load721Contract(contractAddress) {
  return await new window.web3.eth.Contract([ { "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "ApprovalForAll", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "baseURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "tokenURI", "type": "string" }, { "internalType": "uint256", "name": "fee", "type": "uint256" } ], "name": "createCollectible", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getApproved", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getFee", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getOwner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" } ], "name": "isApprovedForAll", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "ownerOf", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "baseURI_", "type": "string" } ], "name": "setBaseURI", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" } ], "name": "supportsInterface", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "tokenByIndex", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tokenCounter", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "tokenOfOwnerByIndex", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "tokenURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ], contractAddress);
}

async function load1155Contract(contractAddress){
  return await new window.web3.eth.Contract([ { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "string", "name": "uri", "type": "string" } ], "name": "_setTokenURI", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "_tokenURIPrefix", "type": "string" } ], "name": "_setTokenURIPrefix", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" } ], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "ApprovalForAll", "type": "event" }, { "inputs": [ { "internalType": "string", "name": "uri", "type": "string" }, { "internalType": "uint256", "name": "supply", "type": "uint256" }, { "internalType": "uint256", "name": "fee", "type": "uint256" } ], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }, { "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "safeBatchTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256[]", "name": "ids", "type": "uint256[]" }, { "indexed": false, "internalType": "uint256[]", "name": "values", "type": "uint256[]" } ], "name": "TransferBatch", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "TransferSingle", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": false, "internalType": "string", "name": "value", "type": "string" }, { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" } ], "name": "URI", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "id", "type": "uint256" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address[]", "name": "accounts", "type": "address[]" }, { "internalType": "uint256[]", "name": "ids", "type": "uint256[]" } ], "name": "balanceOfBatch", "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "creators", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getFee", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getOwner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" } ], "name": "isApprovedForAll", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "royalties", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" } ], "name": "supportsInterface", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "tokenURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tokenURIPrefix", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" } ], contractAddress);
}

async function loadTransferProxyContract() {
  return await new window.web3.eth.Contract([{"inputs":[{"internalType":"contract IERC1155","name":"token","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"erc1155safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"token","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"erc20safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC721","name":"token","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"erc721safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}], "0xa08a50477D051a9f380b9E7F62a62707750B61c0");
}

window.getContract = async function getContract(contractAddress, type, shared = true) {
  var res = getContractABIAndBytecode(contractAddress, type, shared);
  var contractObj = await new window.web3.eth.Contract(res['compiled_contract_details']['abi'], contractAddress);
  return contractObj
}

window.createCollectible721 = async function createCollectible721(contractAddress, tokenURI, royaltyFee, collectionId, sharedCollection) {
  try {
    var account = getCurrentAccount()
    window.contract721 = await getContract(contractAddress, 'nft721', sharedCollection);
    var gasPrices = await gasPrice();
    if (sharedCollection) {
      var sign = await signMetadataHash(collectionId, contractAddress);
      await saveContractNonceValue(collectionId, sign)
      var signStruct = splitSign(sign['sign'], sign['nonce']);
      var txn = await window.contract721.methods.createCollectible(tokenURI, royaltyFee, signStruct).send({
        from: account,
        gas: 395268,
        gasPrice: String(gasPrices)
      });
    } else {
      var txn = await window.contract721.methods.createCollectible(tokenURI, royaltyFee).send({
        from: account,
        gas: 395268,
        gasPrice: String(gasPrices)
      });
    }
    var tokenId = txn.events.Transfer.returnValues['tokenId'];
    await updateTokenId(tokenId, collectionId, txn.transactionHash)
    return window.collectionMintSuccess(collectionId)
  } catch (err) {
    return window.collectionMintFailed(err['message'])
  }
}

window.createCollectible1155 = async function createCollectible1155(contractAddress, supply, tokenURI, royaltyFee, collectionId, sharedCollection) {
  try {
    var account = getCurrentAccount();
    window.contract1155 = await getContract(contractAddress, 'nft1155', sharedCollection);
    var gasPrices = await gasPrice();
    if (sharedCollection) {
      var sign = await signMetadataHash(collectionId, contractAddress);
      await saveContractNonceValue(collectionId, sign)
      var signStruct = splitSign(sign['sign'], sign['nonce']);
      var txn = await window.contract1155.methods.mint(tokenURI, supply, royaltyFee, signStruct).send({
        from: account,
        gas: 335268,
        gasPrice: String(gasPrices)
      });
    } else {
      var txn = await window.contract1155.methods.mint(tokenURI, supply, royaltyFee).send({
        from: account,
        gas: 335268,
        gasPrice: String(gasPrices)
      });
    }
    var tokenId = txn.events.TransferSingle.returnValues['id'];
    await updateTokenId(tokenId, collectionId, txn.transactionHash)
    return window.collectionMintSuccess(collectionId)
  } catch (err) {
    return window.collectionMintFailed(err['message'])
  }
}

window.deployContract = async function deployContract(abi, bytecode, name, symbol, contractType, collectionId) {
  const contractDeploy = new window.web3.eth.Contract(abi);
  var contractAddress;
  var account = getCurrentAccount()
  var gasPrices = await gasPrice();
  contractDeploy.deploy({
    data: bytecode,
    arguments: [name, symbol, tokenURIPrefix]
  }).send({
    from: account,
    gas: 5257874,
    gasPrice: String(gasPrices)
  }).then((deployment) => {
    contractAddress = deployment.options.address;
    $('#nft_contract_address').val(contractAddress);
    createContract(name, symbol, contractAddress, contractType, collectionId);
    window.contractDeploySuccess(contractAddress, contractType)
  }).catch((err) => {
    window.contractDeployFailed(err['message'])
  });
}

window.approveNFT = async function approveNFT(contractType, contractAddress, sharedCollection, sendBackTo = 'collection', existingToken=null) {
  try {
    var account = getCurrentAccount();
    window.contract = await getContract(contractAddress, contractType, sharedCollection);
    var isApproved = await window.contract.methods.isApprovedForAll(account, transferProxyContractAddress).call();
    var gasPrices = await gasPrice();
    if (!isApproved) {
      var receipt = await window.contract.methods.setApprovalForAll(transferProxyContractAddress, true).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    }
    if (sendBackTo == 'executeBid') {
      return window.approveBidSuccess()
    } else {
      return window.collectionApproveSuccess(contractType, existingToken);
    }
  } catch (err) {
    if (sendBackTo == 'executeBid') {
      return window.approveBidFailed(err['message'])
    } else {
      return window.collectionApproveFailed(err['message'])
    }
  }
}

window.approveResaleNFT = async function approveResaleNFT(contractType, contractAddress, sharedCollection) {
  try {
    var account = getCurrentAccount();
    window.contract = await getContract(contractAddress, contractType, sharedCollection);
    var isApproved = await window.contract.methods.isApprovedForAll(account, transferProxyContractAddress).call();
    var gasPrices = await gasPrice();
    if (!isApproved) {
      var receipt = await window.contract.methods.setApprovalForAll(transferProxyContractAddress, true).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    }
    return window.approveResaleSuccess(contractType);
  } catch (err) {
    return window.approveResaleFailed(err['message'])
  }
}

//TODO: OPTIMIZE
window.isApprovedNFT = async function isApprovedNFT(contractType, contractAddress) {
  try {
    var contract = await getContract(contractAddress, contractType);
    var account = getCurrentAccount()
    var isApproved = await contract.methods.isApprovedForAll(account, transferProxyContractAddress).call();
    return isApproved;
  } catch (err) {
  }
}

window.burnNFT = async function burnNFT(contractType, contractAddress, tokenId, supply = 1, collectionId, sharedCollection) {
  try {
    var contract = await getContract(contractAddress, contractType, sharedCollection);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    if (contractType == 'nft721') {
      var receipt = await contract.methods.burn(tokenId).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    } else if (contractType == 'nft1155') {
      var receipt = await contract.methods.burn(tokenId, supply).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    }
    await updateBurn(collectionId, receipt.transactionHash, supply)
    return window.burnSuccess(receipt.transactionHash);
  } catch (err) {
    return window.burnFailed(err['message'])
  }
}

window.directTransferNFT = async function directTransferNFT(contractType, contractAddress, recipientAddress, tokenId, supply = 1, shared, collectionId) {
  try {
    var contract = await getContract(contractAddress, contractType, shared);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    if (contractType == 'nft721') {
      var receipt = await contract.methods.safeTransferFrom(account, recipientAddress, tokenId).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    } else if (contractType == 'nft1155') {
      // TODO: Analyse and use proper one in future
      var tempData = "0x6d6168616d000000000000000000000000000000000000000000000000000000"
      var receipt = await contract.methods.safeTransferFrom(account, recipientAddress, tokenId, supply, tempData).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    }
      await updateOwnerTransfer(collectionId, recipientAddress, receipt.transactionHash, supply)
    return window.directTransferSuccess(receipt.transactionHash, collectionId);
  } catch (err) {
    return window.directTransferFailed(err['message']);
  }
}

window.approveERC20 = async function approveERC20(contractAddress, contractType, amount, decimals = 18, sendBackTo = 'Bid') {
  try {
    amount = roundNumber(mulBy(amount, 10 ** decimals), 0);
    var compiledContractDetails = getContractABIAndBytecode(contractAddress, contractType, gon.collection_data['contract_shared']);
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, contractAddress);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    var balance = await contract.methods.allowance(account, transferProxyContractAddress).call();
    amount = BigInt(parseInt(balance) + parseInt(amount)).toString()
    var receipt = await contract.methods.approve(transferProxyContractAddress, amount).send({from: account, gas: 316883, gasPrice: String(gasPrices)});
    if (sendBackTo == 'Buy') {
      return window.buyApproveSuccess(receipt.transactionHash, contractAddress)
    } else {
      return window.bidApproveSuccess(receipt.transactionHash, contractAddress)
    }
  } catch (err) {
    if (sendBackTo == 'Buy') {
      return window.buyApproveFailed(err['message'])
    } else {
      return window.bidApproveFailed(err['message'])
    }
  }
}

window.approvedTokenBalance = async function approvedTokenBalance(contractAddress) {
  var contract = await getContract(contractAddress, 'erc20', false);
  var account = getCurrentAccount();
  var balance = await contract.methods.allowance(account, transferProxyContractAddress).call();
  return balance;
}

window.convertToken = async function convertToken(amount, sendBackTo = 'Bid', decimals = 18) {
  try {
    amount = roundNumber(mulBy(amount, 10 ** decimals), 0);
    var compiledContractDetails = getContractABIAndBytecode(tokenAddress, 'erc20');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tokenAddress);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    var receipt = await contract.methods.deposit().send({from: account, value: amount, gas: 316883, gasPrice: String(gasPrices)});
    if (sendBackTo == 'Buy') {
      return window.buyConvertSuccess(receipt.transactionHash)
    } else {
      return window.bidConvertSuccess(receipt.transactionHash)
    }
  } catch (err) {
    if (sendBackTo == 'Buy') {
      return window.bidConvertFailed(err['message'])
    } else {
      return window.bidConvertFailed(err['message'])
    }

  }
}

window.updateBuyerServiceFee = async function updateBuyerServiceFee(buyerFeePermille) {
  try {
    var compiledContractDetails = getContractABIAndBytecode(tradeContractAddress, 'trade');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tradeContractAddress);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    var receipt = await contract.methods.setBuyerServiceFee(buyerFeePermille*10).send({from: account, gas: 316883,gasPrice: String(gasPrices)});
    if(String(receipt.status) === "true"){
      $("form#fee_form").submit();
      $("div.loading-gif.displayInMiddle").hide()
    }
  } catch (err) {
    console.error(err);
  }
}

window.updateSellerServiceFee = async function updateSellerServiceFee(sellerFeePermille) {
  try {
    var compiledContractDetails = getContractABIAndBytecode(tradeContractAddress, 'trade');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tradeContractAddress);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    var receipt = await contract.methods.setSellerServiceFee(sellerFeePermille*10).send({from: account, gas: 316883,gasPrice: String(gasPrices)});
    if(String(receipt.status) === "true"){
      $("form#fee_form").submit();
      $("div.loading-gif.displayInMiddle").hide();
    }
  } catch (err) {
    console.error(err);
  }
}

window.bidAsset = async function bidAsset(assetAddress, tokenId, qty = 1, amount, payingTokenAddress, decimals = 18, collectionId, bidPayAmt) {
  try {
    var amountInDec = roundNumber(mulBy(amount, 10 ** decimals), 0);
    var nonce_value = await getNonceValue(collectionId);
    var messageHash = window.web3.utils.soliditySha3(assetAddress, tokenId, payingTokenAddress, amountInDec, qty, nonce_value);
    var account = getCurrentAccount();
    const signature = await window.web3.eth.personal.sign(messageHash, account);
    await placeBid(collectionId, signature, qty, {
      asset_address: assetAddress,
      token_id: tokenId,
      quantity: qty,
      amount: bidPayAmt,
      amount_with_fee: amount,
      payment_token_address: payingTokenAddress,
      payment_token_decimals: decimals
    })
    await save_NonceValue(collectionId, signature, nonce_value)
    return window.bidSignSuccess(collectionId)
  } catch (err) {
    return window.bidSignFailed(err['message'])
  }
}

window.signMessage = async function signMessage(msg) {
  try {
    var account = getCurrentAccount();
    var sign = await window.web3.eth.personal.sign(msg, account);
    return sign;
  } catch (err) {
    return ""
  }
}

window.signSellOrder = async function signSellOrder(amount, decimals, paymentAssetAddress, tokenId, assetAddress, collectionId, sendBackTo='') {
  try {
    amount = roundNumber(mulBy(amount, 10 ** decimals), 0);
    var nonce_value = await getNonceValue(collectionId);
    var messageHash = window.web3.utils.soliditySha3(assetAddress, tokenId, paymentAssetAddress, amount, nonce_value);
    var account = getCurrentAccount();
    const fixedPriceSignature = await window.web3.eth.personal.sign(messageHash, account);
    await updateSignature(collectionId, fixedPriceSignature)
    await save_NonceValue(collectionId, fixedPriceSignature, nonce_value)
    if (sendBackTo == 'update') {
      return window.updateSignFixedSuccess(collectionId)
    } else {
      return window.bidSignFixedSuccess(collectionId)
    }
  } catch (err) {
    if(sendBackTo == 'update'){
      return window.updateSignFixedFailed(err['message'])
    }else{
      return window.bidSignFixedFailed(err['message'])
    }
  }
}

// buyingAssetType = 1 # 721
// buyingAssetType = 0 # 1155
window.buyAsset = async function buyAsset(assetOwner, buyingAssetType, buyingAssetAddress, tokenId, unitPrice, buyingAssetQty,
                                          paymentAmt, paymentAssetAddress, decimals, sellerSign, collectionId) {
  try {
    paymentAmt = roundNumber(mulBy(paymentAmt, 10 ** decimals), 0);
    unitPrice = roundNumber(mulBy(unitPrice, 10 ** decimals), 0);
    var compiledContractDetails = getContractABIAndBytecode(tradeContractAddress, 'trade');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tradeContractAddress);
    var nonce_value = await getContractSignNonce(collectionId, sellerSign);
    var account = getCurrentAccount();
    // supply, tokenURI, royalty needs to be passed but WILL NOT be used by the Contract
    var supply = 0;
    var tokenURI = "abcde";
    var royaltyFee = 0;
    var orderStruct = [
      assetOwner,
      account,
      paymentAssetAddress,
      buyingAssetAddress,
      buyingAssetType,
      unitPrice,
      paymentAmt,
      tokenId,
      supply,
      tokenURI,
      royaltyFee,
      buyingAssetQty
    ]
    var gasPrices = await gasPrice();
    var receipt = await contract.methods.buyAsset(
      orderStruct,
      gon.collection_data["imported"],
      splitSign(sellerSign, nonce_value)
    ).send({from: account, gas: 335268, gasPrice: String(gasPrices)});
    await updateCollectionBuy(collectionId, buyingAssetQty, receipt.transactionHash)
    return window.buyPurchaseSuccess(collectionId)
  } catch (err) {
    return window.buyPurchaseFailed(err['message'])
  }
}

window.MintAndBuyAsset = async function MintAndBuyAsset(assetOwner, buyingAssetType, buyingAssetAddress, tokenId, unitPrice, buyingAssetQty,
                                          paymentAmt, paymentAssetAddress, decimals, sellerSign, collectionId, tokenURI, royaltyFee, sharedCollection, supply, trade_address) {
  try {
    paymentAmt = roundNumber(mulBy(paymentAmt, 10 ** decimals), 0);
    unitPrice = roundNumber(mulBy(unitPrice, 10 ** decimals), 0);
    var buyingAssetType = buyingAssetType + 2; // BuyAssetType -> 3: Lazy721 , 2: Lazy1155, 1:721, 0: 1155
    var compiledContractDetails = getContractABIAndBytecode(tradeContractAddress, 'trade');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tradeContractAddress);
    var nonce_value = await getContractSignNonce(collectionId, sellerSign);
    var account = getCurrentAccount();
    var orderStruct = [
      assetOwner,
      account,
      paymentAssetAddress,
      buyingAssetAddress,
      buyingAssetType,
      unitPrice,
      paymentAmt,
      tokenId,
      supply,
      tokenURI,
      royaltyFee,
      buyingAssetQty
    ]
    // ownerSign -> selleraddress & URI
    var gasPrices = await gasPrice();
    var ownerSign = await sign_metadata_with_creator(assetOwner, tokenURI, collectionId, trade_address);
    await saveContractNonceValue(collectionId, ownerSign)
    var receipt = await contract.methods.mintAndBuyAsset(
      orderStruct,
      splitSign(ownerSign['sign'], ownerSign['nonce']),
      splitSign(sellerSign, nonce_value)
    ).send({from: account, gas: 616883, gasPrice: String(gasPrices)});
    var tokenId = parseInt(receipt.events.BuyAsset.returnValues['tokenId'])
    await updateCollectionBuy(collectionId, buyingAssetQty, receipt.transactionHash, tokenId)
    return window.buyPurchaseSuccess(collectionId)
  } catch (err) {
    return window.buyMintAndPurchaseFailed(err['message'])
  }
}


window.MintAndAcceptBid = async function MintAndAcceptBid(buyer, buyingAssetType, buyingAssetAddress, tokenId, paymentAmt, buyingAssetQty, paymentAssetAddress, decimals, buyerSign, collectionId, bidId, tokenURI, royaltyFee, sharedCollection,supply, trade_address) {
  try {
    paymentAmt = roundNumber(mulBy(paymentAmt, 10 ** decimals), 0);
    var unitPrice = 1;
    var buyingAssetType = buyingAssetType + 2; // BuyAssetType -> 3: Lazy721 , 2: Lazy1155, 1:721, 0: 1155
    var compiledContractDetails = getContractABIAndBytecode(tradeContractAddress, 'trade');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tradeContractAddress);
    var nonce_value = await getContractSignNonce(collectionId, buyerSign);
    var account = getCurrentAccount();
    //token ID calculating
    window.contract721 = await getContract(buyingAssetAddress, 'nft721', sharedCollection);
    var orderStruct = [
      account,
      buyer,
      paymentAssetAddress,
      buyingAssetAddress,
      buyingAssetType,
      unitPrice,
      paymentAmt,
      tokenId,
      supply,
      tokenURI,
      royaltyFee,
      buyingAssetQty
    ]
    var gasPrices = await gasPrice();
    // ownerSign -> selleraddress & URI
    var ownerSign = await sign_metadata_with_creator(account, tokenURI, collectionId, trade_address);
    await saveContractNonceValue(collectionId, ownerSign)
    var receipt = await contract.methods.mintAndExecuteBid(
      orderStruct,
      splitSign(ownerSign['sign'], ownerSign['nonce']),
      splitSign(buyerSign, nonce_value)
    ).send({from: account, gas: 516883, gasPrice: String(gasPrices)});
    var tokenId = parseInt(receipt.events.ExecuteBid.returnValues['tokenId'])

    await updateCollectionSell(collectionId, buyer, bidId, receipt.transactionHash, tokenId)
    return window.acceptBidSuccess(collectionId)
  } catch (err) {
    return window.acceptBidFailed(err['message'])
  }
}


window.executeBid = async function executeBid(buyer, buyingAssetType, buyingAssetAddress, tokenId, paymentAmt, buyingAssetQty, paymentAssetAddress, decimals, buyerSign, collectionId, bidId) {
  try {
    paymentAmt = roundNumber(mulBy(paymentAmt, 10 ** decimals), 0);
    var unitPrice = 1;
    var compiledContractDetails = getContractABIAndBytecode(tradeContractAddress, 'trade');
    var abi = compiledContractDetails['compiled_contract_details']['abi'];
    var contract = await new window.web3.eth.Contract(abi, tradeContractAddress);
    var nonce_value = await getContractSignNonce(collectionId, buyerSign);
    var account = getCurrentAccount();
    var gasPrices = await gasPrice();
    // supply, tokenURI, royalty needs to be passed but WILL NOT be used by the Contract
    var supply = 0;
    var tokenURI = "abcde";
    var royaltyFee = 0;
    var orderStruct = [
      account,
      buyer,
      paymentAssetAddress,
      buyingAssetAddress,
      buyingAssetType,
      unitPrice,
      paymentAmt,
      tokenId,
      supply,
      tokenURI,
      royaltyFee,
      buyingAssetQty
    ]
    var receipt = await contract.methods.executeBid(
      orderStruct,
      gon.collection_data["imported"],
      splitSign(buyerSign, nonce_value)
    ).send({from: account, gas: 335268, gasPrice: String(gasPrices)});
    await updateCollectionSell(collectionId, buyer, bidId, receipt.transactionHash)
    return window.acceptBidSuccess(collectionId)
  } catch (err) {
    return window.acceptBidFailed(err['message'])
  }
}

function getCurrentAccount() {
  if(window.wallet == 'metamask' && window.ethereum.selectedAddress) {
    return window.ethereum.selectedAddress
  }
  return window.currentAddress ?? sessionAddress;
}

window.ethBalance = async function ethBalance(account = '') {
  account = account ? account : getCurrentAccount();
  var bal = await window.web3.eth.getBalance(account);
  var ethBal = roundNumber(web3.utils.fromWei(bal, 'ether'), 4);
  return ethBal;
}

window.updateEthBalance = async function updateEthBalance() {
  var ethBal = await window.ethBalance()
  $('.curBalance').html(ethBal + 'ETH')
  $('.curEthBalance').text(ethBal)
}

window.tokenBalance = async function tokenBalance(contractAddress, decimals) {
  var abi = [{
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "type": "function"
  }]
  var contract = await new window.web3.eth.Contract(abi, contractAddress);
  var account = getCurrentAccount();
  var balance = await contract.methods.balanceOf(account).call();
  balance = roundNumber(divBy(balance, (10 ** decimals)), 4)
  return balance
}

window.getNetworkType = async function getNetworkType() {
  var type = await web3.eth.net.getNetworkType();
  return type;
}

function showTermsCondition(account, ethBal, networkType) {
  var account = account || getCurrentAccount();
  $.magnificPopup.open({
    closeOnBgClick: false ,
		enableEscapeKey: false,
    items: {
      src: '#terms-and-condition'
    },
    type: 'inline'
  });
  $("#account").val(account)
  $("#eth_balance_tc").val(ethBal)
  $("#network_type").val(networkType)
}

async function load(shouldDestroySession = false, chainId = '') {
  if (window.ethereum) {
  const account = await loadWeb3();
  window.currentAddress = account;
  const ethBal = await ethBalance(account);
  return createDeleteSession(account, ethBal, shouldDestroySession, window.wallet, chainId);
  }
}

async function createDeleteSession(account, balance, shouldDestroySession, wallet, chainId) {
  const networkType = await getNetworkType();
  const isValidUserResp = await isValidUser(account, '', wallet)
  document.cookie="chain_id="+parseInt(ethereum.networkVersion)+"; path=/;";
    if (isValidUserResp.user_exists) {
      await createUserSession(account, balance, shouldDestroySession, wallet)
      if (shouldDestroySession) {
        if(chainId == '') {
          window.location.reload()
        }
      } else {
        return true
      }
    } else {
      if (gon.session) {
        if (account) {
          await destroySession()
        }
        window.location.reload()
      } else {
        showTermsCondition(account, balance, networkType)
        return false
      }
    }
}

window.disconnect = async function disconnect(address) {
  await destroySession()
  window.location.reload()
}

async function destroySession() {
  if (gon.session) {
    await destroyUserSession(getCurrentAccount())
    if(window.wallet === 'walletConnect') {
      walletConnect.disconnect()
    }
  }
}

window.connect = async function connect(wallet = '') {
  if (!wallet) {
    toastr.error('Wallet Required')
    return
  }
  window.wallet = wallet;
  if(typeof web3 === 'undefined' && mobileCheck()) {
    window.open(`https://metamask.app.link/dapp/` + location.hostname, '_blank').focus();
    return
  }else if (typeof web3 !== 'undefined') { 
    const status = await load();
    if (status) {
      window.location.reload()
    }
  } else {
    toastr.error('Please install Metamask Extension to your browser. <a target="_blank" href="https://metamask.io/download.html">Download Here</a>')
  }
}

window.proceedWithLoad = async function proceedWithLoad() {
  var account = $("#account").val()
  const ethBal = $("#eth_balance").text()
  const networkType = $("#network_type").val()
  if ($("#condition1").is(":checked") && $("#condition2").is(":checked")) {
    await createUserSession(account, ethBal, networkType, window.wallet)
    window.location.reload()
  } else {
    toastr.error('Please accept the conditions to proceed')
  }
}

window.loadUser = async function loadUser() {
  let address = '';
  if (gon.session) {
    if(window.wallet == 'walletConnect' && window.web3.currentProvider.connected === false) {
      address = getCurrentAccount();
    }
    if(address) {
      return disconnect();
    }
    load();
  }
}

async function loadAddress() {
  if(sessionWallet) {
    window.wallet = sessionWallet
  }
  await loadWeb3();
}

$(function () {
  loadAddress();
});

// if (window.ethereum){
//   window.ethereum.on('accountsChanged', function (acc) {
//     if (window.ethereum && gon.session) {
//       load(true);
//     }
//   })

//   window.ethereum.on('chainChanged', function (chainId) {
//     if (window.ethereum && gon.session) {
//       load(true);
//     }
//   })
// }

if (window.ethereum){
  window.ethereum.on('accountsChanged', function (acc) {
    if (gon.session) {
      document.cookie="chain_id="+parseInt(ethereum.networkVersion)+"; path=/;";        
      load(true);
    }
  })

  window.ethereum.on('chainChanged', function (chainId) {
    if(gon.networks.includes(parseInt(chainId))){
      $(".loading-gif-network").hide();
    }else{
      $(".loading-gif-network").show();
    }
    
    if (gon.session) {
      
		$.ajax({
			url: "/change_network/?chain_id="+parseInt(chainId),
			type: 'GET',
			async: false,
			success: async function (data) {
        var ethBal = await window.ethBalance();
        const element = $(".header-current-balance");
        element.html(ethBal + " " +  data.baseCoin);    
				document.cookie="chain_id="+parseInt(chainId)+"; path=/;";
                
        setTimeout(() => {
          $("[name='chooseNetwork']").each(function(){this.checked=false});
          if($("#chooseNetwork_"+ethereum.networkVersion)[0]) {
            $("#chooseNetwork_"+ethereum.networkVersion)[0].checked = true;				
          }				
          $("#collection_erc20_token_id option").remove();
          $("#collection_erc20_token_id").html($("#erc20_token_id_"+parseInt(chainId)).html())
          
        }, 500);	        
			}
		  });      
      load(true, chainId);
    } else {
      document.location.href="/change_network/?chain_id="+parseInt(chainId);      
    }
  })
}

function gasPrice(){
  var init_gasPrice = '';
  var gasLimit;
  if (gon.tokenSymbol == "WMATIC"){
    init_gasPrice = '6000000000000'
    gasLimit = 9;
  
  }else if (gon.tokenSymbol == "WETH") {
    init_gasPrice = '4000000000000'
    gasLimit = 8;
  }

  try {
  var request = $.ajax({
    url: `/gas_price`,
    async: false,
    type: "GET"
  });
  request.done(function (msg) {
    if (msg['gas_price'] != '')
    {
      init_gasPrice = (msg['gas_price']['fastest']).toFixed() * 10**parseInt(gasLimit);
    }
  });
  request.fail(function (jqXHR, textStatus) {
   });
} catch (err) {
}
 return init_gasPrice;
}

window.mobileCheck = function() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

window.collectionBasedBuyNetworkChanged = async function collectionBasedNetworkChanged(chain_id) {
  if(chain_id != ethereum.networkVersion) {
    $.magnificPopup.open({
      closeOnBgClick: false ,
      enableEscapeKey: false,
      items: {
        src: '#networkChangeBuyModal'
      },
      type: 'inline'
    });
  } else {
    show_modal('#Buy-modal')
  }
}

window.collectionBasedBidNetworkChanged = async function collectionBasedBidNetworkChanged(chain_id) {
  if(chain_id != ethereum.networkVersion) {
    $.magnificPopup.open({
      closeOnBgClick: false ,
      enableEscapeKey: false,
      items: {
        src: '#networkChangeBidModal'
      },
      type: 'inline'
    });
  } else {
    show_modal('#Bid-modal')
  }
}

window.onNetworkChangeOnBuy = async function onNetworkChangeOnBuy(chain_id) {
  try {
    var cId = await setNetwork(chain_id);
    $.magnificPopup.close();   
    if(cId!=false)  {
      show_modal('#Buy-modal');
    }
    
  } catch (error) {    
  }
}

window.onNetworkChangeOnBid = async function onNetworkChangeOnBid(chain_id) {
  try {
    var cId = await setNetwork(chain_id);
    $.magnificPopup.close();   
    if(cId!=false)  {
      show_modal('#Bid-modal');
    }
    
  } catch (error) {    
  }
}

if (!window.location.pathname.includes("admin")) {
jQuery(async function(){
  setTimeout(async () => {
    var ethBal = await window.ethBalance();
    const element = $(".header-current-balance");
    element.html(ethBal + " " +  gon.baseCoin);     
  }, 100);
})
};
