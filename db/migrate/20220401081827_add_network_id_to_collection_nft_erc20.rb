class AddNetworkIdToCollectionNftErc20 < ActiveRecord::Migration[6.1]
  def change
    add_column :collections, :network_id, :integer
    add_column :erc20_tokens, :network_id, :integer
    add_column :nft_contracts, :network_id, :integer
    add_column :notifications, :network_id, :integer
    add_column :transactions, :network_id, :integer
  end
end
