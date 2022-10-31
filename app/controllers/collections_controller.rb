class CollectionsController < ApplicationController
  skip_before_action :authenticate_user, only: [:show]
  before_action :is_approved, except: [:show]
  before_action :set_collection, except: [:new, :create, :update_token_id, :sign_metadata_hash]

  skip_before_action :verify_authenticity_token


  def new
    @collection_type = params[:type]
    @networks = (params[:nft].present? || params[:token]) ? [Network.find_by(name: 'ETH')] : Network.all
    if params[:token].present? && type_cast_to_boolean(params[:import])
      type = (params[:type] == "single") ? 'ERC721' : 'ERC1155'
      @nft = ImportNFT.new(params.merge({type: type, user_address: current_user.address, action: 'nftmeta'})).nft_metadata
    else 
      @nft = {}
    end
  end

  def show
    @tab = params[:tab]
    @activities = PaperTrail::Version.where(item_type: "Collection", item_id: @collection.id).order("created_at desc")
    @max_bid = @collection.max_bid
    set_collection_gon
  end

  def create
    begin
      @collection = Collection.new(collection_params.except(:source, :image_url, :animation_url, :file_type, :token, :total_copies, :contract_address, :contract_type))
      @collection.state = :pending
      if @collection.nft_contract
        @collection.collection_type = @collection.nft_contract.nft1155? ? 'multiple' : 'single'
      end
      if type_cast_to_boolean(collection_params[:imported])
        if collection_params[:animation_url].present?
          file = URI.open(collection_params[:animation_url])
        elsif collection_params[:image_url].present?
          file = URI.open(collection_params[:image_url])
        end
        if file.present?
          @collection.attachment.attach(io: file, filename: collection_params[:name], content_type: file.content_type)
        end
        unless @collection.nft_contract.address == collection_params[:contract_address]
          @collection.nft_contract = NftContract.find_or_create_by(contract_type: @collection.nft_contract.contract_type, symbol: collection_params[:contract_type], address: collection_params[:contract_address])
        end
        @collection.royalty = 0
        @collection.no_of_copies = collection_params[:total_copies]
        @collection.token = collection_params[:token]
        if ['audio/mp3', 'audio/webm', 'audio/mpeg', 'video/mp4', 'video/webm'].include?(file.content_type) && !@collection.cover.present?
          if collection_params[:animation_url].present?
            preview_file = URI.open(collection_params[:image_url])
            @collection.cover.attach(io: preview_file, filename: collection_params[:name], content_type: preview_file.content_type)
          else
            @collection.cover.attach(io: File.open('app/assets/images/banner-1.png'), filename: 'banner-1.png')
          end
        end
      end

      @collection.network_id = Current.network.id
      # ITS A RAND STRING FOR IDENTIFIYING THE COLLECTION. NOT CONTRACT ADDRESS
      @collection.address = Collection.generate_uniq_token
      @collection.creator_id = current_user.id
      @collection.owner_id = current_user.id
      @collection.data = JSON.parse(collection_params[:data]) if collection_params[:data].present?
      @collection.owned_tokens = @collection.no_of_copies
      if @collection.valid?
        @collection.save
        m_hash = Api::Pinata.new.upload(@collection)
        if m_hash.first.present?
          @metadata_hash = m_hash.last
        else
          @errors = m_hash.last
        end
      else
        @errors = @collection.errors.full_messages
      end
    rescue Exception => e
      Rails.logger.warn "################## Exception while creating collection ##################"
      Rails.logger.warn "ERROR: #{e.message}, PARAMS: #{params.inspect}"
      Rails.logger.warn $!.backtrace[0..20].join("\n")
      @errors = e.message
    end
  end

  def bid
    begin
      @collection.place_bid(bid_params)
    rescue Exception => e
      Rails.logger.warn "################## Exception while creating BID ##################"
      Rails.logger.warn "ERROR: #{e.message}, PARAMS: #{params.inspect}"
      Rails.logger.warn $!.backtrace[0..20].join("\n")
      @errors = e.message
    end
  end

  def remove_from_sale
    if @collection.is_owner?(current_user)
      @collection.remove_from_sale
      @collection.cancel_bids
    end
    redirect_to collection_path(@collection.address)
  end

  def sell
    begin
      ActiveRecord::Base.transaction do
        lazy_minted = lazy_mint_token_update
        @redirect_address = @collection.execute_bid(params[:address], params[:bid_id], params[:transaction_hash], lazy_minted) if @collection.is_owner?(current_user)
      end
    rescue Exception => e
      Rails.logger.warn "################## Exception while selling collection ##################"
      Rails.logger.warn "ERROR: #{e.message}, PARAMS: #{params.inspect}"
      Rails.logger.warn $!.backtrace[0..20].join("\n")
      @errors = e.message
    end
  end

  def buy
    begin
      ActiveRecord::Base.transaction do
        lazy_minted = lazy_mint_token_update
        @redirect_address = @collection.direct_buy(current_user, params[:quantity].to_i, params[:transaction_hash], lazy_minted)
      end
    rescue Exception => e
      Rails.logger.warn "################## Exception while buying collection ##################"
      Rails.logger.warn "ERROR: #{e.message}, PARAMS: #{params.inspect}"
      Rails.logger.warn $!.backtrace[0..20].join("\n")
      @errors = e.message
    end
  end

  def update_token_id
    collection = current_user.collections.unscoped.where(address: params[:collectionId]).take
    collection.approve! unless collection.instant_sale_price.present?
    collection.update(token: params[:tokenId].to_i, transaction_hash: params[:tx_id])
  end

  def change_price
    @collection.assign_attributes(change_price_params)
    @collection.save
  end

  def burn
    if @collection.multiple?
      all_collections = Collection.unscope(where: :is_mystery_box).where(nft_contract_id: @collection.nft_contract_id, token: @collection.token)
      #Using UPDATE_ALL to FORCE-skip cases where no_of_copies > owned_tokens for a brief moment 
      all_collections.update_all(:no_of_copies => @collection.no_of_copies - params[:transaction_quantity].to_i)
      if @collection.owned_tokens == params[:transaction_quantity].to_i #User has 2 actions, BURN ALL vs BURN some!
        @collection.burn! if @collection.may_burn?
      else
        @collection.update(:owned_tokens => @collection.owned_tokens - params[:transaction_quantity].to_i)
      end 
    else   
      @collection.burn! if @collection.may_burn?
    end
  end

  def transfer_token
    new_owner = User.find_by_address(params[:user_id])
    if new_owner.present?
      @collection.hand_over_to_owner(new_owner.id)
    else
      @errors = [t("collections.show.invalid_user")]
    end
  end

  def sign_metadata_hash
    sign = if params[:contract_address].present?
      collection = current_user.collections.unscoped.where(address: params[:id]).first
      nonce = DateTime.now.strftime('%Q').to_i
      obj = Utils::Web3.new
      obj.sign_metadata_hash(params[:contract_address],current_user.address, collection.metadata_hash, nonce)
    else
      ""
    end
    render json: sign.present? ? sign.merge("nonce" => nonce) : {}
  end

  def sign_metadata_with_creator
    sign = if params[:address].present?
        account = User.where(address: params[:address]).first
        find_collection = account.collections.where(metadata_hash: params[:tokenURI]).exists?
        if(find_collection)
          nonce = DateTime.now.strftime('%Q').to_i
          obj = Utils::Web3.new
          obj.sign_metadata_hash(params[:trade_address], account.address, params[:tokenURI], nonce)
        else 
          ""
        end
    else
      ""
    end
    render json: sign.present? ? sign.merge("nonce" => nonce) : {}
  end

  def fetch_details
    render json: {data: @collection.fetch_details(params[:bid_id], params[:erc20_address])}
  end

  def fetch_transfer_user
    user = User.validate_user(params[:address])
    if user && user.is_approved? && user.is_active?
      render json: {address: user.address}
    else
      render json: {error: 'User not found or not activated yet. Please provide address of the user registered in the application'}
    end

  end

  def sign_fixed_price
    collection = current_user.collections.unscoped.where(address: params[:id]).take
    collection.approve! if collection.pending?
    collection.update(sign_instant_sale_price: params[:sign])
  end

  def approve
    collection = current_user.collections.unscoped.where(address: params[:id]).take
    if collection.metadata_hash.present?
      collection.approve! if collection.pending?
    end
  end

  def owner_transfer
    collection = current_user.collections.unscoped.where(address: params[:id]).take
    recipient_user = User.where(address: params[:recipient_address]).first
    collection.hand_over_to_owner(recipient_user.id, params[:transaction_hash], params[:transaction_quantity].to_i)
  end

  def save_contract_nonce_value
    if params.dig("signature").present?
      contract_nonce = ContractNonceVerify.create(contract_sign_address: params.dig("signature", "sign"), contract_sign_nonce: params.dig("signature", "nonce"), network_id: Current.network.id, user_address: current_user.address)
    end
  end

  def get_nonce_value
       render json: {nonce: DateTime.now.strftime('%Q').to_i}
  end
  
  def save_nonce_value
     if params[:sign].present?
      contract_nonce = ContractNonceVerify.create(contract_sign_address: params[:sign], contract_sign_nonce: params[:nonce], network_id: Current.network.id, user_address: current_user.address)
     end
  end

  def get_contract_sign_nonce
    contract_nonce = ContractNonceVerify.find_by(contract_sign_address: params[:sign])
    nonce = contract_nonce.present? ? {nonce: contract_nonce.contract_sign_nonce.to_i} : {}
    render json: nonce
  end

  private

  def lazy_mint_token_update
    # After getting sold, the owner will mint with creators name and transfer
    lazy_minted = @collection.is_lazy_minted?
    @collection.update(token: params[:tokenId].to_i) if lazy_minted && params[:tokenId]&.to_i != 0 
    lazy_minted
    # Double validation because tokenId cant be 0
  end

  def collection_params
    params['collection']['category'] = params['collection']['category'].present? ? params['collection']['category'].split(",") : []
    params['collection']['nft_contract_id'] = NftContract.get_shared_id(params[:collection][:collection_type]) if params['chooseCollection'] == 'nft'
    params['collection']['erc20_token_id'] = Erc20Token.where(address: params[:collection][:currency]).first&.id if params[:collection][:currency].present?
    params.require(:collection).permit(:name, :description, :collection_address, :put_on_sale, :instant_sale_enabled, :instant_sale_price, :unlock_on_purchase,
                               :bid_id, :no_of_copies, :attachment, :cover, :data, :collection_type, :royalty, :nft_contract_id, :unlock_description,
                               :erc20_token_id, :source, :image_url, :animation_url, :file_type, :token, :total_copies, :contract_address, :contract_type, :imported, :is_mystery_box, category: [])
  end

  def change_price_params
    params[:collection][:put_on_sale] = false if params[:collection][:put_on_sale].nil?
    params[:collection][:unlock_on_purchase] = false if params[:collection][:unlock_on_purchase].nil?
    unless params[:collection][:instant_sale_enabled]
      params[:collection][:instant_sale_enabled] = false
      params[:collection][:instant_sale_price] = nil
    end
    params.require(:collection).permit(:put_on_sale, :instant_sale_enabled, :instant_sale_price, :unlock_on_purchase, :unlock_description, :erc20_token_id)
  end

  def bid_params
    params[:user_id] = current_user.id
    params.permit(:sign, :quantity, :user_id, details: {})
  end

  def set_collection
    @collection = Collection.unscoped.find_by(address: params[:id])
    redirect_to root_path unless @collection.present?
  end

  def set_gon
    gon.collection_data = @collection.gon_data
  end

  def set_collection_gon
    gon.collection_data = @collection.gon_data
  end
end
























