require 'uri'
require 'net/http'
require 'openssl'

class ImportNFT
  def initialize(params)
    @user_address = params[:user_address]
    @page_no = params[:page_no]
    @tokenId = params[:token]
    @tokenType = params[:type]
    @contract_address = params[:contract_address]
    @apiAction = (params[:action] == 'nfts') ? 'getNFTs' : 'getNFTMetadata'
  end

  def nfts
    response_body = send_request
    return {} if response_body[:errors].present?

    { collections: excluded_listed_nfts(response_body['ownedNfts']) }
  end

  def nft_metadata
    response_data = send_request

    return {} if response_data[:errors].present?

    data = data_hash(response_data)
    extra_data = { token: data['token'].hex }
    media_file = file_type(data[:animation_url])
    if data[:animation_url].present?
      extra_data[:file_type] = file_type(data[:animation_url])
    end
    data.merge(extra_data)
  end

  private

  def excluded_listed_nfts(response_data)
    return [] if response_data.blank?

    response_data.map! do |resp|
      unless nft_listed(resp)
        resp_data_hash = data_hash(resp)
        resp_data_hash.merge!(balance: resp['balance']) if resp_data_hash.present?
      end
    end.compact.delete_if(&:empty?)
  end

  def nft_listed(resp)
    user_collections.select do |collection|
     collection.state == 'approved' && 
     collection.first == resp.fetch('id')['tokenId'].hex.to_s && 
     collection.last.downcase == resp.fetch('contract')['address'].downcase
    end.present?
  end

  def data_hash(resp)
    metadata = resp.fetch('metadata')
    return {} if metadata.blank? || resp['contractMetadata'].blank?

    {
      type: resp.fetch('contractMetadata')['tokenType'],
      title: metadata['name'],
      description: metadata['description'],
      image_url: image_url(metadata['image']),
      animation_url: image_url(metadata['animation_url']),
      token: resp.fetch('id')['tokenId'],
      metadata: metadata,
      source: resp.fetch('contractMetadata')['name'],
      contract_address: resp.fetch('contract')['address'].downcase
    }.with_indifferent_access if metadata['image'].present?
  end

  def image_url(image_url)
    return {} if image_url.blank?

    if image_url.exclude?('https://')
      str_path = image_url.include?('ipfs://ipfs/') ? image_url.gsub('ipfs://ipfs/', 'ipfs/') : image_url.gsub('ipfs:/', 'ipfs')
      image_url = 'https://ipfs.io/' + str_path
    end
    return image_url
  end

  def file_type(data_url)
    return '' if data_url.blank?

    file = URI.open(data_url)
    return file.content_type
  end

  def send_request
    begin
      return { errors: 'Invalid parameter' } if @user_address.blank?

      http = Net::HTTP.new(url.host, url.port)
      http.use_ssl = true
      request = Net::HTTP::Get.new(url)
      request["Accept"] = 'application/json'
      response = http.request(request)

      return JSON.parse(response.read_body)
    rescue Exception => e
      Rails.logger.warn "################## Exception while Fetching data from alchemy ##################"
      Rails.logger.warn "ERROR: #{e.message}"
      Rails.logger.warn $!.backtrace[0..20].join("\n")
      return { errors: e.message, status: :bad_request }
    end
  end

  def url
    url = "#{alchemy[:baseURL]}/nft/v2/#{alchemy[:apiKey]}/#{@apiAction}?"
    url_arr = []
    url_arr << "tokenType=#{@tokenType}" if @tokenType.present?
    if (@apiAction == 'getNFTs')
      url_arr << "contractAddresses[]=#{@contract_address}" if @contract_address.present?
      url_arr << "owner=#{@user_address}&withMetadata=true&pageKey=#{@page_no}&tokenUriTimeoutInMs=0"
    else
      url_arr << "contractAddress=#{@contract_address}" if @contract_address.present?
      url_arr << "tokenId=#{@tokenId}&refreshCache=true"
    end
    url_string = url + url_arr.join('&')
    URI(url_string)
  end

  def alchemy
    Rails.application.credentials.alchemy[Rails.env.to_sym]
  end

  def contract_address
    NftContract.find_or_create_by(contract_type: 'nft1155', symbol: 'Shared').address
  end

  def user
    User.find_by(address: @user_address)
  end

  def user_collections
    user.collections.includes(:nft_contract).pluck(:token, 'nft_contracts.address')
  end
end
