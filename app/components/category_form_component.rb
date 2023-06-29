# frozen_string_literal: true

class CategoryFormComponent < ViewComponent::Base
  def initialize(category:)
    @category = category
  end

end
