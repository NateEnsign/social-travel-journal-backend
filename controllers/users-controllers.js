const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator')

const HttpError = require('../models/http-error');
const User = require('../models/user');

const DUMMY_USERS = [
    {
        id: 'u1',
        name: 'Nate Ensign',
        email: 'test@test.com',
        password: 'test'
    }
]



const getUsers = (req, res, next) => {
    res.json({users: DUMMY_USERS})
}

// const signup = async (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         throw new HttpError('Invalid inputs passed, please check your data.', 422);
//     }

//     const { name, email, password } = req.body;

//     let existingUser;
//     try {
//         existingUser = await User.findOne({ email: email })
//     } catch (err){
//         const error = new HttpError(
//             'Sign up failed, please try again later.',
//             500
//         );
//         return next(error);
//     }

//     if (existingUser) {
//         const error = new HttpError(
//             'Email provided is already connected to an account. Please login instead.',
//             422
//         );
//         return next(error);
//     }

//     const createdUser = new User({
//         name,
//         email,
//         image: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png',
//         password,
//         places
//     })

//     try {
//         await createdUser.save();
//       } catch (err) {
//         const error = new HttpError(
//           "Sign up failed, please try again.",
//           500
//         );
//         return next(error);
//       }

//     res.status(201).json({user: createdUser.toObject({ getters: true})});
// }

const signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
     new HttpError('Invalid inputs passed, please check your data.', 422)
      );
    }
    const { name, email, password, places } = req.body;
  
    const hasUser = DUMMY_USERS.find(u => u.email === email);
    if (hasUser) {
      throw new HttpError('Could not create user, email already exists.', 422);
    }
  
    const createdUser = {
      name,
      email,
      password,
      image: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png',
      places
    };
  
    DUMMY_USERS.push(createdUser);
  
    res.status(201).json({user: createdUser});
  };

const login = (req, res, next) => {
    const { email, password } = req.body;

    const identifiedUser = DUMMY_USERS.find(u => u.email === email);
    if (!identifiedUser || identifiedUser.password !== password){
        throw new HttpError('Could not find user, credentials seems to be incorrect.', 401);
    }
    res.json({message: 'Logged in!'})
}

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;