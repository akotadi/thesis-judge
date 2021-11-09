import * as got from 'got';

const validateProblem = async (url: string): Promise<boolean> => {
  try {
    const response = await got.get(url);
    const responseURL = response.url;
    const status = response.statusCode;
    return responseURL === url && status >= 200 && status <= 299;
  } catch (error) {
    console.error(`[ProblemValidation Error]: Message: ${error}`);
    console.error(error);
    throw error;
  }
};

export default validateProblem;
