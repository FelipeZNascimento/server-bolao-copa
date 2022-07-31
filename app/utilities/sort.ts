const dynamicSort = (property: string) => {
  let sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a: any, b: any) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    const result = a[property].toString().localeCompare(b[property]);
    return result * sortOrder;
  };
};

const numberSort = (property: string) => {
  return function (a: any, b: any) {
    return b[property] - a[property];
  };
};

export const sort = {
  dynamic: dynamicSort,
  number: numberSort,
};
