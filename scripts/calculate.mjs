import { Octokit } from "@octokit/core";
import { paginateGraphql } from "@octokit/plugin-paginate-graphql";

/*
 * Voting Weight Calculations for the Developer stakeholder class
 * A decision was made that there should be a tiered vote weight for contributors based on where they have contributed code. The tier works as follows:
 *  - A vote count of 2 for anyone who has contributed at least two merged commits to a repo housed in the Filecoin project workspace in the last 6 months (CORE_FILECOIN_REPOS).
 *  - A vote count of 1 for anyone who has contributed at least two merged commits to a repo/project space that is white listed as a critical project by the Filecoin Foundation (ECOSYSTEM_REPOS).
 */

/* Notes / ambiguites encountered while implementing the count
 * - we should define the time frame in number of days rather than number of months to avoid ambiguaity around the different number of days in each month
 * - we should clarify if both committers and authors count as contributors (see note below -- currently counting both as contributors)
 * - we should specify that only public repos qualify (i.e. exclude private repos in filecoin-project, and only allow ecosystem repos that are public)
 * - we should clarify whether this is changes on all branches in the last 6 months, or only the default branch (currently using only default branch)
 * - Does the 6 month cutoff apply to both ECOSYSTEM REPO and CORE FILECOIN REPOS?
 * - Sometimes a committer or author has an associated email address, but not a
 *   github account. This is usally because that user doesn't have that email
 *   associated with their github account. For now, I am ignoring these folks
 *   since there is no github login to associate them with.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PaginatedOctokit = Octokit.plugin(paginateGraphql);
const OK = new PaginatedOctokit({ auth: GITHUB_TOKEN });

// TODO this is a placeholder list only. The real list is still TBD.
const ECOSYSTEM_REPOS = [
  "libp2p/go-libp2p",
  "libp2p/rust-libp2p",
  "libp2p/js-libp2p",
];
const CORE_FILECOIN_ORG = "filecoin-project";
const CORE_FILECOIN_REPOS = await getAllRepoNames(OK, CORE_FILECOIN_ORG);
const CUTOFF = addMonths(new Date(), -6).toISOString(); // 6 Months ago

// Calculate and Print Weights

try {
  console.log("Weights from ecosystem projects:");
  console.log(await getDeveloperWeights(OK, ECOSYSTEM_REPOS, 1, CUTOFF));
  console.log("Weights from core Filecoin org:");
  console.log(await getDeveloperWeights(OK, CORE_FILECOIN_REPOS, 2, CUTOFF));
} catch (e) {
  console.log(e);
}

// Functions
async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
async function getAllRepoNames(ok, org) {
  const resp = await ok.graphql.paginate(
    `query paginatedRepos($cursor: String) {
      repositoryOwner(login: "${org}") {
        ... on Organization {
          repositories(first: 100, after: $cursor) {
            totalCount
            pageInfo {
              endCursor
              hasNextPage
            }
            nodes {
              name
            }
          }
        }
      }
    }`
  );
  sleep(1000);
  return resp.repositoryOwner.repositories.nodes.map((n) => `${org}/${n.name}`);
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function addMonths(input, months) {
  const date = new Date(input);
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  date.setDate(
    Math.min(
      input.getDate(),
      getDaysInMonth(date.getFullYear(), date.getMonth() + 1)
    )
  );
  return date;
}

async function getContributers(ok, fullRepoName, cutoff) {
  const [owner, name] = fullRepoName.split("/");
  const resp = await ok.graphql.paginate(
    `query paginatedCommits($cursor: String) {
      repository(owner: "${owner}", name: "${name}") {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first:100, since: "${cutoff}", after: $cursor) {
                totalCount
                pageInfo {
                  endCursor
                  hasNextPage
                }
                nodes {
                  ... on Commit {
                      committedDate
                      author {
                        user {
                          login
                        }
                      }
                      committer {
                        user {
                          login
                        }
                      }
                  }
                }
              }
            }
          }
        }
      }
    }`
  );
  sleep(1000);

  // NOTE: git / github support both an Author and a Committer field. The Author
  // is designated as the person who wrote the code, while the Committer is the
  // person who committed the change to the repo. They are often the same person,
  // but in some cases (like when rebasing or applying patches) they can differ.
  // For this code sample, I am defining both Authors and Committers as
  // Contributors so that both get the appropriate weight / credit. We may want
  // to revise this decision. - ID 01/12/24
  const commits = resp.repository.defaultBranchRef.target.history.nodes;
  const contributors = new Set();
  for (const c of commits) {
    c.author.user && contributors.add(c.author.user.login);
    c.committer.user && contributors.add(c.committer.user.login);
  }
  return Array.from(contributors);
}

async function getDeveloperWeightsByRepo(ok, fullRepoName, weight, cutoff) {
  const contributors = await getContributers(ok, fullRepoName, cutoff);
  return contributors.reduce((weights, contributor) => {
    weights[contributor] = weight;
    return weights;
  }, {});
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

async function getDeveloperWeights(ok, fullRepoNames, weight, cutoff) {
  const weights = await Promise.all(
    fullRepoNames.map((r) => getDeveloperWeightsByRepo(ok, r, weight, cutoff))
  );
  const totalWeights = weights.reduce(addMerge, {});
  return Object.entries(totalWeights).sort((e1, e2) => e2[1] - e1[1]);
}
