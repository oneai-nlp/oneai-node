/* istanbul ignore file */
export class OneAIError extends Error {
  statusCode: number;

  details?: string;

  requestId?: string;

  constructor(
    statusCode: number,
    message: string,
    details?: string,
    requestId?: string,
  ) {
    super(message);

    Object.setPrototypeOf(this, OneAIError.prototype);

    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }

  toJSON = () => ({
    statusCode: this.statusCode, details: this.details, requestId: this.requestId,
  });
}

/** An error raised when the input is invalid or is of an incompatible type for the pipeline. */
export class InputError extends OneAIError {
  constructor(
    statusCode: number,
    message: string,
    details?: string,
    requestId?: string,
  ) {
    super(statusCode, message, details, requestId);
    Object.setPrototypeOf(this, InputError.prototype);
  }
}

/** An error raised when the API key is invalid, expired, or missing quota. */
export class APIKeyError extends OneAIError {
  constructor(
    statusCode: number,
    message: string,
    details?: string,
    requestId?: string,
  ) {
    super(statusCode, message, details, requestId);
    Object.setPrototypeOf(this, APIKeyError.prototype);
  }
}

/** An error raised when something went wrong on One AI servers. */
export class ServerError extends OneAIError {
  constructor(
    statusCode: number,
    message: string,
    details?: string,
    requestId?: string,
  ) {
    super(statusCode, message, details, requestId);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export const httpStatusErrorType: { [key: string]: typeof OneAIError } = {
  400: InputError,
  401: APIKeyError,
  403: APIKeyError,
  500: ServerError,
  503: ServerError,
};
