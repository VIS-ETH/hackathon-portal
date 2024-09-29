const local_from_string = (str: string) => {
  let utc = new Date(str);
  let local = new Date(utc.getTime() - utc.getTimezoneOffset() * 60000);
  return local;
};

const local_from_date = (date: Date) => {
  let utc = new Date(date);
  let local = new Date(date.getTime() - utc.getTimezoneOffset() * 60000);
  return local;
};

export { local_from_string, local_from_date };
