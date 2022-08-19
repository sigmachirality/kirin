export const getKirinBasePath = (): string | null => {
  let ref; if (ref = process.env.GITHUB_REF) {
    const sourceBranch = ref.match(/refs\/heads\/(.*)/)?.[0];
    const basePath = process.env.INPUT_BASE_PATH || '.';
    return `${basePath}/${sourceBranch}`;
  }
  return '.';
}
