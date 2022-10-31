class Erc20Token < ApplicationRecord
  #default_scope -> { where(network_id: Current.network.id) }
  def self.select_options(network_id=Current.network.id)
    all.where(network_id: network_id).map { |token| [token.symbol.upcase, token.id, {address: token.address, decimals: token.decimals}] }
  end


  def currency_symbol
    symbol.upcase
  end

end
