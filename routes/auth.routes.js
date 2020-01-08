const {Router} = require('express')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const User = require('../modules/User')
const router = Router()

// /api/auth/register
router.post(
	'/register',
	[
		check('email', 'Email incorrect').isEmail(),
		check('password', 'Min length of password is 6 symbols')
			.isLength({min: 6})
	],
	async (req, res) => {
		try {
			console.log('Body:', req.body)
			const errors = validationResult(req)
			
			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Incorrect data for registration'
				})
			}
			
			const {email, password} = req.body
			
			const candidate = await User.findOne({email})
			
			if (candidate) {
				return res.status(400).json({message: 'This user already was'})
			}
			
			const hashedPassword = await bcrypt.hash(password, 12)
			const user = new User({email, password: hashedPassword})
			
			await user.save()
			
			res.status(201).json({message: 'User was done'})
			
		} catch (e) {
			res.status(500).json({message: 'Something wrong, try again'})
		}
	})

// /api/login
router.post(
	'/login',
	[
		check('email', 'Entry correct Email').normalizeEmail().isEmail(),
		check('password', 'Entry password').exists()
	],
	async (req, res) => {
		
		try {
			const errors = validationResult(req)
			
			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Incorrect data for entry to system'
				})
			}
			
			const {email, password} = req.body
			
			const user = await User.findOne({email})
			
			if (!user) {
				return res.status(400).json({message: 'User do not found'})
			}
			
			const isMatch = await bcrypt.compare(password, user.password)
			
			if (!isMatch) {
				return res.status(400).json({message: 'Password is wrong, try again'})
			}
			
			const token = jwt.sign(
				{userId: user.id},
				config.get('jwtSecret'),
				{expiresIn: '1h'}
			)
			
			res.json({token, userId: user.id})
			
			
		} catch (e) {
			res.status(500).json({message: 'Something wrong, try again'})
		}
		
})

module.exports = router