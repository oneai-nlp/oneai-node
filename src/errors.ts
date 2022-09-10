export class OneAIError extends Error {
  type: string;

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

    this.type = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;

    Object.setPrototypeOf(this, OneAIError.prototype);
  }

  toJSON = () => ({
    statusCode: this.statusCode, details: this.details, requestId: this.requestId,
  });
}

/** An error raised when the input is invalid or is of an incompatible type for the pipeline. */
export class InputError extends OneAIError {}

/** An error raised when the API key is invalid, expired, or missing quota. */
export class APIKeyError extends OneAIError {}

/** An error raised when the input is invalid or is of an incompatible type for the pipeline. */
export class ServerError extends OneAIError {}

export const httpStatusErrorType: { [key: string]: typeof OneAIError } = {
  400: InputError,
  401: APIKeyError,
  403: APIKeyError,
  500: ServerError,
  503: ServerError,
};
