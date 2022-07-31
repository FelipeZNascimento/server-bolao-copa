const User = require('../model/user.ts');

exports.default = async (req: any, res: any) => {
  try {
    const configData = {
      loggedUser: req.session.user
    };

    res.send(configData);
  } catch (error: unknown) {
    let result;
    if (typeof error === 'string') {
      result = error.toUpperCase(); // works, `e` narrowed to string
    } else if (error instanceof Error) {
      result = error.message; // works, `e` narrowed to Error
    }

    console.log(result);
    res.status(400).send(result);
  }
};
