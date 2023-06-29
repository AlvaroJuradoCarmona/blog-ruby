# frozen_string_literal: true

class NewCategoryFormComponent < ViewComponent::Base
  def initialize(category:)
    @category = category
  end

end
