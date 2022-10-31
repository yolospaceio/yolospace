# Admin User
ETHEREUM_CHAIN_ID = Rails.env.development? ? 4 : 1
MATIC_CHAIN_ID = Rails.env.development? ? 80001 : 137

AdminUser.find_or_create_by(email: "ADMIN_EMAIL_HERE")
  .update(password: "ADMIN_PASSWORD_HERE", first_name: "ADMIN_FIRST_NAME_HERE", last_name: "ADMIN_LAST_NAME_HERE", password_confirmation: "ADMIN_PASSWORD_CONFIRMATION_HERE")

Fee.find_or_create_by(fee_type: 'Buyer').update(name: 'Service Charge', percentage: '2.5')
Fee.find_or_create_by(fee_type: 'Seller').update(name: 'Service Charge', percentage: '0')

["Art", "Animation", "Games", "Music", "Videos", "Memes", "Metaverses"].each { |c| Category.find_or_create_by(name: c) }

#Creating ERC20 Token List
Erc20Token.unscoped.find_or_create_by(chain_id: ETHEREUM_CHAIN_ID, symbol: 'WETH', network_id: 1)
  .update(address: 'WETH_TOKEN_ADDRESS_HERE', name: 'Wrapped Ether', decimals: 18)
Erc20Token.unscoped.find_or_create_by(chain_id: MATIC_CHAIN_ID, symbol: 'WMATIC', network_id: 3)
  .update(address: 'WMATIC_TOKEN_ADDRESS_HERE', name: 'Wrapped Matic', decimals: 18)

### CREATING SHARED NFT CONTRACT ADDRESSES
NftContract.unscoped.find_or_create_by(contract_type: 'nft721', symbol: 'Shared', network_id: 1)
  .update(name: 'NFT', address: 'ETH_721_CONTRACT_ADDRESS_HERE')
NftContract.unscoped.find_or_create_by(contract_type: 'nft1155', symbol: 'Shared', network_id: 1)
  .update(name: 'NFT', address: 'ETH_1155_CONTRACT_ADDRESS_HERE')
NftContract.unscoped.find_or_create_by(contract_type: 'nft721', symbol: 'Shared', network_id: 3)
  .update(name: 'NFT', address: 'MATIC_721_CONTRACT_ADDRESS_HERE')
NftContract.unscoped.find_or_create_by(contract_type: 'nft1155', symbol: 'Shared', network_id: 3)
  .update(name: 'NFT', address: 'MATIC_1155_CONTRACT_ADDRESS_HERE')
