class PostsController < ApplicationController
  before_action :set_post, only: %i[ show edit update destroy ]
  load_and_authorize_resource


  # GET /posts or /posts.json
  def index
    @categories = Category.order(name: :asc)
    @category_id = params[:category_id]
    if params[:category_id]
      @category = Category.find(params[:category_id])
      @pagy, @posts = pagy(Category.find(params[:category_id]).posts, items: 3)
    else
      @pagy, @posts = pagy(Post.order(created_at: :desc), items: 3)
    end
  end

  # GET /posts/1 or /posts/1.json
  def show
    @pagy, @comments = pagy(@post.comments, items: 3)
  end

  # GET /posts/new
  def new
    @post = Post.new
  end

  # GET /posts/1/edit
  def edit
  end

  # POST /posts or /posts.json
  def create
    @post = current_user.posts.new(post_params)

      if @post.save
        redirect_to post_url(@post), notice: "Post was successfully created."
      else
        render :new, status: :unprocessable_entity
      end
  end

  # PATCH/PUT /posts/1 or /posts/1.json
  def update

      if @post.update(post_params)
        redirect_to post_url(@post), notice: "Post was successfully updated."
      else
        render :edit, status: :unprocessable_entity
      end
  end

  # DELETE /posts/1 or /posts/1.json
  def destroy
    @post.destroy

    redirect_to posts_url, notice: "Post was successfully destroyed."
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_post
      @post = Post.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def post_params
      params.require(:post).permit(:title, :photo, :article, category_ids: [])
    end
end
