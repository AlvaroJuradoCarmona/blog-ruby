# frozen_string_literal: true

class CommentReflex < ApplicationReflex
    def show_edit_comment
        morph "#edit_comment", render(CommentFormComponent.new(comment: find_comment))
    end

    def cancel_edit_comment
        morph "#edit_comment", ""
    end
  
    def edit_comment
      comment = find_comment
      if comment.update(comment_params)
        cancel_edit_comment
        morph "#{dom_id(comment)}", render(partial: 'comment', locals: { comment: comment })
      end
    end

    def new_comment
      comment = find_post.comments.build(comment_params)
      comment.user = find_user

      if comment.save
      end
    end

    def show_new_comment
      comment = find_post.comments.build
      comment.user = find_user
      morph "#new_comment", render(NewCommentFormComponent.new(comment: comment))
    end

    def cancel_new_comment
      morph "#new_comment", ""
    end

    def delete_comment
      comment = find_comment
      comment.destroy
    end
  
    private

    def find_comment
      Comment.find(element.dataset[:comment_id])
    end

    def comment_params
      params.require(:comment).permit(:description)
    end

    def find_post
      Post.find(element.dataset[:post_id])
    end

    def find_user
      User.find(element.dataset[:current_user_id])
    end
end
