module AlvaroApi
    class Comic < Base
        def get(id)
            super

            {
                id: id,
                name: clean_response['title'],
                characters: get_characters
            }
        end

        def get_characters
            clean_response['characters']['items']&.map{|character| character['name']}
        end
    end
end