const asyncHandler = require('express-async-handler')
const {db,getAllUsers} = require('../models/userModel')


// @desc Register a User
// @route POST /api/users/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
    res.json({message: "register a user"})
})

// @desc Login a User
// @route POST /api/users/login
// @access public
const loginUser = asyncHandler(async (req, res) => {
    res.json({message: "login user"})
})

const getUsersQuery = ` SELECT * FROM user `



// @desc Current User
// @route POST /api/users/current
// @access private
const currentUser = asyncHandler(async (req, res) => {
    // let results = []
    let results = await getAllUsers(db)
    res.json({results})
})


module.exports = {registerUser, loginUser, currentUser}