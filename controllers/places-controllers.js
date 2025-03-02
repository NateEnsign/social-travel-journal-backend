const fs = require('fs');
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require('mongoose');

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/Place");
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find a place for the provided id.", 404);
    return next(error);
  }

  res.json({ place: place.toObject({getters: true}) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err){
    const error = new HttpError(
      'Fetching places failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find places for the provided user id.", 404)
    );
  }

  res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true})) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const newId = uuidv4();

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err){
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  if (!user){
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  console.log(user);

  //This code below is nessisary to create the connection between the created place and a user. This creates an id for the created place and it adds that id to the user who created it
  try {
    const sesh = await mongoose.startSession();
    sesh.startTransaction();
    await createdPlace.save({session: sesh});
    user.places.push(createdPlace);
    await user.save({ session: sesh});
    await sesh.commitTransaction();

  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next (new HttpError("Invalid inputs passed, please check your data.", 422)
  );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err){
    const error = new HttpError(
      'Something went wrong, could not update place.', 500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId){
    const error = new HttpError(
      'You are not allowed to edit this place.',
      401
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  }catch (err){
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }


  res.status(200).json({ place: place.toObject({ getters: true}) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
 
let place;
try {
  place = await Place.findById(placeId).populate('creator'); //.pupulate allows you to refer to a document stored in another collection and work with that document
} catch (err){
  const error = new HttpError(
    'Something went wrong, could not find place to delete.',
    500
  );
  return next(error);
}

if (!place){
  const error = new HttpError('Could not find a place for this id.', 404);
  return next(error);
}

if (place.creator.id !== req.userData.userId){
  const error = new HttpError(
    'You are not allowed to delete this place.',
    401
  );
  return next(error);
}

//code below is required to make it such that when a place is deleted, the placeId that is stored in the user array of places is removed from that user as well

const imagePath = place.image;

try {
  const sesh = await mongoose.startSession();
  sesh.startTransaction();
  await place.deleteOne({ session: sesh});
  place.creator.places.pull(place);
  await place.creator.save({session: sesh});
  await sesh.commitTransaction();

} catch (err) {
  const error = new HttpError(
    'Something went wrong, could not delete place.',
    500
  );
  return next(error);
}

fs.unlink(imagePath, err => {
  console.log(err);
});

  res.status(200).json({ message: "Deleted place." });
};


exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;


