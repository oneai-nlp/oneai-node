import axios from 'axios';

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
export class InputError extends OneAIError {

}
/** An error raised when the API key is invalid, expired, or missing quota. */
export class APIKeyError extends OneAIError {

}
/** An error raised when the input is invalid or is of an incompatible type for the pipeline. */
export class ServerError extends OneAIError {

}

export const httpStatus: { [key: string]: typeof OneAIError } = {
  400: InputError,
  401: APIKeyError,
  403: APIKeyError,
  500: ServerError,
  503: ServerError,
};

export function handleError(error: any): any {
  return (axios.isAxiosError(error) && error.response !== undefined)
    ? new httpStatus[error.response.status.toString()](
      error.response.data?.status_code || error.response.status,
      error.response.data?.message || error.message,
      error.response.data?.details,
      error.response.data?.request_id,
    )
    : error;
}
