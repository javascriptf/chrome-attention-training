const express = require("express")
const { registerUser, loginUser, currentUser, authenticateToken } = require("../controllers/userController")
const router = express.Router()

router.post("/register", registerUser)


router.post("/login", loginUser)


router.get("/current", authenticateToken, currentUser)

module.exports = router