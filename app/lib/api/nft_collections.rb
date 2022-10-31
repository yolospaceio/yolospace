module Api
  class NftCollections
    def self.nft_collections(owner_address, page)
      response = Rails.cache.fetch "#{owner_address}_assets", expires_in: 1.minutes do
        send_request(Rails.application.credentials.config[:opensea_url] + "/api/v1/assets?owner=#{owner_address}&limit=15&offset=#{(page.to_i-1)*15}")
      end
      if response
        response_body = response["assets"]
        user = User.find_by(address: owner_address)
        user_collections = user.imported_collections.includes(:nft_contract).pluck(:token, 'nft_contracts.address')
        next_page = response_body.length == 15
        exclude_opensea_nfts = exclude_opensea_nfts(response_body)
        response_body.map! do |resp|
          if resp['name'].present?
            status = user_collections.select { |c| c.first == resp["token_id"] && c.last.downcase == resp["asset_contract"]["address"].downcase }.present?
            unless status
              import_nft_hash(resp)
            end
          end
        end
        collections = response_body.compact - exclude_opensea_nfts
        { collections: collections, next_page: next_page }
      else
        ''
      end
    end

    def self.exclude_opensea_nfts(response_data)
      data = response_data.collect do |resp|
        if resp['asset_contract']['name'] == 'OpenSea Collections' && resp['num_sales'].zero?
          import_nft_hash(resp)
        end
      end
      return data.compact
    end

    def self.import_nft_hash(resp)
      {
        type: resp["asset_contract"]["schema_name"],
        title: resp["name"],
        description: resp["description"],
        image_url: resp["image_url"],
        metadata: resp["token_metadata"],
        token: resp["token_id"],
        contract_address: resp["asset_contract"]["address"]
      }
    end

    def self.send_request(url)
      begin
        uri = URI.parse(url)
        request = Net::HTTP::Get.new(uri)
        request.content_type = "application/json"
        req_options = {
          use_ssl: uri.scheme == "https",
          open_timeout: 5,
          read_timeout: 5,
        }
        response = Net::HTTP.start(uri.hostname, uri.port, req_options) do |http|
          http.request(request)
        end

        if response.code == '200'
          JSON.parse(response.body)
        else
          Rails.logger.warn "#########################################################"
          Rails.logger.warn "Failed while fetch assets - #{response}"
          Rails.logger.warn "#########################################################"
          false
        end
      rescue Timeout::Error => exc
        Rails.logger.warn "ERROR: #{exc.message}"
      rescue Errno::ETIMEDOUT => exc
        Rails.logger.warn "ERROR: #{exc.message}"
      rescue Exception => e
        Rails.logger.warn "################## Exception while Fetching Collection(s) from Opensea ##################"
        Rails.logger.warn "ERROR: #{e.message}"
        Rails.logger.warn $!.backtrace[0..20].join("\n")
      end
    end
  end
end
