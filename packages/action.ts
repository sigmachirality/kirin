import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as io from '@actions/io';
import * as util from '@actions/io/lib/io-util'

const DEFAULT_DEPLOY_BRANCH = 'main' as const;
const PackageManagers = {
  npm: 'npm',
  yarn: 'yarn',
} as const;

const Errors = {
  NO_ACCESS_TOKEN: 'Cannot publish without access token. Please provide one by setting the `access-token` input, or display publishing by setting `skip-publish` to true.',
  NO_PACKAGE_MANAGER: 'Could not resolve package manager. Please set the `package-manager` input or provide a supported lock file.'
} as const;

async function getPackageManager(baseDirectory: string): Promise<string | null> {
  const configPackageManager = core.getInput('package-manager')
  if (configPackageManager) return configPackageManager
  if (await util.exists(`${baseDirectory}/yarn.lock`)) return PackageManagers.yarn;
  if (await util.exists(`${baseDirectory}/package-lock.json`)) return PackageManagers.npm;
  return null;
}

async function main(): Promise<void> {
  try {
    const skipPublish = core.getBooleanInput('skip-publish');
    const ghAccessToken = core.getInput('access-token');
    const workingDirectory = core.getInput('working-dir') || '.';
    const buildDirectory = core.getInput('build-dir') || 'public';

    // Check if we have an access token and are not skipping publishing.
    if (!skipPublish && ghAccessToken) {
      core.setFailed(Errors.NO_ACCESS_TOKEN);
      return;
    }

    // Get the current branch and repo. Skip publishing if we are on the deploy branch.
    const { context: ghContext } = github;
    const deployBranch = core.getInput('deploy-branch') || DEFAULT_DEPLOY_BRANCH;
    const sourceBranch = ghContext.ref.match(/refs\/heads\/(.*)/)?.[0];
    const configRepo = core.getInput('deploy-repo');
    if ((!configRepo || configRepo === ghContext.repo.repo) && sourceBranch === deployBranch) {
      console.log(`Triggered by branch used to deploy: ${ghContext.ref}.`);
      console.log('Nothing to deploy.');
      return;
    }
    const ghRepo = configRepo || ghContext.repo.repo;

    // Checkout the deploy branch of the target repo.
    const ghRepoString = `${ghContext.repo.owner}/${ghRepo}`
    const ghUrl = `https://${ghAccessToken}@github.com/${ghRepoString}.git`
    await exec.exec(`git clone`, [ghUrl, `${workingDirectory}/target`], { cwd: `${workingDirectory}/deploy` });

    // Install site dependencies.
    const packageManager = await getPackageManager(workingDirectory);
    if (!packageManager) {
      core.setFailed(Errors.NO_PACKAGE_MANAGER);
      return;
    }
    console.log(`Installing your site's dependencies using ${packageManager}.`);
    await exec.exec(`${packageManager} install`, [], {cwd: workingDirectory});
    console.log('Finished installing dependencies.')

    // Build the static site.
    const buildArgs = core.getInput('build-args').split(/\s+/).filter(Boolean);
    console.log('Ready to build your Gatsby site!');
    console.log(`Building with: ${packageManager} run build ${buildArgs.join(' ')}`);
    await exec.exec(`${packageManager} run build`, buildArgs, {cwd: workingDirectory});
    console.log('Finished building your site.');

    if (skipPublish) {
      console.log('Building completed successfully - skipping publish');
      return;
    }

    // Delete the old build for the branch, if it exists.
    await io.rmRF(`${workingDirectory}/target/${sourceBranch}`);
    console.log('Ready to deploy your new shiny site!')
    console.log(`Deploying to repo: ${ghRepoString} and branch: ${deployBranch}`)
    console.log('You can configure the deploy branch by setting the `deploy-branch` input for this action.')
    await io.mv(`${workingDirectory}/${buildDirectory}`, `${workingDirectory}/target/${sourceBranch}`);


    // Push repo updates to master
    const ghUser = core.getInput('git-config-name') || ghContext.actor;
    const ghEmail = core.getInput('git-config-email') || `${ghContext.actor}@users.noreply.github.com`;
    const commitMessage = core.getInput('commit-message') || `deployed via Kirin 🦒 for commit ${ghContext.sha} on ${sourceBranch}`;
    await exec.exec(`git config user.name`, [ghUser], { cwd: `${workingDirectory}/target` });
    await exec.exec(`git config user.email`, [ghEmail], { cwd: `${workingDirectory}/target` });
    await exec.exec(`git add .`, [], {cwd: `${workingDirectory}/target/${sourceBranch}`});
    await exec.exec(`git commit`, ['-m', commitMessage], { cwd: `${workingDirectory}/target`});
    await exec.exec(`git push`, ['-f', ghUrl, `master:${deployBranch}`], { cwd: `${workingDirectory}/target` });
    console.log('Finished deploying your site.');
    console.log('Enjoy! ✨');
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (process.env.NODE_ENV !== 'test' && process.env.GITHUB_SHA) {
  main();
}

export default main;
