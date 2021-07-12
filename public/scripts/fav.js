// update the favorite heart icons
var updateFavIcons = function() {
  $('[data-toggle="tooltip"]').tooltip('hide') // remove tooltips

  $(".fav-icon, .unfav-icon").each(function() {
    var isFav = (document.favorites.indexOf(this.courseId) !== -1)

    var $icon = $(this)
    $icon.removeClass(isFav ? 'fav-icon' : 'unfav-icon')
    $icon.addClass(isFav ? 'unfav-icon' : 'fav-icon')
    $icon.attr('data-original-title', isFav ? 'Click to unfavorite' : 'Click to favorite')
  })
}

// update the display of favorites upon new fav/unfav from course
// input course only on favoriting
// i: index of course in local list before fav toggled
var updateFavList = function(courseId, course, i) {

  $('#favorite-title').html('')
  $('#favorite-title').append(document.favorites.length + ' Favorite Course' + (document.favorites.length !== 1 ? 's' : ''))

  var isFav = (i === -1)

  // toggle title if necessary
  if (document.favorites.length === 0) {
    $('#favorite-header').slideUp()
    $('#favorite-prompt').slideDown()
  } else {
    $('#favorite-header').slideDown()
    $('#favorite-prompt').slideUp()
  }

  const currCount = parseInt($('#favs-count').text())

  // if newly a favorite
  if (isFav) {
    var entry = newDOMcourseResult(course, {"semester": 1, "tags": 1, 'pin': 1})
    $(entry).hide()

    $('#favs-count').text(currCount+1)
    $('#favs').append(entry)
    $(entry).slideDown()
    return
  }

  // if removing a favorite
  $("#favs").children().each(function() {
    // ignore if not this course
    if (this.courseId !== courseId) return

    // remove
    $('#favs-count').text(currCount-1)
    $(this).slideUp(function() {
      this.remove()
    })
  })
}

// handles click of favorite icon
var toggleFav = function() {
  var courseId = this.courseId
  var i = document.favorites.indexOf(courseId)

  // update local list
  if (i === -1)
    document.favorites.push(courseId)
  else {
    document.favorites.splice(i, 1)
    var j = document.pins.indexOf(courseId)
    if (j !== -1) document.pins.splice(i, 1)
  }

  // update database
  $.ajax({
    url: '/api/user/favorites/' + courseId,
    type: (i === -1) ? 'PUT' : 'DELETE'
  }).done(function (course) {
    // update display
    updateFavList(courseId, course, i)
    updateFavIcons()
    displayActive()
    //setTimeout(searchFromBox, 10)
  }).catch(function (error) {
    console.log(error)
  })

  $(this).blur()

  return false;
}
