// update the favorites data for search pane
var updateSearchFav = function(course) {
  var thisCourseId = course._id

  $("#results").children().each(function() {
    var isFav = (document.favorites.indexOf(this.course._id) !== -1)

    var icon = $(this).find("i")
    icon.removeClass(isFav ? 'fav-icon' : 'unfav-icon')
    icon.addClass(isFav ? 'unfav-icon' : 'fav-icon')
  })
}

// update the display of favorites upon new fav/unfav from course
var updateFavList = function(course) {
  var thisCourseId = course._id

  $('#favorite-title').html('')
  $('#favorite-title').append(document.favorites.length + ' Favorite Course'+ (document.favorites.length !== 1 ? 's' : ''))

  var isFav = (document.favorites.indexOf(thisCourseId) !== -1)

  // toggle title if necessary
  if ((document.favorites.length === 0 && $('#favorite-header').css('display') !== 'none')
   || (document.favorites.length  >  0 && $('#favorite-header').css('display') === 'none')) {
    $('#favorite-header').slideToggle()
  }

  // if newly a favorite
  if (isFav) {
    var entry = newDOMResult(course, {"semester": 1, "tags": 1})
    entry.setAttribute('style', 'display: none;')

    $('#favs').append(entry)
    $(entry).slideToggle()
    return
  }

  // if removing a favorite
  $("#favs").children().each(function() {
    // ignore if not this course
    if (this.course["_id"] !== thisCourseId) return

    // remove
    $(this).slideToggle(function() {
      this.remove()
    })
  })
}

// handles click of favorite icon
var toggleFav = function(course) {
  var thisCourseId = course._id

  var i = document.favorites.indexOf(thisCourseId)

  // update local list
  if (i === -1)
    document.favorites.push(thisCourseId)
  else
    document.favorites.splice(i, 1)

  // update display
  updateSearchFav(course)
  updateFavList(course)

  // update database
  $.ajax({
    url: '/api/user/favorites/' + thisCourseId,
    type: (i === -1) ? 'PUT' : 'DELETE'
  })

  return false;
}