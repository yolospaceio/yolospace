class Like < ApplicationRecord
  self.per_page = 20

  belongs_to :collection
  belongs_to :user

  validates_uniqueness_of :user_id, :scope=> [:collection_id, :user_id]

  has_paper_trail on: [:create, :update]

  after_create :send_notification

  private

  def send_notification
    Notification.notify_like(self)
  end
end
