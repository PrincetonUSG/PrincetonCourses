// dependencies: module.js, search.js, display.js, resizable.js, navbar.js device.js

// initialization
$(document).ready(function() {

  init_load();
  init_panes();
  init_searchpane();
  init_search();
  init_globals();
  init_favorites();
  init_feedback();
  init_display();
  init_evals();
  init_logout();
  init_about();

})

// loads course from url
var init_load = function () {
  // Parse and display search parameters, if any exist
  parseSearchParameters()

  // Parse course from the URL to determine which course (if any) to display on pageload
  var pathnameMatch = /^\/course\/(\d+)$/.exec(window.location.pathname)
  if (pathnameMatch !== null && pathnameMatch.length === 2) {
    // Load the course
    courseId = parseInt(pathnameMatch[1])
    if (!isNaN(courseId)) displayCourseDetails(courseId)
  }
}

// Handle displaying a course after pushing the back/forward button in the browser
window.onpopstate = function (event) {
  if (event.state && event.state.courseID) {
    displayCourseDetails(event.state.courseID)
  }
  parseSearchParameters()
}

// Parse the URL to check for whether the app should be showing a course and displaying any search terms
var parseSearchParameters = function () {
  // Parse search terms
  var unparsedParameters = window.location.search.replace('?', '').split('&')
  var parameters = {}
  var searchbox = getDeviceSearchBox();
  for (var parametersIndex in unparsedParameters) {
    var keyValue = unparsedParameters[parametersIndex].split('=')
    if (keyValue.length === 2) {
      parameters[keyValue[0]] = decodeURIComponent(keyValue[1])
    }
  }
  if (parameters.hasOwnProperty('search')) {
    $(getDeviceSearchBox()).val(parameters.search)
  }
  if (parameters.hasOwnProperty('semester')) {
    $('#semester').data('query', parameters.semester).val(parameters.semester)
  }
  if (parameters.hasOwnProperty('sort')) {
    $('#sort').val(parameters.sort)
  }
  if (parameters !== {}) {
    searchForCourses()
  }
}

// to initialize draggability
var init_panes = function() {
  $('#search-pane').resizable({
    handleSelector: "#search-resizer",
    resizeHeight: false
  })

  $('#info-pane').resizable({
    handleSelector: "#info-resizer",
    resizeHeight: false,
    resizeWidthFrom: 'left'
  })
}

// to initalize search pane section collapsing
var init_searchpane = function() {
  $('#favorite-courses').css('max-height', '30%')

    // toggle display of favorite things
  var toggleFavDisplay = function() {
    var isVisible = $('#favorite-courses').css('display') !== 'none'

    var icon = $('#fav-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').slideToggle()
  }
  $('#fav-display-toggle').click(toggleFavDisplay)

  // toggle display of search result things
  var toggleSearchDisplay = function() {
    var isVisible = $('#search-results').css('display') !== 'none'

    var icon = $('#search-display-toggle')
    icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
    icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
    $('#favorite-courses').animate({'max-height': (isVisible ? '100%' : '30%')})

    $('#search-results').slideToggle()
  }
  $('#search-display-toggle').click(toggleSearchDisplay)
}

// to initialize searching function
var init_search = function() {
  // Every time a key is pressed inside the #searchbox, call the searchForCourses function
  $(getDeviceSearchBox()).on('input', searchForCourses)
  $('#semester, #sort').change(searchForCourses)

  // load the semesters for the dropdown
  $('#semester').children(":not([disabled])").remove()
  $.get('/api/semesters', function (semesters) {
    for (var semesterIndex in semesters) {
      var thisSemester = semesters[semesterIndex]
      var option = $(document.createElement('option')).attr('value', thisSemester._id).text(thisSemester.name)
      $('#semester').append(option)
    }
    if ($('#semester').data('query')) {
      $('#semester').children('[value=' + $('#semester').data('query') +']').attr('selected', true)
    } else {
      $('#semester').children().eq(1).attr('selected', true)
    }
  })
}

// to initialize global data
var init_globals = function() {
  // Saving the user's netid so it is globally available
  document.netid = $("#netid").text()
}

// to initialize favorites list
var init_favorites = function() {
  // call api to get favorites and display
  document.favorites = []
  $.get('/api/user/favorites', function(courses) {

    $('#favorite-header').css('display', (courses === undefined || courses.length === 0) ? 'none' : '')

    $('#favs').html('');
    $('#favorite-title').html('');

    $('#favorite-title').append(courses.length + ' Favorite Course' + (courses.length !== 1 ? 's' : ''))
    for (var courseIndex in courses) {
      var thisCourse = courses[courseIndex];

      // Saving this user's favorite courses to the global scope
      document.favorites.push(thisCourse._id)

      // append favorite into favs pane
      $('#favs').append(newDOMResult(thisCourse, {"semester": 1, "tags": 1}));
    }
  }).done(updateFavIcons).done(displayActive)
}

// to initialize feedback mechanism
var init_feedback = function() {
  // submission
  $('#feedback-form').one('submit', function() {
    var submitURL = ''
    submitURL += 'https://docs.google.com/a/princeton.edu/forms/d/e/1FAIpQLSdX3VTSbVfwOOtwMxhWiryQFrlBNuJDUTlp-lUmsV-S0xFM_g/formResponse?'
    submitURL += 'entry.1257302391=' + document.netid
    submitURL += '&entry.680057223=' + encodeURIComponent($('#feedback-text').val())

    $(this)[0].action = submitURL
    $('#feedback-submit').text('Thank You!')
    $('#feedback-submit').addClass('disabled')
    $('#feedback-text').attr('disabled', true)
    setTimeout(toggleFeedback, 1000)
  })

  $('#feedback-toggle').click(function() {return toggleNavbar('feedback')})
}

// to initialize display toggling
var init_display = function() {
  $('#disp-instructors-toggle'  ).click(function() {section_toggle('disp', 'instructors')})
  $('#disp-description-toggle'  ).click(function() {section_toggle('disp', 'description')})
  $('#disp-assignments-toggle'  ).click(function() {section_toggle('disp', 'assignments')})
  $('#disp-grading-toggle'      ).click(function() {section_toggle('disp', 'grading')})
  $('#disp-prerequisites-toggle').click(function() {section_toggle('disp', 'prerequisites')})
  $('#disp-equivalent-toggle'   ).click(function() {section_toggle('disp', 'equivalent')})
  $('#disp-other-toggle'        ).click(function() {section_toggle('disp', 'other')})
  $('#disp-classes-toggle'      ).click(function() {section_toggle('disp', 'classes')})
}

// to initialize evals toggling
var init_evals = function() {
  $('#evals-semesters-toggle').click(function() {section_toggle('evals', 'semesters')})
  $('#evals-numeric-toggle').click(function() {section_toggle('evals', 'numeric')})
  $('#evals-comments-toggle').click(function() {section_toggle('evals', 'comments')})
}

// to intialize logout button
var init_logout = function() {
  $('#menu-bar').mouseleave(function() {
    var isNetidInvisible = $('#netid').css('display') === 'none'
    if (isNetidInvisible) $('#netid, #logout').animate({width: 'toggle'})
  })

  $('#netid').click(function() {
    var isLogoutVisible = $('#logout').css('display') !== 'none'
    if (!isLogoutVisible) $('#netid, #logout').animate({width: 'toggle'})
    return false;
  })
}

// to initialize about display
var init_about = function() {
  $('#about-toggle').click(function() {return toggleNavbar('about')})
  $('#about-popup-close').click(function() {return toggleNavbar('about')})
}

// toggles display / eval sections
var section_toggle = function(pane, section) {
  var body = $('#' + pane + '-' + section + '-body')
  var icon = $('#' + pane + '-' + section + '-toggle')
  var isVisible = (body.css('display') !== 'none')

  icon.removeClass(isVisible ? 'fa-minus' : 'fa-plus')
  icon.addClass(isVisible ? 'fa-plus' : 'fa-minus')
  body.slideToggle();
}
