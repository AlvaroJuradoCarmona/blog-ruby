# frozen_string_literal: true

class CommentFormComponent < ViewComponent::Base
  delegate :rich_text_area_tag, to: :view_context
  def initialize(comment:)
    @comment = comment
  end

end
