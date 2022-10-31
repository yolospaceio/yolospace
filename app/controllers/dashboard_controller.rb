class DashboardController < ApplicationController
  skip_before_action :authenticate_user
  skip_before_action :is_approved

  def index
    set_categories_by_filter
    @hot_bids = Collection.top_bids(30).with_attached_attachment
    @featured_users = FeaturedUser.limit(5).map(&:user)
    @featured_collections = FeaturedCollection.limit(5).map(&:collection).compact
    top_buyers_and_sellers
  end

  def set_categories_by_filter
    params[:page_no] ||= 1
    @category_collections = params[:query].present? ? Collection.search("*#{build_elastic_search_str(params[:query].strip)}*").records.on_sale : Collection.on_sale

    @category_collections = @category_collections.get_with_sort_option(params[:sort_by]) if params[:sort_by]
    @category_collections = @category_collections.where("category like ?", "%#{params[:category]}%") if params[:category].present?
    @category_collections = @category_collections.on_sale.with_attached_attachment.paginate(page: params[:page_no] || 1)
  end

  def top_buyers_and_sellers
    @top_sellers = User.top_seller(params[:days]).with_attached_attachment
    @top_buyers = User.top_buyer(params[:days]).with_attached_attachment
  end

  def search
    @users = User.search("*#{build_elastic_search_str(params[:query])}*").records
    params[:page_no] ||= 1
    @collections = params[:query].present? ? Collection.search("*#{build_elastic_search_str(params[:query].strip)}*").records.on_sale : Collection.on_sale
    @collections= @collections.on_sale.with_attached_attachment.paginate(page: params[:page_no] || 1)
  end

  def notifications
    Notification.unread(current_user).update_all(is_read: true) if Notification.unread(current_user).present?
    @notifications = current_user.notifications
  end

  def contract_abi
    shared = ActiveModel::Type::Boolean.new.cast(params[:shared])
    abi = if params[:contract_address].present? && params[:type] == 'erc20'
            Utils::Abi.weth
          elsif params[:contract_address].present? && (params[:type] == 'trade')
            Utils::Abi.trade
          elsif(shared)
            if params[:type] == 'nft721'
              Utils::Abi.shared_nft721
            elsif params[:type] == 'nft1155'
              Utils::Abi.shared_nft1155
            end
          elsif(!shared)
            if params[:type] == 'nft721'
              Utils::Abi.nft721
            elsif params[:type] == 'nft1155'
              Utils::Abi.nft1155
            end
          else
            {}
          end
    render json: {compiled_contract_details: abi}
  end

  def gas_price
    gas_price = Api::Gasprice.gas_price
    render json: {gas_price: gas_price}
  end
  
  def change_network
    network = Network.find_by(chain_id: params[:chain_id].to_i)
    redirect_to root_path, alert: "Invalid network selected" and return if network.nil?
    Current.network = network
    cookies[:previous_chain_id] = cookies[:chain_id]
    cookies[:chain_id] = {value: network.chain_id, path: "/"}
    if request.xhr?
      setting = Settings.send(Current.network.short_name)
      render json: setting
    else 
      if params[:collection_id].present?
        redirect_to collection_path(params[:collection_id])
      else
        redirect_to root_path
      end      
    end
  end

  private

  def build_elastic_search_str(string)
    return nil if string.nil?
    es_string = ''
    str_arr = string.strip.split("")
    str_arr.each_with_index do |char, index|
      if ['^', '/', '(', ')', '-', '~', '{', '}', '[', ']', ':', '"'].include?(char)
        if str_arr[index - 1] == '\\' then es_string += char else es_string += '\\' + char end
      else
        es_string += char
      end
    end
    es_string
  end
end
