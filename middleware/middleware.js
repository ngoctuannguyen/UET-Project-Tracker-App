const { body, param, validationResult } = require('express-validator');

class Middleware {
    // Middleware để kiểm tra lỗi validate
    static validateRequest(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }

    // Validate khi tạo Project
    static validateCreateProject() {
        return [
            body('project_name').notEmpty().withMessage('Project name is required'),
            body('project_info').notEmpty().withMessage('Project info is required'),
            body('manager_id').notEmpty().withMessage('Manager ID is required'),
            Middleware.validateRequest
        ];
    }

    // Validate ID params
    static validateProjectIdParam() {
        return [
            param('id').notEmpty().withMessage('Project ID is required'),
            Middleware.validateRequest
        ];
    }

    // Validate Update Project
    static validateUpdateProject() {
        return [
            param('id').notEmpty().withMessage('Project ID is required'),
            body().notEmpty().withMessage('Update data cannot be empty'),
            Middleware.validateRequest
        ];
    }

    // Validate Update Project Progress
    static validateUpdateProgress() {
        return [
            param('id').notEmpty().withMessage('Project ID is required'),
            body('status').notEmpty().withMessage('Status is required'),
            body('work_description').optional(),
            body('deadline').optional(),
            Middleware.validateRequest
        ];
    }

    // Validate Add Employee
    static validateAddEmployee() {
        return [
            param('id').notEmpty().withMessage('Project ID is required'),
            body('employee_id').notEmpty().withMessage('Employee ID is required'),
            Middleware.validateRequest
        ];
    }

    // Validate Remove Employee
    static validateRemoveEmployee() {
        return [
            param('id').notEmpty().withMessage('Project ID is required'),
            body('employee_id').notEmpty().withMessage('Employee ID is required'),
            Middleware.validateRequest
        ];
    }

    // Validate Change Manager
    static validateChangeManager() {
        return [
            param('id').notEmpty().withMessage('Project ID is required'),
            body('manager_id').notEmpty().withMessage('Manager ID is required'),
            Middleware.validateRequest
        ];
    }

    // Validate các param khác như managerId, employeeId, status, deadline
    static validateManagerIdParam() {
        return [
            param('managerId').notEmpty().withMessage('Manager ID is required'),
            Middleware.validateRequest
        ];
    }

    static validateEmployeeIdParam() {
        return [
            param('employeeId').notEmpty().withMessage('Employee ID is required'),
            Middleware.validateRequest
        ];
    }

    static validateStatusParam() {
        return [
            param('status').notEmpty().withMessage('Status is required'),
            Middleware.validateRequest
        ];
    }

    static validateDeadlineParam() {
        return [
            param('deadline').notEmpty().withMessage('Deadline is required'),
            Middleware.validateRequest
        ];
    }
}

module.exports = Middleware;
