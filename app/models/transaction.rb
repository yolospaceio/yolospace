class Transaction < ApplicationRecord
  self.per_page = 10

  belongs_to :seller, class_name: 'User'
  belongs_to :buyer, class_name: 'User'
  belongs_to :collection
  default_scope -> { where(network_id: Current.network.id) }

  enum channel: {
    bid: 1,
    direct: 2
  }

  scope :top_seller_buyer, lambda {
    days = 30
    unscoped
      .where('created_at >=?', days.to_i.days.ago)
      .select('buyer_id', 'seller_id', 'currency', 'currency_type')
  }
end
