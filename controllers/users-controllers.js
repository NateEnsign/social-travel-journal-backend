const { v4: uuidv4 } = require('uuid');

const HttpError = require('../models/http-error');

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

const signup = (req, res, next) => {
    const { name, email, password } = req.body;
    const newId = uuidv4();

    const createdUser = {
        id: newId,
        name: name,
        email: email,
        password: password
    }

    DUMMY_USERS.push(createdUser);

    res.status(201).json({user: createdUser});
}

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