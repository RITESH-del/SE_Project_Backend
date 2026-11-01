const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error) {
    if (error.issues) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    next(error);
  }
};

export { validate };
export default validate;
