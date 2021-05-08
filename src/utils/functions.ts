const deserialize = (data: any): any => {
  try {
    return JSON.parse(data);
  } catch (err) {
    return data;
  }
};

const serialize = (data: any): string =>
  typeof data === 'string' ? data : JSON.stringify(data);

export { deserialize, serialize };
