module AlvaroApi
    class Character < Base
        def get(id)
            super

            {
                id: id,
                name: clean_response['name']
            }
        end
    end
end