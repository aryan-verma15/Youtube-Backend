class ApiError extends Error {
    constructor(
        statusCode,
        message = 'Something went wrong',
        errors = [],
        stack = '',
    ) {
        super(message); // calls the parent Error constructor with the message
        this.statusCode = statusCode; // e.g. 400, 404, 500
        this.data = null; // errors typically don't return useful data
        this.message = message; // // user-defined or default message
        this.success = false; // always false for errors
        this.errors = errors; // detailed error array or object

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
