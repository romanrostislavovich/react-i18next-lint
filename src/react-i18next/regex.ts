const mainRegExp: string = "(?<=(?<![A-Za-z0-9])t\\(['\"])([A-Za-z0-9_\\-. ]+)(?=['\"]|\\))";

export const reactI18Next: string[] = [
    mainRegExp
];
