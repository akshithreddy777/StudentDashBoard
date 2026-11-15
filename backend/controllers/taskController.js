const Task = require("../models/Task");

// CREATE TASK
const createTask = async (req, res, next) => {
    try {

        const { title, priority, dueDate } = req.body;

        const task = await Task.create({
            title,
            priority,
            dueDate
        });

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task
        });

    } catch (error) {
        next(error);
    }
};

// GET ALL TASKS
const getTasks = async (req, res, next) => {
    try {

        const tasks = await Task.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        next(error);
    }
};

// UPDATE TASK
const updateTask = async (req, res, next) => {
    try {

        const { id } = req.params;

        const { title, priority, dueDate, completed } = req.body;

        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (priority !== undefined) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate;

        if (completed !== undefined) {
            updateData.completed = completed;

            updateData.completedAt = completed
                ? new Date().toISOString().slice(0, 10)
                : null;
        }

        const task = await Task.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        next(error);
    }
};

// DELETE TASK
const deleteTask = async (req, res, next) => {
    try {

        const { id } = req.params;

        const task = await Task.findByIdAndDelete(id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};
module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};