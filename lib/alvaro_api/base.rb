require 'httparty'
module AlvaroApi
    class Base
        attr_accessor :response
        include HTTParty
        # base_uri 'http://api.disneyapi.dev'

        # def initialize(version=nil)
            
        # end

        # def all
        #     @response = self.class.get("/#{self.class.name.downcase.demodulize}")
        # end

        # def get(id)
        #     @response = self.class.get("/#{self.class.name.downcase.demodulize}/#{id}")
        # end

        base_uri 'http://gateway.marvel.com:443/v1/public'
        API_KEY='05d7141c58da8e88776d76f068627f8c'
        HASH='7cb4faf321cb1a15c96741283316c35b'

        def initialize(version=nil)
            
        end

        def all
            @response = self.class.get("/#{self.class.name.downcase.demodulize}?#{api_key_params}")
        end

        def get(id)
            @response = self.class.get("/#{self.class.name.downcase.demodulize.pluralize}/#{id}?#{api_key_params}")
        end

        private

        def api_key_params
            return "ts=1&apikey=#{API_KEY}&hash=#{HASH}"
        end

        def clean_response
            @response.parsed_response['data']['results'][0]
        end

        def id
            clean_response['id']
        end
    end

end