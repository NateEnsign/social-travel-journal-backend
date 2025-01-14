const express = require("express");

const router = express.Router();

const DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State Building",
    description: "The tallest building in the world",
    location: {
      lat: 40.5555555,
      lng: -73.9999999,
    },
    address: "20 W 34th St, New York, NY 10001",
    creator: "u1",
  },
];

router.get("/:pid", (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find((p) => {
    return p.id === placeId;
  });
  res.json({ place });
});

router.get('/user/:uid', (req, res, next) => {
    const userId = req.params.uid;

    const place = DUMMY_PLACES.find(p => {
        return p.creator === userId;
    })
    res.json({place});
})




module.exports = router;
