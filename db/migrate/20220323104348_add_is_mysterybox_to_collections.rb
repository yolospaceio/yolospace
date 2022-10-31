class AddIsMysteryboxToCollections < ActiveRecord::Migration[6.1]
  def change
    add_column :collections, :is_mystery_box, :boolean, default: false
  end
end
