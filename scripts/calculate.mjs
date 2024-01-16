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
// const CORE_FILECOIN_REPOS = await getAllRepoNames(OK, CORE_FILECOIN_ORG);
// cached copy of recent liste - ID 01/16/24
const CORE_FILECOIN_REPOS = [
  "filecoin-project/go-hamt-ipld",
  "filecoin-project/venus",
  "filecoin-project/assets",
  "filecoin-project/consensus",
  "filecoin-project/filecoin-network-viz",
  "filecoin-project/filecoin-network-sim",
  "filecoin-project/rust-fil-proofs",
  "filecoin-project/merkletree",
  "filecoin-project/go-ipld-cbor",
  "filecoin-project/go-leb128",
  "filecoin-project/sample-data",
  "filecoin-project/bls-signatures",
  "filecoin-project/specs",
  "filecoin-project/community",
  "filecoin-project/sapling-crypto",
  "filecoin-project/filecoin-explorer",
  "filecoin-project/replication-game",
  "filecoin-project/research",
  "filecoin-project/fff",
  "filecoin-project/paired",
  "filecoin-project/infra",
  "filecoin-project/designdocs",
  "filecoin-project/replication-game-leaderboard",
  "filecoin-project/bitsets",
  "filecoin-project/fil-calculations",
  "filecoin-project/filecoin",
  "filecoin-project/rust-fil-secp256k1",
  "filecoin-project/lua-filecoin",
  "filecoin-project/go-filecoin-badges",
  "filecoin-project/bellperson",
  "filecoin-project/phase2",
  "filecoin-project/FIPs",
  "filecoin-project/filecoin-contributors",
  "filecoin-project/orient",
  "filecoin-project/rust-filbase",
  "filecoin-project/starling",
  "filecoin-project/rust-fil-sector-builder",
  "filecoin-project/rust-fil-proofs-ffi",
  "filecoin-project/rust-fil-ffi-toolkit",
  "filecoin-project/lotus",
  "filecoin-project/go-bls-sigs",
  "filecoin-project/go-sectorbuilder",
  "filecoin-project/venus-docs",
  "filecoin-project/cryptolab",
  "filecoin-project/zexe",
  "filecoin-project/PebblingAndDepthReductionAttacks",
  "filecoin-project/devgrants",
  "filecoin-project/filecoin-http-api",
  "filecoin-project/go-amt-ipld",
  "filecoin-project/drg-attacks",
  "filecoin-project/cpp-filecoin",
  "filecoin-project/go-data-transfer",
  "filecoin-project/security-analysis",
  "filecoin-project/chain-validation",
  "filecoin-project/go-http-api",
  "filecoin-project/fil-ocl",
  "filecoin-project/go-storage-miner",
  "filecoin-project/group",
  "filecoin-project/rust-fil-logger",
  "filecoin-project/lotus-docs",
  "filecoin-project/filecoin-ffi",
  "filecoin-project/go-fil-filestore",
  "filecoin-project/go-retrieval-market-project",
  "filecoin-project/go-fil-markets",
  "filecoin-project/go-shared-types",
  "filecoin-project/go-address",
  "filecoin-project/go-statestore",
  "filecoin-project/go-cbor-util",
  "filecoin-project/go-crypto",
  "filecoin-project/go-paramfetch",
  "filecoin-project/powersoftau",
  "filecoin-project/rust-filecoin-proofs-api",
  "filecoin-project/specs-actors",
  "filecoin-project/serialization-vectors",
  "filecoin-project/go-statemachine",
  "filecoin-project/go-padreader",
  // "filecoin-project/lotus-badges", // Error
  "filecoin-project/go-bitfield",
  "filecoin-project/go-fil-commcid",
  "filecoin-project/slate",
  "filecoin-project/specs-storage",
  "filecoin-project/fungi",
  "filecoin-project/filecoin-docs",
  "filecoin-project/sector-storage",
  "filecoin-project/storage-fsm",
  "filecoin-project/benchmarks",
  "filecoin-project/go-storedcounter",
  "filecoin-project/rust-sha2ni",
  "filecoin-project/ec-gpu",
  "filecoin-project/rust-fil-nse-gpu",
  "filecoin-project/sentinel-drone",
  "filecoin-project/sentinel",
  "filecoin-project/lotus-archived",
  "filecoin-project/go-jsonrpc",
  "filecoin-project/oni",
  "filecoin-project/mapr",
  "filecoin-project/phase2-attestations",
  "filecoin-project/filecoin-client-tutorial",
  "filecoin-project/slate-react-system",
  "filecoin-project/rust-gpu-tools",
  "filecoin-project/go-multistore",
  "filecoin-project/network-info",
  "filecoin-project/slate-stats",
  "filecoin-project/blstrs",
  "filecoin-project/test-vectors",
  "filecoin-project/statediff",
  // "filecoin-project/phase2-attestations-internal-verification", // Error
  "filecoin-project/fil-blst",
  "filecoin-project/blst",
  "filecoin-project/go-state-types",
  "filecoin-project/fuzzing-lotus",
  "filecoin-project/storage.filecoin.io",
  "filecoin-project/go-ds-versioning",
  "filecoin-project/core-devs",
  "filecoin-project/lily",
  "filecoin-project/helm-charts",
  "filecoin-project/notary-governance",
  "filecoin-project/website-security.filecoin.io",
  "filecoin-project/website-bounty.filecoin.io",
  "filecoin-project/product",
  "filecoin-project/ent",
  "filecoin-project/filecoin-discover-validator",
  "filecoin-project/go-commp-utils",
  "filecoin-project/go-bs-lmdb",
  "filecoin-project/filecoin-phase2",
  "filecoin-project/filecoin-plus-client-onboarding",
  "filecoin-project/sentinel-tick",
  "filecoin-project/taupipp",
  "filecoin-project/venus-sealer",
  "filecoin-project/community-china",
  "filecoin-project/venus-wallet",
  "filecoin-project/go-bs-postgres-chainnotated",
  "filecoin-project/retrieval-market-spec",
  "filecoin-project/go-fil-commp-hashhash",
  "filecoin-project/ffi-stub",
  "filecoin-project/dealbot",
  "filecoin-project/filecoin-plus-large-datasets",
  "filecoin-project/go-legs",
  "filecoin-project/sentinel-locations",
  "filecoin-project/go-dagaggregator-unixfs",
  "filecoin-project/dagstore",
  "filecoin-project/homebrew-lotus",
  "filecoin-project/eudico",
  "filecoin-project/sturdy-journey",
  "filecoin-project/ecodash",
  "filecoin-project/lily-archiver",
  "filecoin-project/fvm-runtime-experiment",
  "filecoin-project/system-test-matrix",
  "filecoin-project/fvm-specs",
  "filecoin-project/filecoin-discover-dealer",
  "filecoin-project/fil-rustacuda",
  "filecoin-project/retrieval-market",
  "filecoin-project/cgo-blockstore",
  "filecoin-project/venus-common-types",
  "filecoin-project/boost",
  "filecoin-project/bellperson-gadgets",
  "filecoin-project/ref-fvm",
  // "filecoin-project/lightning-planning", // Error
  // "filecoin-project/go-data-transfer-bus", // Error
  "filecoin-project/athena",
  "filecoin-project/fvm-test-vectors",
  "filecoin-project/data-transfer-benchmark",
  "filecoin-project/builtin-actors",
  "filecoin-project/filecoin-retrieval-market-website",
  "filecoin-project/boost-docs",
  "filecoin-project/sp-mentorship-grants",
  "filecoin-project/ref-fvm-fuzz-corpora",
  "filecoin-project/builtin-actors-bundler",
  "filecoin-project/fil_pasta_curves",
  "filecoin-project/filecoin-plus-leaderboard",
  "filecoin-project/go-cid-tools",
  "filecoin-project/client-growth",
  "filecoin-project/fvm-wasm-instrument",
  "filecoin-project/mir",
  "filecoin-project/filecoin-chain-archiver",
  "filecoin-project/gitops-profile-catalog",
  "filecoin-project/pubsub",
  "filecoin-project/fvm-docs",
  "filecoin-project/fvm-evm",
  "filecoin-project/filecoin-plus-leaderboard-data",
  "filecoin-project/go-ulimit",
  "filecoin-project/wasmtime",
  "filecoin-project/testnet-wallaby",
  "filecoin-project/cache-action",
  "filecoin-project/fvm-example-actors",
  "filecoin-project/tornado-deploy",
  "filecoin-project/halo2",
  "filecoin-project/near-blake2",
  "filecoin-project/parity-wasm",
  "filecoin-project/chain-love-website",
  "filecoin-project/homebrew-exporter",
  "filecoin-project/snapcraft-exporter",
  "filecoin-project/filet",
  "filecoin-project/release-metrics-gitops",
  "filecoin-project/docker-hub-exporter",
  "filecoin-project/github-exporter",
  "filecoin-project/wge-post-deployment-template-renderer",
  "filecoin-project/fevm-hardhat-kit",
  "filecoin-project/filecoin-actor-utils",
  "filecoin-project/wasm-tools",
  "filecoin-project/lassie",
  "filecoin-project/fvm-bench",
  "filecoin-project/circleci-exporter",
  "filecoin-project/fevm-foundry-kit",
  "filecoin-project/testnet-hyperspace",
  "filecoin-project/gov_docs",
  "filecoin-project/awesome-filecoin",
  "filecoin-project/go-data-segment",
  "filecoin-project/retrieval-load-testing",
  "filecoin-project/filcryo",
  "filecoin-project/fevm-contract-tests",
  "filecoin-project/openzeppelin-contracts",
  "filecoin-project/terraform-google-lily-starter",
  "filecoin-project/go-retrieval-types",
  "filecoin-project/lassie-event-recorder",
  "filecoin-project/rhea-load-testing",
  "filecoin-project/fil-sppark",
  "filecoin-project/fvm-starter-kit-deal-making",
  "filecoin-project/data-prep-tools",
  "filecoin-project/solidity-data-segment",
  "filecoin-project/TODOnotes",
  "filecoin-project/boost-graphsync",
  "filecoin-project/boost-gfm",
  "filecoin-project/filecoin-fvm-localnet",
  "filecoin-project/filecoin-docs-CAT",
  "filecoin-project/filecoin-docs-stefnotes",
  "filecoin-project/fevm-data-dao-kit",
  "filecoin-project/pc2_cuda",
  "filecoin-project/FIPs-1",
  "filecoin-project/cod-starter-kit",
  "filecoin-project/testnet-calibration",
  "filecoin-project/raas-starter-kit",
  "filecoin-project/filsnap",
  "filecoin-project/kubo-api-client",
  "filecoin-project/filecoin-solidity",
  "filecoin-project/motion",
  "filecoin-project/filecoin-plus-application-json-restructure",
  "filecoin-project/fil-docs-bot",
  "filecoin-project/sp-automation",
  "filecoin-project/gb-filecoin-docs",
  "filecoin-project/motion-s3-connector",
  "filecoin-project/motion-cloudserver",
  "filecoin-project/motion-arsenal",
  "filecoin-project/filplus-backend",
  "filecoin-project/filplus-tooling-backend-test",
  "filecoin-project/filplus-registry",
  "filecoin-project/filplus-utils",
  "filecoin-project/filplus-ssa-bot",
  "filecoin-project/filecoin-plus-roadmap",
  "filecoin-project/biscuit-dao",
  "filecoin-project/roadmap",
  "filecoin-project/meta-aggregator-frontend",
  "filecoin-project/filecoin-plus-falcon",
  "filecoin-project/motion-sp-test",
  "filecoin-project/tla-f3",
  "filecoin-project/go-f3",
  "filecoin-project/state-storage-starter-kit", // Error?
];
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
  let resp;
  try {
    resp = await ok.graphql.paginate(
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
  } catch (e) {
    console.log(`Error fetching ${fullRepoName} commits`);
    console.log(e);
    return [];
  }
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
