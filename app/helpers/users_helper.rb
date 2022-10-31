module UsersHelper
  def link_to_image(user)
    return if user.blank?
    link_to user_path(user.address), class: (user.is_verified ? 'author__avatar author__avatar--verified' : 'author__avatar') do
      image_tag url_for(user.profile_image)
    end
  end

  def link_to_name(user)
    return if user.blank?
    content_tag(:h1, class: "author__name") do
      link_to user.full_name, user_path(user.address)
    end
  end

  def link_to_twitter(user)
    return if user&.twitter_link.blank?
    content_tag(:h2, class: "author__nickname") do
      link_to "https://twitter.com/#{user.twitter_link}" do
        "@ #{user.twitter_link}"
      end
    end
  end

  def link_to_bio(user)
    return if user&.bio.blank?
    content_tag(:p, class: "author__text") do 
      user.bio
    end
  end

  def link_to_personal_url(user)
    return if user&.personal_url.blank?
    link_to format_link(user.personal_url), class: "author__link" do
      "#{content_tag(:svg, "xmlns"=>"http://www.w3.org/2000/svg", "viewBox"=>"0 0 24 24") {
        content_tag(:path, nil, "d"=>"M21.41,8.64s0,0,0-.05a10,10,0,0,0-18.78,0s0,0,0,.05a9.86,9.86,0,0,0,0,6.72s0,0,0,.05a10,10,0,0,0,18.78,0s0,0,0-.05a9.86,9.86,0,0,0,0-6.72ZM4.26,14a7.82,7.82,0,0,1,0-4H6.12a16.73,16.73,0,0,0,0,4Zm.82,2h1.4a12.15,12.15,0,0,0,1,2.57A8,8,0,0,1,5.08,16Zm1.4-8H5.08A8,8,0,0,1,7.45,5.43,12.15,12.15,0,0,0,6.48,8ZM11,19.7A6.34,6.34,0,0,1,8.57,16H11ZM11,14H8.14a14.36,14.36,0,0,1,0-4H11Zm0-6H8.57A6.34,6.34,0,0,1,11,4.3Zm7.92,0h-1.4a12.15,12.15,0,0,0-1-2.57A8,8,0,0,1,18.92,8ZM13,4.3A6.34,6.34,0,0,1,15.43,8H13Zm0,15.4V16h2.43A6.34,6.34,0,0,1,13,19.7ZM15.86,14H13V10h2.86a14.36,14.36,0,0,1,0,4Zm.69,4.57a12.15,12.15,0,0,0,1-2.57h1.4A8,8,0,0,1,16.55,18.57ZM19.74,14H17.88A16.16,16.16,0,0,0,18,12a16.28,16.28,0,0,0-.12-2h1.86a7.82,7.82,0,0,1,0,4Z") }}#{user.personal_url}".html_safe
    end
  end

  def format_link(url)
    return url if url.match(/\Ahttp[s]{0,1}\:/)
    'https://' + url
  end
end
