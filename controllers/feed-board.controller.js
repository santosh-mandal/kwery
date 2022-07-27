const db = require('../db');
const { check, oneOf, validationResult } = require('express-validator');
var moment = require('moment'); // require
var fs = require("fs");
var ObjectId = require('mongodb').ObjectId;
module.exports = {
    index: (req, res, next) => {

        db().then(async (db) => {

            let search = {
                $match:
                {

                }
            }
            if (req.query.type == "my-questions") {
                search = {
                    $match:
                    {
                        $and:
                            [
                                { type: 'question' },
                                { user_id: req.user._id }
                            ]
                    }
                }
            }
            if (req.query.type == "my-stories") {
                search = {
                    $match:
                    {
                        $and:
                            [
                                { type: 'story' },
                                { user_id: req.user._id }
                            ]
                    }
                }
            }
            if (req.query.type == "my-favorite-questions") {
                search = {
                    $match:
                    {
                        $and:
                            [
                                { type: 'question' },
                                { isMyFavorite: { $gt: 0 } }
                            ]
                    }

                }
            }
            if (req.query.type == "my-favorite-stories") {
                search = {
                    $match:
                    {
                        $and:
                            [
                                { type: 'story' },
                                { isMyFavorite: { $gt: 0 } }
                            ]
                    }
                }
            }
            if (req.query.type == "my-like-questions") {
                search = {
                    $match:
                    {

                        $and:
                            [
                                { type: 'question' },
                                { isMyLike: { $gt: 0 } }
                            ]
                    }

                }
            }
            if (req.query.type == "my-like-stories") {
                search = {
                    $match:
                    {
                        $and:
                            [
                                { type: 'story' },
                                { isMyLike: { $gt: 0 } }
                            ]
                    }

                }
            }


            let hashtagSearch = {
                $match:
                {

                }
            }

            if (req.query.type == "hashtag") {
                hashtagSearch = {
                    $match: { hashtag: ObjectId(req.query.hashtagid) }
                }
            }
            const pipeline = [
                {
                    '$set': {
                        '_id': '$_id',
                        'type': "story",
                    }
                }, {
                    '$unionWith': {
                        'coll': 'questions',
                        'pipeline': [
                            {
                                '$set': {
                                    '_id': '$_id',
                                    'type': "question",
                                }
                            }
                        ]
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
                    "$unwind": {
                        "path": "$hashtag",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                hashtagSearch,
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
                        },
                        "answersComments": { $first: '$answersComments' },
                        "reactions": { $first: '$reactions' },
                    }
                },
                {
                    "$unwind": {
                        "path": "$answersComments",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    '$sort': {
                         "answersComments.date_time" : -1
                    }
                 
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "answersComments.user_id",
                        "foreignField": "_id",
                        "as": "answersComments.user"
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
                        "hastags": { $first: '$hastags' },
                        "answersComments": {
                            "$push": '$answersComments'
                        },
                        "reactions": { $first: '$reactions' },
                    }
                },
                {
                    "$unwind": {
                        "path": "$reactions",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "reactions.user_id",
                        "foreignField": "_id",
                        "as": "reactions.user"
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
                        "type": { $first: '$type' },
                        "user": { $first: '$user' },
                        "hastags": { $first: '$hastags' },
                        "answersComments": { $first: '$answersComments' },
                        "reactions": {
                            "$push": '$reactions'
                        },
                    }
                },
                {
                    '$set': {
                        likes: {
                            $filter: {
                                input: "$reactions",
                                as: "reaction",
                                cond: {
                                    $eq: ["$$reaction.type", "like"]
                                }
                            }
                        },
                        myLikes: {
                            $filter: {
                                input: "$reactions",
                                as: "reaction",
                                cond: {
                                    $and: [
                                        { $eq: ["$$reaction.type", "like"] },
                                        { $eq: ["$$reaction.user_id", req.user._id] }
                                    ]
                                }
                            },
                        },
                        favorites: {
                            $filter: {
                                input: "$reactions",
                                as: "reaction",
                                cond: {
                                    $eq: ["$$reaction.type", "favorite"]
                                }
                            },
                        },
                        myFavorites: {
                            $filter: {
                                input: "$reactions",
                                as: "reaction",
                                cond: {
                                    $and: [
                                        { $eq: ["$$reaction.type", "favorite"] },
                                        { $eq: ["$$reaction.user_id", req.user._id] }
                                    ]
                                }

                            },
                        },
                    }
                },
                {
                    '$set': {
                        "totalLikes": { $cond: { if: { $isArray: "$likes" }, then: { $size: "$likes" }, else: "0" } },
                        "totalFavorites": { $cond: { if: { $isArray: "$favorites" }, then: { $size: "$favorites" }, else: "0" } },
                        "totalAnswersComments": { $cond: { if: { $isArray: "$answersComments" }, then: { $size: "$answersComments" }, else: "0" } },
                        "isMyFavorite": { $cond: { if: { $isArray: "$myFavorites" }, then: { $size: "$myFavorites" }, else: "0" } },
                        "isMyLike": { $cond: { if: { $isArray: "$myLikes" }, then: { $size: "$myLikes" }, else: "0" } }
                    }
                },
                search,
                {
                    '$project': {
                        "user.password": 0,
                        "answersComments.user.password": 0,
                        "likes.user.password": 0,
                        "favorites.user.password": 0,
                        "reactions": 0,
                        "myLikes": 0,
                        "myFavorites": 0
                    }
                },

                {
                    '$sort': {
                        'date_time': -1,
                         "answersComments.sku" : -1
                    },
                 
                }
            ];

            db.collection('stories').aggregate(pipeline).toArray()
                .then(result => {
                    res.status(200).send(result);
                }).catch(err => {
                    res.status(400).send("Query unsuccessfull");
                })
        }).catch((error) => {
            res.status(400).send(error);
        });
    },
    feedBoardPost: (req, res, next) => {
        db().then(async (db) => {

            let groupPipeline = {
                $group:
                {

                }
            }
            let collection = "";
            if (req.params.type == 'question') {
                collection = "questions";
                groupPipeline = {
                    $group:
                    {
                        "_id": '$_id',
                        "question": { $first: '$question' },
                        "question_body": { $first: '$question_body' },
                        "date_time": { $first: '$date_time' },
                        "user_id": { $first: '$user_id' },
                        "hastags": {
                            "$push": { $first: '$hastags' }
                        }
                    }
                }
            } else if (req.params.type == 'story') {
                collection = "stories";
                groupPipeline = {
                    $group:
                    {
                        "_id": '$_id',
                        "story": { $first: '$story' },
                        "date_time": { $first: '$date_time' },
                        "user_id": { $first: '$user_id' },
                        "hastags": {
                            "$push": { $first: '$hastags' }
                        }
                    }
                }
            }
            const pipeline = [
                {
                    "$unwind": {
                        "path": "$hashtag",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    "$lookup": {
                        "from": "hastags",
                        "localField": "hashtag",
                        "foreignField": "_id",
                        "as": "hastags"
                    }
                },
                groupPipeline,
                {
                    $match: { _id: ObjectId(req.params.feedBoardId) }
                },

            ];
            db.collection(collection).aggregate(pipeline).toArray()
                .then(result => {
                    res.status(200).send(result[0]);
                }).catch(err => {
                    res.status(400).send("Query unsuccessfull");
                })
        }).catch((error) => {
            res.status(400).send(error);
        });
    },
    feedBoardPostDelete: (req, res, next) => {
        db().then(async (db) => {
            let collection = "";
            if (req.params.type == 'question') {
                collection = "questions";
            } else if (req.params.type == 'story') {
                collection = "stories";
            }
            db.collection(collection).deleteOne({ _id: ObjectId(req.params.feedBoardId) })
                .then(result => {
                    res.status(200).send(
                        {
                            "message": `Successfully ${req.params.type} deleted`,

                        }
                    );
                }).catch(err => {
                    res.status(400).send("Query unsuccessfull");
                })
        }).catch((error) => {
            res.status(400).send(error);
        });
    },
    feedBoardById: (req, id) => {
        return new Promise((resolve, reject) => {
            db().then(async (db) => {
                const pipeline = [
                    {
                        '$set': {
                            '_id': '$_id',
                            'type': "story",
                        }
                    }, {
                        '$unionWith': {
                            'coll': 'questions',
                            'pipeline': [
                                {
                                    '$set': {
                                        '_id': '$_id',
                                        'type': "question",
                                    }
                                }
                            ]
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
                        "$unwind": {
                            "path": "$hashtag",
                            "preserveNullAndEmptyArrays": true
                        }
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
                            },
                            "answersComments": { $first: '$answersComments' },
                            "reactions": { $first: '$reactions' },
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$answersComments",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$lookup": {
                            "from": "users",
                            "localField": "answersComments.user_id",
                            "foreignField": "_id",
                            "as": "answersComments.user"
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
                            "hastags": { $first: '$hastags' },
                            "answersComments": {
                                "$push": '$answersComments'
                            },
                            "reactions": { $first: '$reactions' },
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$reactions",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$lookup": {
                            "from": "users",
                            "localField": "reactions.user_id",
                            "foreignField": "_id",
                            "as": "reactions.user"
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
                            "type": { $first: '$type' },
                            "user": { $first: '$user' },
                            "hastags": { $first: '$hastags' },
                            "answersComments": { $first: '$answersComments' },
                            "reactions": {
                                "$push": '$reactions'
                            },
                        }
                    },
                    {
                        '$set': {
                            likes: {
                                $filter: {
                                    input: "$reactions",
                                    as: "reaction",
                                    cond: {
                                        $eq: ["$$reaction.type", "like"]
                                    }
                                }
                            },
                            myLikes: {
                                $filter: {
                                    input: "$reactions",
                                    as: "reaction",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$reaction.type", "like"] },
                                            { $eq: ["$$reaction.user_id", req.user._id] }
                                        ]
                                    }
                                },
                            },
                            favorites: {
                                $filter: {
                                    input: "$reactions",
                                    as: "reaction",
                                    cond: {
                                        $eq: ["$$reaction.type", "favorite"]
                                    }
                                },
                            },
                            myFavorites: {
                                $filter: {
                                    input: "$reactions",
                                    as: "reaction",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$reaction.type", "favorite"] },
                                            { $eq: ["$$reaction.user_id", req.user._id] }
                                        ]
                                    }

                                },
                            },
                        }
                    },
                    {
                        '$set': {
                            "totalLikes": { $cond: { if: { $isArray: "$likes" }, then: { $size: "$likes" }, else: "0" } },
                            "totalFavorites": { $cond: { if: { $isArray: "$favorites" }, then: { $size: "$favorites" }, else: "0" } },
                            "totalAnswersComments": { $cond: { if: { $isArray: "$answersComments" }, then: { $size: "$answersComments" }, else: "0" } },
                            "isMyFavorite": { $cond: { if: { $isArray: "$myFavorites" }, then: { $size: "$myFavorites" }, else: "0" } },
                            "isMyLike": { $cond: { if: { $isArray: "$myLikes" }, then: { $size: "$myLikes" }, else: "0" } }
                        }
                    },
                    {
                        '$project': {
                            "user.password": 0,
                            "answersComments.user.password": 0,
                            "likes.user.password": 0,
                            "favorites.user.password": 0,
                            "reactions": 0,
                            "myLikes": 0,
                            "myFavorites": 0
                        }
                    },
                    {
                        $match: { _id: ObjectId(id) }
                    },
                    { $limit: 1 }

                ];

                db.collection('stories').aggregate(pipeline).toArray()
                    .then(result => {
                        resolve(result)
                    }).catch(err => {
                         res.status(400).send("Query unsuccessfull");
                        reject(err)
                    })
            }).catch((error) => {
                console.error(error);
                reject(error)
            });

        });

    },
    popularHastags: (req, res, next) => {

        db().then(async (db) => {
            const pipeline = [
                {
                    '$set': {
                        '_id': '$_id',
                        'type': "story",
                    }
                }, {
                    '$unionWith': {
                        'coll': 'questions',
                        'pipeline': [
                            {
                                '$set': {
                                    '_id': '$_id',
                                    'type': "question",
                                }
                            }
                        ]
                    }
                },
                {
                    "$unwind": {
                        "path": "$hashtag"
                    }
                },
                {
                    "$lookup": {
                        "from": "hastags",
                        "localField": "hashtag",
                        "foreignField": "_id",
                        "as": "hastagDetails"
                    }
                },

                {
                    "$group": {
                        _id: "$hashtag",
                        count: { $sum: 1 },
                        "hashtag": { $first: '$hastagDetails' },
                    }
                },
                {
                    '$sort': {
                        'count': -1
                    }
                },
                {
                    $limit: 9
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
    quotes: (req, res, next) => {
        const pipeline = [
            {
                $sample:
                {
                    size: 1
                }
            }
        ];
        db().then(async (db) => {
            db.collection('quotes').aggregate(pipeline).toArray()
                .then(result => {
                    res.status(200).send(result);
                }).catch(err => {
                     res.status(400).send("Query unsuccessfull");
                })
        }).catch((error) => {
            console.error(error);
        });
    },
    hastags: (req, res, next) => {
        db().then(async (db) => {
            db.collection('hastags').find().toArray()
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
        let filepath = './public/uploads/img';
        let file = `${moment().unix()}.png`;
        fs.writeFile(`${filepath}/${file}`, req.body.img, 'base64', (err) => {
            if (err)
                console.log(err);
            else {
                console.log("File written successfully\n");
            }
        });
        res.status(200).send({
            imgurl: `${req.protocol}://${req.headers.host}/uploads/img/${file}`
        });
    },
    askQuestion: async (req, res, next) => {
        await check('question')
            .exists()
            .withMessage('Question is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');
            const compareOptionQuery = [];
            if (!req.body.hashtag) {
                req.body.hashtag = [];
            }
            for (let i = 0; i < req.body.hashtag.length; i++) {
                compareOptionQuery.push(
                    req.body.hashtag[i]['name']
                )
            }

            let qyery = {
                'name':
                {
                    '$in':
                        [...compareOptionQuery]
                }
            }
            try {
                let searchResults = await db.collection('hastags').find(qyery).toArray();
                if (searchResults.length > 1) {
                    Object.keys(searchResults).filter(function (key) {
                        let foundKeys = Object.keys(req.body.hashtag).filter(function (hashtagKey) {
                            if (req.body.hashtag[hashtagKey]['name'] == searchResults[key]['name']) {
                                return hashtagKey;
                            }
                        })
                        req.body.hashtag.splice(parseInt(foundKeys), 1);
                    })
                }
                db.collection("hastags").insertMany(req.body.hashtag, async (err, result) => {
                    req.body.hashtag = [];
                    if (result) {
                        req.body.hashtag = Object.values(result.insertedIds);
                    }
                    searchResults.map(function (result, index) {
                        req.body.hashtag.push(result._id)
                    })
                });
                db.collection("questions").insertOne(req.body, async (err, result) => {
                    let responce;
                    if (err) {
                        responce = {
                            "errors": err
                        };
                        res.status(400).send(responce);
                    } else {
                        let data = await module.exports.feedBoardById(req, result['insertedId']);
                        responce = {
                            "message": "Successfully Question asked.",
                            "data": data[0]
                        };
                        res.status(200).send(responce);
                    }
                });
            } catch (err) {
                 res.status(400).send("Query unsuccessfull");
            }





        });
    },
    updateQuestion: async (req, res, next) => {
        await check('question')
            .exists()
            .withMessage('Question is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = ObjectId(req.body.user_id);
            req.body.updated_date_time = moment().format('MM-DD-YYYY, h:mm:ss a');
            const compareOptionQuery = []
            for (let i = 0; i < req.body.hashtag.length; i++) {
                compareOptionQuery.push(
                    req.body.hashtag[i]['name']
                )
            }

            let qyery = {
                'name':
                {
                    '$in':
                        [...compareOptionQuery]
                }
            }
            try {
                let searchResults = await db.collection('hastags').find(qyery).toArray();
                if (searchResults.length > 1) {
                    Object.keys(searchResults).filter(function (key) {
                        let foundKeys = Object.keys(req.body.hashtag).filter(function (hashtagKey) {
                            if (req.body.hashtag[hashtagKey]['name'] == searchResults[key]['name']) {
                                return hashtagKey;
                            }
                        })
                        req.body.hashtag.splice(parseInt(foundKeys), 1);
                    })
                }
                db.collection("hastags").insertMany(req.body.hashtag, async (err, result) => {
                    req.body.hashtag = [];
                    if (result) {
                        req.body.hashtag = Object.values(result.insertedIds);
                    }
                    searchResults.map(function (result, index) {
                        req.body.hashtag.push(result._id)
                    })
                });

                let _id = ObjectId(req.body._id);
                delete req.body._id;
                db.collection("questions").updateOne({ "_id": _id }, { $set: req.body }, async (err, result) => {
                    let responce;
                    if (err) {
                        responce = {
                            "errors": err
                        };
                        res.status(400).send(responce);
                    } else {
                        let data = await module.exports.feedBoardById(req, _id);
                        responce = {
                            "message": "Successfully Question Updated.",
                            "data": data[0]
                        };
                        res.status(200).send(responce);
                    }
                });
            } catch (err) {
                 res.status(400).send("Query unsuccessfull");
            }
        });
    },
    shareStory: async (req, res, next) => {
        await check('story')
            .exists()
            .withMessage('Story is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');
            const compareOptionQuery = [];
            if (!req.body.hashtag) {
                req.body.hashtag = [];
            }
            for (let i = 0; i < req.body.hashtag.length; i++) {
                compareOptionQuery.push(
                    req.body.hashtag[i]['name']
                )
            }

            let qyery = {
                'name':
                {
                    '$in':
                        [...compareOptionQuery]
                }
            }
            try {
                let searchResults = await db.collection('hastags').find(qyery).toArray();
                if (searchResults.length > 1) {
                    Object.keys(searchResults).filter(function (key) {
                        let foundKeys = Object.keys(req.body.hashtag).filter(function (hashtagKey) {
                            if (req.body.hashtag[hashtagKey]['name'] == searchResults[key]['name']) {
                                return hashtagKey;
                            }
                        })
                        req.body.hashtag.splice(parseInt(foundKeys), 1);
                    })
                }
                db.collection("hastags").insertMany(req.body.hashtag, async (err, result) => {
                    req.body.hashtag = [];
                    if (result) {
                        req.body.hashtag = Object.values(result.insertedIds);
                    }
                    searchResults.map(function (result, index) {
                        req.body.hashtag.push(result._id)
                    })
                });
                db.collection("stories").insertOne(req.body, async (err, result) => {
                    let responce;
                    if (err) {
                        responce = {
                            "errors": err
                        };
                        res.status(400).send(responce);
                    } else {
                        let data = await module.exports.feedBoardById(req, result['insertedId']);
                        responce = {
                            "message": "Successfully story shared.",
                            "data": data[0]
                        };
                        res.status(200).send(responce);
                    }
                });
            } catch (err) {
                 res.status(400).send("Query unsuccessfull");
            }
        });

    },
    updateStory: async (req, res, next) => {
        await check('story')
            .exists()
            .withMessage('Story is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');
            const compareOptionQuery = []
            for (let i = 0; i < req.body.hashtag.length; i++) {
                compareOptionQuery.push(
                    req.body.hashtag[i]['name']
                )
            }

            let qyery = {
                'name':
                {
                    '$in':
                        [...compareOptionQuery]
                }
            }
            try {
                let searchResults = await db.collection('hastags').find(qyery).toArray();
                if (searchResults.length > 1) {
                    Object.keys(searchResults).filter(function (key) {
                        let foundKeys = Object.keys(req.body.hashtag).filter(function (hashtagKey) {
                            if (req.body.hashtag[hashtagKey]['name'] == searchResults[key]['name']) {
                                return hashtagKey;
                            }
                        })
                        req.body.hashtag.splice(parseInt(foundKeys), 1);
                    })
                }
                db.collection("hastags").insertMany(req.body.hashtag, async (err, result) => {
                    req.body.hashtag = [];
                    if (result) {
                        req.body.hashtag = Object.values(result.insertedIds);
                    }
                    searchResults.map(function (result, index) {
                        req.body.hashtag.push(result._id)
                    })
                });
                let _id = ObjectId(req.body._id);
                delete req.body._id;
                db.collection("stories").updateOne({ "_id": _id }, { $set: req.body }, async (err, result) => {
                    let responce;
                    if (err) {
                        responce = {
                            "errors": err
                        };
                        res.status(400).send(responce);
                    } else {
                        let data = await module.exports.feedBoardById(req, _id);
                        responce = {
                            "message": "Successfully story updated.",
                            "data": data[0]
                        };
                        res.status(200).send(responce);
                    }
                });
            } catch (err) {
                 res.status(400).send("Query unsuccessfull");
            }
        });

    },
    postAnswer: async (req, res, next) => {
        await check('answerComment')
            .exists()
            .withMessage('Answer is requried')
            .run(req);
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let questionId = req.body.id;
            delete req.body.id;
            req.body._id = new ObjectId();

            db.collection("questions").updateOne({ "_id": questionId }, { $push: { "answersComments": req.body } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                }else {
                    responce = {
                        "message": "Successfully Answered.",
                        // "insertedId": result['insertedId']
                    };
                    res.status(200).send(responce);
                }
               
            });
        });
    },
    postComment: async (req, res, next) => {
        await check('answerComment')
            .exists()
            .withMessage('Comment is requried')
            .run(req);
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let storyId = req.body.id;
            delete req.body.id
            req.body._id = new ObjectId();

            db.collection("stories").updateOne({ "_id": storyId }, { $push: { "answersComments": req.body } }, async (err, result) => {
                console.log(res);
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                }else {
                    responce = {
                        "message": "Successfully React Submitted.",
                        "insertedId": req.body._id
                    };
                    res.status(200).send(responce);
                }
              
            });
        });
    },

    updateAnswer: async (req, res, next) => {
        await check('answerComment')
            .exists()
            .withMessage('Answer is requried')
            .run(req);
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let questionId = req.body.id;
            delete req.body.id;
            req.body._id = ObjectId(req.body.answerCommentId);
            db.collection("questions").updateOne({ "_id": questionId }, { $pull: { answersComments: { _id: ObjectId(req.body.answerCommentId) } } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                } else {
                    delete req.body.answerCommentId;
                    db.collection("questions").updateOne({ "_id": questionId }, { $push: { "answersComments": req.body } }, async (err, result) => {
                        let responce;
                        if (err) {
                            responce = {
                                "errors": err
                            };
                            res.status(400).send(responce);
                        } else {
                            responce = {
                                "message": "Successfully Answered Updated.",
                                // "insertedId": result['insertedId']
                            };
                            res.status(200).send(responce);
                        }

                    });
                }

            });
        });
    },

    updateComment: async (req, res, next) => {
        await check('answerComment')
            .exists()
            .withMessage('Comment is requried')
            .run(req);
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let storyId = req.body.id;
            delete req.body.id;
            req.body._id = ObjectId(req.body.answerCommentId);

            db.collection("stories").updateOne({ "_id": storyId }, { $pull: { answersComments: { _id: ObjectId(req.body.answerCommentId) } } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                } else {
                    delete req.body.answerCommentId;
                    db.collection("stories").updateOne({ "_id": storyId }, { $push: { "answersComments": req.body } }, async (err, result) => {
                        let responce;
                        if (err) {
                            responce = {
                                "errors": err
                            };
                            res.status(400).send(responce);
                        } else {
                            responce = {
                                "message": "Successfully Stories Updated.",
                                // "insertedId": result['insertedId']
                            };
                            res.status(200).send(responce);
                        }

                    });
                }

            });
        });
    },

    deleteAnswer: async (req, res, next) => {
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let questionId = req.body.id;
            delete req.body.id;
            req.body._id = new ObjectId();

            db.collection("questions").updateOne({ "_id": questionId }, { $pull: { answersComments: { _id: ObjectId(req.body.answerCommentId) } } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                } else {
                    responce = {
                        "message": "Successfully Answer Deleted.",
                        // "insertedId": result['insertedId']
                    };
                    res.status(200).send(responce);
                }

            });
        });
    },
    deleteComment: async (req, res, next) => {
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let storyId = req.body.id;
            delete req.body.id;
            req.body._id = new ObjectId();

            db.collection("stories").updateOne({ "_id": storyId }, { $pull: { answersComments: { _id: ObjectId(req.body.answerCommentId) } } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                } else {
                    responce = {
                        "message": "Successfully Comment Deleted.",
                        // "insertedId": result['insertedId']
                    };
                    res.status(200).send(responce);
                }

            });
        });
    },
    recat: async (req, res, next) => {
        await check('type')
            .exists()
            .withMessage('Type is requried')
            .run(req);
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let _id = req.body.id;
            delete req.body.id;
            let collection;
            switch (req.params.type) {
                case 'story':
                    collection = 'stories';
                    break;
                case 'question':
                    collection = 'questions';
                    break;
            }
            db.collection(collection).updateOne({ "_id": _id }, { $push: { "reactions": req.body } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                }
                responce = {
                    "message": "Successfully Comment Posted.",
                    // "insertedId": result['insertedId']
                };
                res.status(200).send(responce);
            });
        });
    },
    removeRecat: async (req, res, next) => {
        await check('type')
            .exists()
            .withMessage('Type is requried')
            .run(req);
        await check('id')
            .exists()
            .withMessage('id is requried')
            .run(req);
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            req.body.user_id = req.user._id;
            req.body.id = ObjectId(req.body.id);
            req.body.date_time = moment().format('MM-DD-YYYY, h:mm:ss a');;
            let _id = req.body.id;
            delete req.body.id;
            let collection;
            switch (req.params.type) {
                case 'story':
                    collection = 'stories';
                    break;
                case 'question':
                    collection = 'questions';
                    break;
            }
            db.collection(collection).updateOne({ "_id": _id }, { $pull: { reactions: { "user_id": req.user._id, "type": req.body.type } } }, async (err, result) => {
                let responce;
                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                } else {
                    responce = {
                        "message": "Successfully React Removed.",
                        // "insertedId": result['insertedId']
                    };
                    res.status(200).send(responce);
                }

            });
        });
    },
}
