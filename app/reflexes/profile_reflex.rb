# frozen_string_literal: true

class ProfileReflex < ApplicationReflex
    def show_edit_profile
        morph "#edit_profile", render(ProfileFormComponent.new(profile: Profile.find(element.dataset[:profile_id])))
    end

    def cancel_edit_profile
        morph "#edit_profile", ""
    end
end
