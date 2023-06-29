# frozen_string_literal: true

class CategoryReflex < ApplicationReflex
    def show_edit_category
        morph "#edit_category", render(CategoryFormComponent.new(category: set_category))
    end

    def cancel_edit_category
        morph "#edit_category", ""
    end

    def edit_category
        category = set_category
        if category.update(category_params)
          cancel_edit_category
          morph "#{dom_id(category)}", render(partial: 'category', locals: { category: category })
        end
    end

    def new_category
        category = Category.new(category_params)
        category.save!
    end

    def show_new_category
        morph "#new_category", render(NewCategoryFormComponent.new(category: Category.new))
    end

    def cancel_new_category
        morph "#new_category", ""
    end

    def delete_category
        category = set_category
        category.destroy
    end

    def show_category
        params[:category_id] = element.dataset[:category_id]
    end

    private

    def set_category
        Category.find(element.dataset[:category_id])
    end

    def category_params
        params.require(:category).permit(:name)
    end
end
