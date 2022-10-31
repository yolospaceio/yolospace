module Utils
  class Web3Schmoozer < Schmooze::Base
    dependencies Web3: 'web3'

    solidity_sha3_func =
      '
            function(contractAddress, current_user_address, metadataHash, provider, nonce) {
                var web3 = new Web3(new Web3.providers.HttpProvider(provider));
                return web3.utils.soliditySha3(contractAddress, current_user_address, metadataHash, nonce);
            }
        '

    sign_func =
      '
            function(msg, privateKey, provider) {
                var web3 = new Web3(new Web3.providers.HttpProvider(provider));
                return web3.eth.accounts.sign(msg, privateKey);
            }
        '

    recover_func =
      '
            function(msg, sign, provider) {
                var web3 = new Web3(new Web3.providers.HttpProvider(provider));
                return web3.eth.accounts.recover(msg, sign).toLowerCase();
            }
        '
    get_721_balance_func =
      '
        async function(provider, contractAddress, tokenId) {
          const web3 = new Web3(new Web3.providers.HttpProvider(provider));
          const abi = [{
            "inputs": [
              {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
              }
            ],
            "name": "ownerOf",
            "outputs": [
              {
                "internalType": "address",
                "name": "",
                "type": "address"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }];
          const contract = await new web3.eth.Contract(abi, contractAddress);
          return await contract.methods.ownerOf(tokenId).call();
        }
      '

    get_1155_balance_func =
      '
        async function(provider, contractAddress, wallet_address, tokenId) {
          const web3 = new Web3(new Web3.providers.HttpProvider(provider));
          const abi = [{
            "inputs": [
              {
                "internalType": "address",
                "name": "account",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }];
          const contract = await new web3.eth.Contract(abi, contractAddress);
          return await contract.methods.balanceOf(wallet_address, tokenId).call();
        }
      '

    method :solidity_sha3, solidity_sha3_func
    method :sign, sign_func
    method :recover, recover_func
    method :get_721_balance, get_721_balance_func
    method :get_1155_balance, get_1155_balance_func
  end

  class Web3
    def initialize
      @web3_schmoozer = Web3Schmoozer.new(__dir__)
      @provider = Rails.application.credentials.send(Current.network.short_name)[:ethereum_provider]
    end

    def sign(msg)
      @web3_schmoozer.sign(msg, Rails.application.credentials.send(Current.network.short_name)[:signer_private_key], @provider)
    end

    def recover(msg, sign)
      @web3_schmoozer.recover(msg, sign, @provider)
    end

    def sign_metadata_hash(contract_address, current_user_address, metadata_hash, nonce_value=nil)
      hash = @web3_schmoozer.solidity_sha3(contract_address, current_user_address, metadata_hash, @provider, nonce_value)
      sign(hash)
    end

    def valid_like?(signer, sign, contract_address, token_id)
      msg = I18n.t('sign.like', contract_address: contract_address, token_id: token_id)
      recover(msg, sign) == signer.downcase
    end

    def valid_put_on_sale_req?(signer, sign, contract_address, token_id)
      msg = I18n.t('sign.put_on_sale', contract_address: contract_address, token_id: token_id, owner_address: signer)
      recover(msg, sign) == signer.downcase
    end

    def valid_remove_from_sale_req?(signer, sign, contract_address, token_id)
      msg = I18n.t('sign.remove_from_sale', contract_address: contract_address, token_id: token_id, owner_address: signer)
      recover(msg, sign) == signer.downcase
    end

    def valid_start_action?(signer, sign, nft_contract_address, token_id, erc20_contract_address, min_price, start_time, end_time)
      msg = I18n.t('sign.start_action',
                   nft_contract_address: nft_contract_address,
                   token_id: token_id,
                   owner_address: signer,
                   erc20_contract_address: erc20_contract_address,
                   min_price: min_price,
                   start_time: start_time,
                   end_time: end_time)
      recover(msg, sign) == signer.downcase
    end

    def check_ownership(type, contract_address, wallet_address, token_id)
      return @web3_schmoozer.get_721_balance(@provider, contract_address, token_id) if type == 'single'

      @web3_schmoozer.get_1155_balance(@provider, contract_address, wallet_address, token_id)
    end
  end
end