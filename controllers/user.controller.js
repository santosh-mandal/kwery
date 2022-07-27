const db = require('../db');
const { check, oneOf, validationResult } = require('express-validator');
var moment = require('moment'); // require
var fs = require("fs");
var ObjectId = require('mongodb').ObjectId;
const auth = require('../controllers/auth.controller');
var bcrypt = require('bcryptjs');

module.exports = {
    index: (req, res, next) => {
        db().then(async (db) => {
            const pipeline = [
                {
                    '$set': {
                        '_id': '$_id',
                        'type': "story"
                    }
                }, {
                    '$unionWith': {
                        'coll': 'questions',
                        'pipeline': [
                            {
                                '$set': {
                                    '_id': '$_id',
                                    'type': "question"
                                }
                            }
                        ]
                    }
                }, {
                    '$sort': {
                        'date': 1
                    }
                },
                {
                    '$lookup': {
                        'from': "users",
                        'localField': "user_id",
                        'foreignField': "_id",
                        'as': "user",
                    }
                },
                {
                    "$unwind": "$hashtag"
                },
                {
                    "$lookup": {
                        "from": "hastags",
                        "localField": "hashtag",
                        "foreignField": "_id",
                        "as": "hastags"
                    }
                },
                {
                    "$group": {
                        "_id": '$_id',
                        "story": { $first: '$story' },
                        "question": { $first: '$question' },
                        "question_body": { $first: '$question_body' },
                        "user_id": { $first: '$user_id' },
                        "date_time": { $first: '$date_time' },
                        "type": { $first: '$type' },
                        "user": { $first: '$user' },
                        "hastags": {
                            "$push": { $first: '$hastags' }
                        }
                    }

                },
                {
                    '$project': {
                        "user.password": 0 //if need full mapping then mapping:1
                    }
                }
            ];

            db.collection('stories').aggregate(pipeline).toArray()
                .then(result => {
                    res.status(200).send(result);
                }).catch(err => {
                     res.status(400).send("Query unsuccessfull");
                })
        }).catch((error) => {
            console.error(error);
        });
    },
    uplaodImage: async (req, res, next) => {
        await check('img')
            .exists()
            .withMessage('img is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        let filepath = './public/uploads/profile-img';
        let file = `${moment().unix()}.png`;
        fs.writeFile(`${filepath}/${file}`, req.body.img, 'base64', (err) => {
            if (err)
                console.log(err);
            else {
                console.log("File written successfully\n");
            }
        });
        //res.status(200).send({
        let imgurl = `${req.protocol}://${req.headers.host}/uploads/profile-img/${file}`;
        //});

        db().then(async (db) => {
            db.collection("users").updateOne({ "_id": req.user._id }, { $set: { image: imgurl } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                }else {
                    responce = {
                        "message": "Successfully image updated.",
                        "imgurl": imgurl
                    };
                    res.status(200).send(responce);
                }
              
            });
        })
    },
    profileDetails: async (req, res, next) => {
        db().then(async (db) => {
            db.collection('users').findOne({ "_id": req.user._id }, { projection: { password: 0 } })
                .then(result => {
                    if (!result['image']) {
                        if (result['sex'] == 'female') {
                            result['image'] = `${req.protocol}://${req.headers.host}/img/female-avatar.svg`;
                        } else {
                            result['image'] = `${req.protocol}://${req.headers.host}/img/male-avatar.svg`;
                        }
                    }
                    res.status(200).send(result);
                }).catch(err => {
                     res.status(400).send("Query unsuccessfull");
                })
        }).catch((error) => {
            console.error(error);
        });
    },
    updateProfileDetails: async (req, res, next) => {
        await check('email')
            .isEmail()
            .withMessage('must be an valid email')
            .custom((value, { req }) => {
                return auth.findUserByEmail(value).then(user => {
                    if (user && user._id.toHexString() != req.user._id.toHexString()) {
                        return Promise.reject('email already use in another account');
                    }
                });
            })
            .run(req)
        await check('mobile')
            .isLength({ min: 10, max: 10 })
            .withMessage('must be 10 chars long')
            .custom((value, { req }) => {
                return auth.findUserByMobile(value).then(user => {;
                    if (user && user._id.toHexString() !=req.user._id.toHexString()) {
                        return Promise.reject('Mobile number already use in another account');
                    }
                });
            })
            .run(req);
        await check('name')
            .exists()
            .withMessage('name is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }

      
        delete req.body._id;
        delete req.body.image;
        db().then(async (db) => {
            db.collection("users").updateMany({ "_id": req.user._id }, { $set: req.body  }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                }else {
                    responce = {
                        "message": "Successfully Profile updated."
                    };
                    res.status(200).send(responce);
                }
              
            });
        })
    },

    
    updateProfilePassword: async (req, res, next) => {

        await check('password')
            .isLength({ min: 6 })
            .withMessage('must be at least 6 chars long')
            .run(req);

        await check('passwordConfirmation')
            .exists()
            .isLength({ min: 6 })
            .withMessage('must be at least 6 chars long')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Password confirmation does not match password');
                }
                return true;
            })
            .run(req)

        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }

        db().then((db) => {
            db.collection("users").findOne({"_id": req.user._id }, async (err, result) => {
                if (result && (await bcrypt.compare(req.body.current_password, result.password))) {
                    req.body.password = await bcrypt.hash(req.body.password, 10);
                    db.collection("users").updateOne({ "_id": req.user._id }, { $set: { password: req.body.password } }, async (err, result) => {
                        let responce;
        
                        if (err) {
                            responce = {
                                "errors": err
                            };
                            res.status(400).send(responce);
                        }else{
                            responce = {
                                "message": "Successfully password updated",
                            };
                            res.status(200).send(responce);
                        }
                    });
                } else {
                    let data = {
                        "errors": "Plaese enter valid current password",
                    };
                    res.status(400).send(data);
                }

            });
        }).catch((error) => {
            let data = {
                "errors": error,
            };
            res.status(400).send(data);
        });

        

    },
}
