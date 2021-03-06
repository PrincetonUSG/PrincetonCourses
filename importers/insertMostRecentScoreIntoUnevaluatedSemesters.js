// Load config variables from the .env file
// require('dotenv').config({path: '../.env'})
require('dotenv').config()

// Load internal modules
var courseModel = require('../models/course.js')
require('../models/semester.js')

// Connect to the database
require('../controllers/database.js')

async function batchCourses(courses) {

    // Throttle over batches of 3k per min
    const total = courses.length;
    console.log('Found %d matching courses', total)
    const batches = Math.ceil(total / 3000)
    for (let b = 0; b < batches; b++) {
        const courseBatch = courses.slice(b*3000, Math.min((b + 1)*3000, total));
        console.log(`Batch ${b+1}/${batches}`);
        let coursesPending = courseBatch.length

        for (const [index, course] of courseBatch.entries()) {
            let promises = []

            // Find the most recent Quality of Course score across all the semesters of this course
            promises.push(courseModel.find({
                courseID: course.courseID,
                'scores.Quality of Course': {
                    $exists: true
                },
                scoresFromPreviousSemester: {
                    $not: {
                        $eq: true
                    }
                }
            }, {
                'scores.Quality of Course': 1,
                courseID: 1,
                'semester': 1
            }).sort({_id: -1}).limit(1).exec())

            // Find the most recent Quality of Course score taught by this instructor
            if (typeof (course) !== 'undefined' && typeof (course.instructors) !== 'undefined' && course.instructors.length > 0 && (course.instructors[0]._id) !== 'undefined') {
                promises.push(courseModel.find({
                    courseID: course.courseID,
                    'scores.Quality of Course': {
                        $exists: true
                    },
                    scoresFromPreviousSemester: {
                        $not: {
                            $eq: true
                        }
                    },
                    instructors: course.instructors[0]._id
                }, {
                    'scores.Quality of Course': 1,
                    courseID: 1,
                    'semester': 1
                }).sort({_id: -1}).limit(1).exec())
            }

            await Promise.all(promises)/*.then(wait(Math.random() * 30 * 1000))*/.then(function (results) {
                let mostRecentCourseWithRatings
                console.log('Promises resolved (courses pending: %d)', coursesPending)

                // Determine which course evalaution score to use
                if (typeof (results[1]) !== 'undefined' && results[1].length > 0) {
                    mostRecentCourseWithRatings = results[1][0]
                } else {
                    mostRecentCourseWithRatings = results[0][0]
                }

                // Insert this score into the course in question
                if (typeof (mostRecentCourseWithRatings) !== 'undefined') {
                    console.log('About to issue update (courses pending: %d)', coursesPending)
                    courseModel.update({
                        _id: course._id
                    }, {
                        scores: {
                            'Quality of Course': mostRecentCourseWithRatings.scores['Quality of Course']
                        },
                        scoresFromPreviousSemesterSemester: mostRecentCourseWithRatings.semester._id,
                        scoresFromPreviousSemester: true
                    }, function (err) {
                        if (err) {
                            console.log(err)
                        } else {
                            console.log('Inserted into course', course._id, 'the score', mostRecentCourseWithRatings.scores['Quality of Course'], 'from', mostRecentCourseWithRatings._id)
                            if (--coursesPending === 0) {
                                console.log(`Finished Batch ${b}`);
                                return;
                            }
                        }
                    })
                } else {
                    if (--coursesPending === 0) {
                        console.log(`Finished Batch ${b}`);
                        return;
                    }
                }
            }).catch(function (reason) {
                console.log(reason)
                process.exit(0)
            })
        }
    }
    console.log("Done!")
    process.exit(0)
}

// Find  all the courses for which scores do not exist or scores is {}
courseModel.find({
    semester: parseInt(process.argv[2]) || {$gt: 0},
    $or: [
        {
            scores: {}
        }, {
            scores: {
                $exists: false
            }
        }, {
            scoresFromPreviousSemester: true
        }
    ]
}, {
    _id: true,
    courseID: true,
    instructors: true,
    semester: true
}).then(batchCourses).catch(function (reason) {
    console.log(reason)
    process.exit(0)
})
