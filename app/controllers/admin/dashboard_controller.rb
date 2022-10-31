class Admin::DashboardController < Admin::BaseController
  def index
    @user_count = User.all.count
    @collection_count = Collection.unscoped.all.group(:network_id).count
    @networks = Network.all
  end

  def change_network
    network = Network.find_by(chain_id: params[:chain_id].to_i)
    redirect_to admin_root_path, alert: "Invalid network selected" and return if network.nil?

    cookies[:chain_id] = network.chain_id
    redirect_to admin_root_path
  end
end
