class ApplicationController < ActionController::Base
  before_action :set_network
  prepend_before_action :authenticate_user
  before_action :is_approved
  before_action :set_locale
  before_action :set_base_gon
  before_action :set_token_address

  helper_method :current_user, :current_balance, :gon, :buyer_service_fee, :seller_service_fee
  DEFAULT_NETWORK_CHAIN_ID = 1


  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def current_balance
    @current_balance ||= session[:balance]
  end

  def buyer_service_fee
    Fee.buyer_service_fee
  end

  def seller_service_fee
    Fee.seller_service_fee
  end

  def set_network
    network = Network.find_by(chain_id: cookies[:chain_id].to_i)
    if network.nil?
      network = Network.find_by(chain_id: DEFAULT_NETWORK_CHAIN_ID)
      cookies[:chain_id] = network.chain_id
    end
    Current.network = network
  end

  def set_locale
    if params[:locale] || cookies['locale'].nil?
      I18n.locale = params[:locale] || I18n.default_locale
      cookies['locale'] = I18n.locale
    else
      I18n.locale = cookies['locale']
    end
    @locale = I18n.locale 
  end

  def authenticate_user
    redirect_to root_path, alert: 'Please connect your wallet to proceed.' unless current_user
  end

  def is_approved
    redirect_to root_path, alert: 'Pending for admin approval.' unless current_user&.is_approved
  end

  def set_base_gon
    gon.session = current_user.present?
  end

  def set_token_address
    gon.tokenURIPrefix = Settings.send("#{Current.network.short_name}").tokenURIPrefix
    gon.transferProxyContractAddress = Settings.send("#{Current.network.short_name}").transferProxyContractAddress
    gon.tokenAddress = Settings.send("#{Current.network.short_name}").tokenAddress
    gon.tradeContractAddress = Settings.send("#{Current.network.short_name}").tradeContractAddress
    gon.tokenSymbol = Settings.send("#{Current.network.short_name}").tokenSymbol;
    gon.wallet = session[:wallet]
    gon.address = session[:address]
    gon.ethereum_provider = Rails.application.credentials.send(Current.network.short_name)[:ethereum_provider]
    gon.chainId = Rails.application.credentials.send(Current.network.short_name)[:chainId]
    gon.baseCoin = Settings.send("#{Current.network.short_name}").baseCoin
    gon.networks = Network.pluck(:chain_id)
  end

  def type_cast_to_boolean(value)
    ActiveRecord::Type::Boolean.new.cast(value)
  end
end
