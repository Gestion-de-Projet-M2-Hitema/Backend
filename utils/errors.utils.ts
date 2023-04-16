export const buildJoiError = (joiError: Array<Record<string, any>>) => {
  const errors: Record<string, any> = {};

  for (const error of joiError) {
    const path: string | number = error.path[0];
    const message: string = error.message
      .replace('"' + path.toString() + '"', "")
      .trim();

    errors[path] = message;
  }

  return errors;
};

export interface MyError extends Error {
  event: string | undefined;
}

export const buildSocketError = (name: string, event: string) => {
  const error = <MyError>new Error();

  error.name = name;
  error.event = event;

  return error;
};
