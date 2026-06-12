const tFunctionRegExp: string = `(?<=(?<![A-Za-z0-9])t\\(['"])([^'"]+)(?=['"])`;
const transComponentRegExp: string = `(?<=i18nKey=(?:\\{?['"]))([^'"]+)(?=['"]\\}?)`;

export const reactI18Next: string[] = [
    tFunctionRegExp,
    transComponentRegExp
];