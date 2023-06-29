Rails.application.routes.draw do
  get '/', to: redirect('/posts')
  resource :example, constraints: -> { Rails.env.development? }
  resources :profiles
  resources :categories
  resources :posts do
    resources :comments
  end

  devise_for :users, :controllers => { registrations: 'users/registrations' }

end
