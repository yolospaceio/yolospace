class AddNetworkToMysteryBox < ActiveRecord::Migration[6.1]
  def change
    add_column :mystery_boxes, :network_id, :integer
  end
end
