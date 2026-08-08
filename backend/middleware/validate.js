/**
 * Zod validation middleware factory.
 * Usage: router.post('/route', validate(schema), handler)
 *
 * Validates req.body against the Zod schema.
 * Returns a consistent error shape on failure.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success:   false,
      message:   'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors,
    });
  }
  req.body = result.data; // replace with parsed (coerced) data
  next();
};

module.exports = validate;
