class CreateMysteryBoxes < ActiveRecord::Migration[6.1]
  def change
    create_table :mystery_boxes do |t|
      t.integer :collection_id
      t.string :user_address
      t.integer :state
      t.integer :no_of_copies
      t.timestamps
    end
  end
end
