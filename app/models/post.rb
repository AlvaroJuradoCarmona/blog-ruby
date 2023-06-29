class Post < ApplicationRecord
    has_many :comments, dependent: :destroy
    
    has_one_attached :photo
    has_rich_text :article

    validates :title, presence: true, length: { in: 3..192 }
    validates :photo, presence: true
    validates :article, presence: true

    belongs_to :user

    has_many :category_posts, dependent: :destroy
    has_many :categories, through: :category_posts
end
