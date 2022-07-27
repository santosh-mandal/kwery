const db = require('../db');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var ObjectId = require('mongodb').ObjectId;
const axios = require('axios').default;
const { check, oneOf, validationResult } = require('express-validator');

module.exports = {
    signup: async (req, res, next) => {
        await check('email')
            .isEmail()
            .withMessage('must be an valid email')
            .custom((value, { req }) => {
                return module.exports.findUserByEmail(value).then(user => {
                    if (user) {
                        return Promise.reject('email already in use');
                    }
                });
            })
            .run(req)
        await check('mobile')
            .isLength({ min: 10, max: 10 })
            .withMessage('must be 10 chars long')
            .custom((value, { req }) => {
                return module.exports.findUserByMobile(value).then(user => {
                    if (user) {
                        return Promise.reject('Mobile number already in use');
                    }
                });
            })
            .run(req);
        await check('password')
            .isLength({ min: 6 })
            .withMessage('must be at least 6 chars long')
            .run(req);

        // await check('passwordConfirmation')
        //     .exists()
        //     .isLength({ min: 6 })
        //     .withMessage('must be at least 6 chars long')
        //     .custom((value, { req }) => {
        //         if (value !== req.body.password) {
        //             throw new Error('Password confirmation does not match password');
        //         }
        //         return true;
        //     })
        //     .run(req)
        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }

        db().then(async (db) => {
            req.body.password = await bcrypt.hash(req.body.password, 10);
            req.body.email = req.body.email.toLowerCase();
            //   delete req.body.passwordConfirmation;  // or delete req.body.passwordConfirmatio;
            if (!req.body.image) {
                if (req.body.sex == 'female') {
                    req.body.image = `${req.protocol}://${req.headers.host}/img/female-avatar.svg`;
                } else {
                    req.body.image = `${req.protocol}://${req.headers.host}/img/male-avatar.svg`;
                }
            }

            console.log(req.body);
            db.collection("users").insertOne(req.body, async (err, result) => {
                console.log(result);
                let responce;
                const user = req.body;
                user.user_id = ObjectId(result['insertedId']);
                delete user.password;
                const token = jwt.sign(user,
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "2h",
                    }
                );
                // save user token
                user.token = token;

                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                } else {
                    responce = {
                        "message": "Successfully account created",
                        "user": user
                    };
                    res.status(200).send(responce);
                }
               
            });
        }).catch((error) => {
            let data = {
                "message": error,
            };
            res.status(400).send(data);
        });
    },
    login: async (req, res, next) => {
        req.body.email = req.body.user_name;
        req.body.mobile = req.body.user_name;
        await oneOf([
            await check('email')
                .exists()
                .withMessage('you must provide email')
                .isEmail()
                .withMessage('must be an valid email'),
            await check('mobile')
                .exists()
                .withMessage('mobile is required')
                .isLength({ min: 10, max: 10 })
                .withMessage('must be 10 chars long'),
        ], 'you must provide email or mobile number').run(req)

        await check('password').isLength({ min: 6 }).withMessage('must be at least 6 chars long').run(req);

        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }

        const query = {
            $or: [{ email: req.body.user_name }, { mobile: req.body.user_name }]
        };
        // const options = {
        //     projection: { password: 0 },
        // };
        const options = {};
        db().then((db) => {
            db.collection("users").findOne(query, options, async (err, result) => {
                if (result && (await bcrypt.compare(req.body.password, result.password))) {
                    let responce;
                    delete result.password;

                    if (!result['image']) {
                        if (result['sex'] == 'female') {
                            result['image'] = `${req.protocol}://${req.headers.host}/img/female-avatar.svg`;
                        } else {
                            result['image'] = `${req.protocol}://${req.headers.host}/img/male-avatar.svg`;
                        }
                    }

                    const token = jwt.sign(result,
                        process.env.JWT_SECRET,
                        {
                            expiresIn: "2h",
                        }
                    );
                    result.token = token;
                    if (err) {
                        responce = {
                            "errors": err
                        };
                        res.status(400).send(responce);
                    } else {
                        responce = {
                            "message": "Successfully logged in",
                            "user": result
                        };
    
                        res.status(200).send(responce);
                    }
                  
                } else {
                    let data = {
                        "errors": "wrong password",
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
    findUserByEmail: (value) => {
        return new Promise((resolve, reject) => {
            db().then((db) => {
                db.collection("users").findOne({ email: value }, async (err, result) => {
                    if (err) {
                        let responce = {
                            errors: err
                        }
                        result = responce
                    }


                    resolve(result);
                });
            }).catch((error) => {
                responce = {
                    "errors": error,
                };
                res.status(400).send(responce);
            });
        });
    },
    findUserByMobile: (value) => {
        return new Promise((resolve, reject) => {
            db().then((db) => {
                db.collection("users").findOne({ mobile: value }, async (err, result) => {
                    if (err) {
                        result = {
                            "errors": err
                        };
                    }

                    resolve(result);
                });
            }).catch((error) => {
                responce = {
                    "errors": error,
                };
                res.status(400).send(responce);
            });
        });
    },
    forgotPasswordSendOtp: async (req, res, next) => {

        req.body.email = req.body.user_name;
        req.body.mobile = req.body.user_name;
        await oneOf([
            await check('email')
                .exists()
                .withMessage('email is required')
                .isEmail()
                .withMessage('must be an valid email')
                .custom((value, { req }) => {
                    return module.exports.findUserByEmail(value).then(user => {
                        if (!user) {
                            return Promise.reject('email is not register with us');
                        }
                    });
                }),
            await check('mobile')
                .exists()
                .withMessage('mobile is required')
                .isLength({ min: 10, max: 10 })
                .withMessage('must be 10 chars long')
                .custom((value, { req }) => {
                    return module.exports.findUserByMobile(value).then(user => {
                        if (!user) {
                            return Promise.reject('Mobile number is not register with us');
                        }
                    });
                })
        ], 'you must provide email or mobile number').run(req)


        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }

        let otp = Math.floor(1000 + Math.random() * 9000);

        let data = {
            "sender": {
                "name": "AskAny Admin",
                "email": "santosh.mandal91@gmail.com"
            },
            "to": [
                {
                    "email": "santosh.mandal91@gmail.com",
                }
            ],
            "subject": "[AskAny] Password Reset",
            "htmlContent": `
                    <html>
                        <head></head>
                        <body>
                            <p>Hi,</p>
                            <p>Your password rest OTP is <h1>${otp}</h1></p>
                            <p>Thanks</p>
                            <p>AskAny Admin</p>
                        </body>
                    </html>`
        };

        let headers = {
            'accept': `application/json`,
            'api-key': `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`,
            'content-type': `application/json`,
        }
        axios.post('https://api.sendinblue.com/v3/smtp/email', data, { headers })
            .then(function (response) {
                if (response.data.messageId) {
                    db().then(async (db) => {
                        db.collection("otps").deleteOne({ email: req.body.email });
                        db.collection("otps").insertOne({
                            email: req.body.email,
                            otp: otp
                        }, async (err, result) => {
                            let responce;
                            if (err) {
                                responce = {
                                    "errors": err
                                };
                                res.status(400).send(responce);
                            }

                        });
                    });
                }
            })
            .catch(function (error) {
                res.status(400).send(error);
            });

        let list = {
            "message": "OTP has been send succesfully ",
        };
        res.status(200).send(list);
    },
    forgotPasswordValidateOtp: async (req, res, next) => {
        req.body.email = req.body.user_name;
        req.body.mobile = req.body.user_name;
        await oneOf([
            await check('email')
                .exists()
                .withMessage('email is required')
                .isEmail()
                .withMessage('must be an valid email')
                .custom((value, { req }) => {
                    return module.exports.findUserByEmail(value).then(user => {
                        if (!user) {
                            return Promise.reject('email is not register with us');
                        }
                    });
                }),
            await check('mobile')
                .exists()
                .withMessage('mobile is required')
                .isLength({ min: 10, max: 10 })
                .withMessage('must be 10 chars long')
                .custom((value, { req }) => {
                    return module.exports.findUserByMobile(value).then(user => {
                        if (!user) {
                            return Promise.reject('Mobile number is not register with us');
                        }
                    });
                })
        ], 'you must provide email or mobile number').run(req)


        const validate = validationResult(req);
        if (!validate.isEmpty()) {
            return res.status(400).json({ errors: validate.array() });
        }
        db().then(async (db) => {
            const query = { email: req.body.email };
            const options = {};
            db.collection("otps").findOne(query, options, async (err, result) => {
                if (req.body.otp == result.otp) {
                    let data = {
                        "message": "OTP has been verified successfully",
                    };
                    res.status(200).send(data);
                } else {
                    let data = {
                        "message": "OTP dones not matched",
                    };
                    res.status(400).send(data);
                }
            });
        });


    },
    forgotPasswordResetPassword: async (req, res, next) => {
        req.body.email = req.body.user_name;
        req.body.mobile = req.body.user_name;
        await oneOf([
            await check('email')
                .exists()
                .withMessage('email is required')
                .isEmail()
                .withMessage('must be an valid email')
                .custom((value, { req }) => {
                    return module.exports.findUserByEmail(value).then(user => {
                        if (!user) {
                            return Promise.reject('email is not register with us');
                        }
                    });
                }),
            await check('mobile')
                .exists()
                .withMessage('mobile is required')
                .isLength({ min: 10, max: 10 })
                .withMessage('must be 10 chars long')
                .custom((value, { req }) => {
                    return module.exports.findUserByMobile(value).then(user => {
                        if (!user) {
                            return Promise.reject('Mobile number is not register with us');
                        }
                    });
                })
        ], 'you must provide email or mobile number').run(req)

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

        req.body.password = await bcrypt.hash(req.body.password, 10);
        db().then((db) => {
            db.collection("users").updateOne({ $or: [{ email: req.body.email }, { mobile: req.body.mobile }] }, { $set: { password: req.body.password } }, async (err, result) => {
                let responce;

                if (err) {
                    responce = {
                        "errors": err
                    };
                    res.status(400).send(responce);
                }else {
                    responce = {
                        "message": "Successfully password updated",
                    };
    
                    res.status(200).send(responce);
                }
               
            });
        }).catch((error) => {
            responce = {
                "errors": error,
            };
            res.status(400).send(responce);
        });

    },
}