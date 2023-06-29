class Profile < ApplicationRecord
    has_one_attached :avatar
    
    validates :username, presence: true, uniqueness: true, length: { in: 3..40 }

    belongs_to :user
end
