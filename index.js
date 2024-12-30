const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, Model, DataTypes, Op } = require("sequelize");
const cors = require("cors");
const Joi = require("joi");
const app = express();
const port = 8000;

app.use(cors({ credentials: true, origin: "*" }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

// Define User model
class User extends Model {}
User.init(
  {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    gender: DataTypes.ENUM("MALE", "FEMALE"),
    departement: DataTypes.ENUM("IT", "HSE", "HRGA", "PRODUKSI", "PLAN"),
    image: DataTypes.STRING,
  },
  { sequelize, modelName: "user" }
);
sequelize.sync();

const userSchema = Joi.object({
  name: Joi.string().min(3).max(35).required(),
  email: Joi.string().email().required(),
  gender: Joi.string()
    .valid("MALE", "FEMALE")
    .required()
    .messages({
      "any.only": "must be one of [MALE, FEMALE]",
    })
    .required(),
  departement: Joi.string()
    .valid("IT", "HSE", "HRGA", "PRODUKSI", "PLAN")
    .required()
    .messages({
      "any.only": "must be one of [IT, HSE, HRGA, PRODUKSI, PLAN]",
    })
    .required(),
  image: Joi.string().required(),
});

app.get("/", async (req, res) => {
  res.send("Express API - Technical test");
});

app.get("/users", async (req, res) => {
  const { name } = req.query;
  const users = await User.findAll({
    where: {
      name: {
        [Op.like]: `%${name ?? ""}%`, // Find usernames containing 'john'
      },
    },
  });
  res.json({
    success: true,
    message: "get data successfull",
    data: users,
  });
});

app.get("/users/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  res.json({
    success: true,
    message: "get data by id successfull",
    data: user,
  });
});

app.post("/users", async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body);

    if (error) {
      return res.status(422).json({ error: error.details[0].message });
    }

    const newUser = await User.create(req.body);
    res.status(201).json({
      success: true,
      message: "Store data successfull",
      data: newUser,
    });
  } catch (error) {
    // Handle specific Sequelize errors
    return res.status(400).json({
      error: "Error",
      details: error.errors ?? error.message,
    });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      const { error, value } = userSchema.validate(req.body);
      if (error) {
        return res.status(422).json({ error: error.details[0].message });
      }
      const newUser = await user.update(req.body);
      res.status(201).json({
        success: true,
        message: "Update data successfull",
        data: newUser,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    // Handle specific Sequelize errors
    return res.status(400).json({
      error: "Error",
      details: error.errors ?? error.message,
    });
  }
});

app.delete("/users/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (user) {
    await user.destroy();
    res.json({ success: true, message: "User deleted" });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Start server
app.listen(process.env.PORT || 8000, () => {
  console.log(`Server listening on port ${port}`);
});
