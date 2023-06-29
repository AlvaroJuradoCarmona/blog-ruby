class Comment < ApplicationRecord
    has_rich_text :description

    validates :description, presence: true
    belongs_to :user
    belongs_to :post
end
