const asyncHandler = require('express-async-handler')
const {db,getAllUsers} = require('../models/userModel')
const jwt = require('jsonwebtoken')

require('dotenv').config()

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
    // Authenticate User
    const username = req.body.username
    const user = {name: username}
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
    res.json({message: "login user", accessToken: accessToken })
})


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    
    if(token == null) res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        req.user = user
        next()
    })
}


const getUsersQuery = ` SELECT * FROM user `



// @desc Current User
// @route POST /api/users/current
// @access private
const currentUser = asyncHandler(async (req, res) => {
    // let results = []
    let results = await getAllUsers(db)
    res.json({user: req.user, results: results})
})


module.exports = {registerUser, loginUser, currentUser, authenticateToken}