const express = require("express");

const router = express.Router();

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require("../controllers/taskController");

// GET and POST
router.route("/")
    .get(getTasks)
    .post(createTask);

// PUT and DELETE
router.route("/:id")
    .put(updateTask)
    .delete(deleteTask);

module.exports = router;