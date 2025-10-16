const errorHandler = (err, req, res, next) => {
    // Determine the correct status code. If an error status was already set (e.g., 400, 404), use it. 
    // Otherwise, default to 500 (Server Error).
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode);

    // Send a structured JSON response
    res.json({
        message: err.message,
        // Only include the stack trace if the application is NOT in production mode
        // This prevents leaking internal server details to the client.
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
