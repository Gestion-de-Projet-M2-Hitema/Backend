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
