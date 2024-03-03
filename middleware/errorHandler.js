// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    // Send a more detailed error response
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  };
  
  export default errorHandler;
  