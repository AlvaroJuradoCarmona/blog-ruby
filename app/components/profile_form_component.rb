# frozen_string_literal: true

class ProfileFormComponent < ViewComponent::Base
  def initialize(profile:)
    @profile = profile
  end

end
