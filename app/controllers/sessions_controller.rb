class SessionsController < ApplicationController
  skip_before_action :authenticate_user, only: [:create, :valid_user]
  skip_before_action :is_approved

  def create
    destroy_session if ActiveModel::Type::Boolean.new.cast(params[:destroy_session])
    user = User.find_or_create_by(address: params[:address])
    if user.present?
      session[:user_id] = user.id
      session[:wallet] = params[:wallet]
      session[:address] = user.address
      session[:balance] = params[:balance]
    end

    render json: user.as_json, message: "Successfully Logged in"
  end

  def destroy
    destroy_session
    render json: {}, message: "Successfully Session destroyed"
  end

  def destroy_session
    cookies["_rarible_session"] = nil
    cookies.delete "_rarible_session"
    reset_session
  end

  def valid_user
    user = User.find_by_address(params[:address])
    status = user.present?
    session[:wallet] = params[:wallet] if status && current_user.present?
    render json: { user_exists: status }, message: 'Successfully validated'
  end
end
