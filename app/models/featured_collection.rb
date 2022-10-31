class FeaturedCollection < ApplicationRecord
  belongs_to :collection
  default_scope -> { joins(:collection).where('collections.network_id': Current.network.id) }
end
