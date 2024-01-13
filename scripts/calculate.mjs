import { Octokit } from "@octokit/rest";

/*
 * Voting Weight Calculations for the Developer stakeholder class
 * A decision was made that there should be a tiered vote weight for contributors based on where they have contributed code. The tier works as follows:
 *  - A vote count of 2 for anyone who has contributed at least two merged commits to a repo housed in the Filecoin project workspace in the last 6 months.
 *  - A vote count of 1 for anyone who has contributed at least two merged commits to a repo/project space that is white listed as a critical project by the Filecoin Foundation.
 */

// TODO this is a placeholder list only. The real list is still TBD.
const CRITICAL_PROJECTS = [
  "libp2p/go-libp2p",
  "libp2p/rust-libp2p",
  "libp2p/js-libp2p",
];
const CORE_FILECOIN_ORG = "filecoin-project";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function getAllRepoNames(ok, org) {
  const repos = await ok.paginate("GET /orgs/{org}/repos", {
    org,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return repos.map((r) => r.full_name);
}

async function getCommitsLast6M(ok, fullRepoName) {
  const [owner, repo] = fullRepoName.split("/");
  return await ok.paginate("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

function getComitterHandle(commit) {}

function getDeveloperWeightsByRepo(ok, fullRepoName, weight) {
  const commits = getCommitsLast6M(ok, fullRepoName);
  return commits.reduce(
    weights,
    (commit) => (weights[getComitterHandle(commit)] = weight),
    {}
  );
}

function addMerge(obj1, obj2) {
  let result = {};

  for (let key in obj1) {
    if (key in obj2) {
      result[key] = obj1[key] + obj2[key];
    } else {
      result[key] = obj1[key];
    }
  }

  for (let key in obj2) {
    if (!(key in obj1)) {
      result[key] = obj2[key];
    }
  }

  return result;
}

function getDeveloperWeights(ok, fullRepoNames, weight) {
  const weights = fullRepoNames.map((r) =>
    getDeveloperWeightsByRepo(ok, r, weight)
  );
  return weights
    .reduce(addMerge, {})
    .entries()
    .sort((e1, e2) => e2[1] - e1[1]);
}

const ok = new Octokit({ auth: GITHUB_TOKEN });

try {
  console.log("Weights from core Filecoin org:");
  console.log(getDeveloperWeights(ok, getAllRepoNames(CORE_FILECOIN_ORG), 2));
  console.log("Weights from ecosystem projects:");
  console.log(getDeveloperWeights(ok, CRITICAL_PROJECTS, 1));
} catch (e) {
  console.log(e);
}
