/**
 * Validates and parses a user ID from various sources
 * @param id - The ID to validate (can be string, number, or undefined)
 * @returns An object containing the parsed ID and any error information
 */
export function validateUserId(id: string | number | undefined): { 
  id?: number; 
  error?: { 
    status: number; 
    message: string; 
    details: Record<string, any> 
  } 
} {
  if (id === undefined) {
    return {
      error: {
        status: 400,
        message: 'User ID is required',
        details: { received: id, expected: 'non-empty string or number' }
      }
    };
  }

  const parsedId = Number(id);
  
  if (isNaN(parsedId) || parsedId <= 0) {
    return {
      error: {
        status: 400,
        message: 'Invalid user ID',
        details: { 
          received: id, 
          type: typeof id,
          expected: 'positive number',
          parsedValue: parsedId
        }
      }
    };
  }

  return { id: parsedId };
}

/**
 * Middleware to validate user ID parameter
 */
export const validateUserIdParam = (req: any, res: any, next: any) => {
  const { id } = req.params;
  const { id: userId, error } = validateUserId(id);
  
  if (error) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
      details: error.details
    });
  }
  
  // Attach the validated user ID to the request
  req.validatedUserId = userId;
  next();
};
