class Current < ActiveSupport::CurrentAttributes
    attribute :network
  
    def self.network
      Current.network = Network.first if super.blank?
  
      super
    end
  end