# frozen_string_literal: true

class Network < ActiveHash::Base
    self.data = [
      { id: 1, name: 'ETH', short_name: 'rinkeby', chain_id: 1, scan: 'https://etherscan.io/', scan_name: 'Etherscan', logo: '/assets/eth_ico.svg'},
      { id: 3, name: 'MATIC', short_name: 'matic-test', chain_id: 137, scan: 'https://polygonscan.com/', scan_name: 'Polygonscan', logo: '/assets/matic.png' }
    ]

    def address_url(hash)
      return '#' unless hash
      
      scan + 'address/' + hash
    end

    def transaction_url(hash)
      scan_url_gen(hash, 'tx')
    end
  
    private
  
    def scan_url_gen(hash, path)
      return '#' unless hash
      
      scan + path + '/' + hash
    end
  end
