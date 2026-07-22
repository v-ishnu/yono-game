const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  const statusCode = err.http_code || 500;
  const message = err.message || (typeof err === "string" ? err : "Internal Server Error");

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;