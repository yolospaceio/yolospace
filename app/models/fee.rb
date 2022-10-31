class Fee < ApplicationRecord
  validates :name, :fee_type, :percentage, presence: true
  
  
  def self.buyer_service_fee
    service_fee = where(fee_type: 'Buyer').first
    service_fee ? service_fee.percentage : Rails.application.credentials.default_fees[:buyer_service_fee]
  end

  def self.seller_service_fee
    service_fee = where(fee_type: 'Seller').first
    service_fee ? service_fee.percentage : Rails.application.credentials.default_fees[:seller_service_fee]
  end
end
