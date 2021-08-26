//validation
const Joi = require("@hapi/joi")

//Register validation
const registerValidation = (data) => {
    const schema = {
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required(),
        c_password: Joi.string().min(6).required(),
        role:Joi.string().required()
    }
    //lets validate the data before create user.
    return Joi.validate(data, schema)

}

const loginValidation = (data) => {
    const schema = {
        email: Joi.string().min(6).required().email(),
        password: Joi.string().min(6).required()
    }
    //lets validate the data before create user.
    return Joi.validate(data, schema)

}
module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;