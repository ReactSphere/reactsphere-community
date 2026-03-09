#!/usr/bin/env node
/**
 * generate-leaderboard.js
 *
 * Fetches contributions for all users across all repositories in the
 * ReactSphere GitHub organization and writes a ranked LEADERBOARD.md file.
 *
 * Contribution types counted:
 *   - Commits
 *   - Pull Requests (opened)
 *   - Issues (opened)
 *   - Code Reviews (PR review submissions)
 *   - Documentation changes (commits that touch *.md / docs/ paths)
 *
 * Environment variables expected:
 *   GITHUB_TOKEN  – Personal Access Token or GITHUB_TOKEN secret
 *   ORG           – GitHub organisation name (default: ReactSphere)
 */

'use strict';

const https = require('https');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Ignore bots and AI agents
function isIgnoredUser(login) {
  if (!login) return true;

  // ignore github bots
  if (login.endsWith("[bot]")) return true;

  // ignore AI agents
  const ignored = ["Copilot"];
  if (ignored.includes(login)) return true;

  return false;
}
const ORG = process.env.ORG || 'ReactSphere';
const TOKEN = process.env.GITHUB_TOKEN;
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'LEADERBOARD.md';

if (!TOKEN) {
  console.error('ERROR: GITHUB_TOKEN environment variable is not set.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// GitHub REST API helper
// ---------------------------------------------------------------------------

/**
 * Make a paginated GET request to the GitHub REST API.
 * Automatically follows `Link: <…>; rel="next"` headers.
 *
 * @param {string} path  – API path, e.g. `/orgs/ReactSphere/repos`
 * @returns {Promise<Array>}
 */
function apiGet(path) {
  return new Promise((resolve, reject) => {
    const results = [];

    function fetchPage(url) {
      const options = {
        hostname: 'api.github.com',
        path: url,
        headers: {
          Authorization: `token ${TOKEN}`,
          'User-Agent': 'leaderboard-generator/1.0',
          Accept: 'application/vnd.github+json',
        },
      };

      https
        .get(options, (res) => {
          // Handle rate limiting
          if (res.statusCode === 403 || res.statusCode === 429) {
            const resetAt = res.headers['x-ratelimit-reset'];
            const waitSec = resetAt
              ? Math.max(0, Number(resetAt) - Math.floor(Date.now() / 1000)) + 1
              : 60;
            console.warn(
              `Rate limited on ${url}. Waiting ${waitSec}s before retry…`
            );
            setTimeout(() => fetchPage(url), waitSec * 1000);
            return;
          }

          if (res.statusCode === 204) {
            resolve(results);
            return;
          }

          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.warn(
              `WARN: GET ${url} returned HTTP ${res.statusCode} – skipping.`
            );
            resolve(results);
            return;
          }

          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            let data;
            try {
              data = JSON.parse(body);
            } catch (e) {
              console.warn(`WARN: Could not parse response for ${url}`);
              resolve(results);
              return;
            }

            if (Array.isArray(data)) {
              results.push(...data);
            } else {
              results.push(data);
            }

            // Follow pagination
            const link = res.headers['link'] || '';
            const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/);
            if (nextMatch) {
              const nextUrl = new URL(nextMatch[1]);
              fetchPage(nextUrl.pathname + nextUrl.search);
            } else {
              resolve(results);
            }
          });
        })
        .on('error', (err) => {
          console.error(`ERROR: Network error fetching ${url}: ${err.message}`);
          reject(err);
        });
    }

    fetchPage(path);
  });
}

// ---------------------------------------------------------------------------
// Data collection helpers
// ---------------------------------------------------------------------------

async function fetchRepos() {
  console.log(`Fetching repositories for org: ${ORG}`);
  const repos = await apiGet(`/orgs/${ORG}/repos?per_page=100&type=all`);
  console.log(`  Found ${repos.length} repositories.`);
  return repos.map((r) => r.name);
}

async function fetchCommits(repo) {
  const commits = await apiGet(
    `/repos/${ORG}/${repo}/commits?per_page=100`
  );
  return commits.filter((c) => c.author && c.author.login);
}

async function fetchPullRequests(repo) {
  const prs = await apiGet(
    `/repos/${ORG}/${repo}/pulls?state=all&per_page=100`
  );
  return prs.filter((p) => p.user && p.user.login);
}

async function fetchIssues(repo) {
  // GitHub's issues endpoint includes PRs; filter them out.
  const issues = await apiGet(
    `/repos/${ORG}/${repo}/issues?state=all&per_page=100`
  );
  return issues.filter((i) => !i.pull_request && i.user && i.user.login);
}

async function fetchReviews(repo) {
  const prs = await apiGet(
    `/repos/${ORG}/${repo}/pulls?state=all&per_page=100`
  );
  const reviews = [];
  // Cap at the 30 most-recent PRs to limit the number of API calls.
  const recentPrs = prs.slice(0, 30);
  for (const pr of recentPrs) {
    const prReviews = await apiGet(
      `/repos/${ORG}/${repo}/pulls/${pr.number}/reviews?per_page=100`
    );
    reviews.push(...prReviews.filter((r) => r.user && r.user.login));
  }
  return reviews;
}

/**
 * Identify documentation commits: commits that touch any *.md file or a
 * path starting with `docs/`.
 *
 * To avoid an N+1 API pattern we cap the commits inspected per repository
 * at 50 (the most recent ones) and fetch their details concurrently in
 * batches of 10 to stay well within rate-limit budgets.
 */
async function fetchDocCommits(repo) {
  const commits = await apiGet(
    `/repos/${ORG}/${repo}/commits?per_page=50`
  );
  const eligible = commits.filter((c) => c.author && c.author.login);

  const BATCH = 10;
  const docCommits = [];

  for (let i = 0; i < eligible.length; i += BATCH) {
    const batch = eligible.slice(i, i + BATCH);
    const details = await Promise.all(
      batch.map((c) => apiGet(`/repos/${ORG}/${repo}/commits/${c.sha}`))
    );
    for (let j = 0; j < batch.length; j++) {
      const files = (details[j][0] || details[j]).files || [];
      const isDoc = files.some(
        (f) => f.filename.endsWith('.md') || f.filename.startsWith('docs/')
      );
      if (isDoc) {
        docCommits.push(batch[j]);
      }
    }
  }

  return docCommits;
}

// ---------------------------------------------------------------------------
// Contribution aggregation
// ---------------------------------------------------------------------------

function ensureUser(map, login, avatarUrl) {

  // 🚫 Skip bots and AI
  if (isIgnoredUser(login)) return;

  if (!map[login]) {
    map[login] = {
      login,
      avatarUrl: avatarUrl || `https://github.com/${login}.png`,
      commits: 0,
      pullRequests: 0,
      issues: 0,
      codeReviews: 0,
      documentation: 0,
    };
  }

  if (avatarUrl && map[login].avatarUrl.endsWith('.png')) {
    map[login].avatarUrl = avatarUrl;
  }
}

async function aggregateContributions(repos) {
  const contributions = {};

  for (const repo of repos) {
    console.log(`  Processing repo: ${repo}`);

    // --- Commits ---
    try {
      const commits = await fetchCommits(repo);
      for (const c of commits) {
        const login = c.author.login;
        const avatar = c.author.avatar_url;
        ensureUser(contributions, login, avatar);
        contributions[login].commits += 1;
      }
    } catch (err) {
      console.warn(`  WARN: Could not fetch commits for ${repo}: ${err.message}`);
    }

    // --- Pull Requests ---
    try {
      const prs = await fetchPullRequests(repo);
      for (const pr of prs) {
        const login = pr.user.login;
        const avatar = pr.user.avatar_url;
        ensureUser(contributions, login, avatar);
        contributions[login].pullRequests += 1;
      }
    } catch (err) {
      console.warn(`  WARN: Could not fetch PRs for ${repo}: ${err.message}`);
    }

    // --- Issues ---
    try {
      const issues = await fetchIssues(repo);
      for (const issue of issues) {
        const login = issue.user.login;
        const avatar = issue.user.avatar_url;
        ensureUser(contributions, login, avatar);
        contributions[login].issues += 1;
      }
    } catch (err) {
      console.warn(`  WARN: Could not fetch issues for ${repo}: ${err.message}`);
    }

    // --- Code Reviews ---
    try {
      const reviews = await fetchReviews(repo);
      for (const review of reviews) {
        const login = review.user.login;
        const avatar = review.user.avatar_url;
        ensureUser(contributions, login, avatar);
        contributions[login].codeReviews += 1;
      }
    } catch (err) {
      console.warn(`  WARN: Could not fetch reviews for ${repo}: ${err.message}`);
    }

    // --- Documentation ---
    try {
      const docCommits = await fetchDocCommits(repo);
      for (const c of docCommits) {
        const login = c.author.login;
        const avatar = c.author.avatar_url;
        ensureUser(contributions, login, avatar);
        contributions[login].documentation += 1;
      }
    } catch (err) {
      console.warn(
        `  WARN: Could not fetch doc commits for ${repo}: ${err.message}`
      );
    }
  }

  return contributions;
}

// ---------------------------------------------------------------------------
// Leaderboard generation
// ---------------------------------------------------------------------------

function totalContributions(entry) {
  return (
    entry.commits +
    entry.pullRequests +
    entry.issues +
    entry.codeReviews +
    entry.documentation
  );
}

function badge(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

function generateMarkdown(contributions) {
  const sorted = Object.values(contributions).sort(
    (a, b) => totalContributions(b) - totalContributions(a)
  );

  const now = new Date().toISOString().split('T')[0];

  const lines = [
    '# 🏆 Contributions Leaderboard',
    '',
    `> Last updated: ${now}`,
    '',
    '| Rank | Avatar | Username | Total | Commits | Pull Requests | Issues | Reviews | Docs |',
    '|------|--------|----------|------:|--------:|--------------:|-------:|--------:|-----:|',
  ];

  sorted.forEach((entry, idx) => {
    const rank = idx + 1;
    const total = totalContributions(entry);
    const avatar = `<img src="${entry.avatarUrl}" width="32" height="32" alt="${entry.login}" />`;
    const username = `[@${entry.login}](https://github.com/${entry.login})`;
    lines.push(
      `| ${badge(rank)} | ${avatar} | ${username} | **${total}** | ${entry.commits} | ${entry.pullRequests} | ${entry.issues} | ${entry.codeReviews} | ${entry.documentation} |`
    );
  });

  lines.push('');
  lines.push(
    '_Generated automatically by the [leaderboard workflow](.github/workflows/leaderboard.yml)._'
  );
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  try {
    console.log('=== Leaderboard Generator ===');
    const repos = await fetchRepos();

    console.log('Aggregating contributions…');
    const contributions = await aggregateContributions(repos);

    const totalUsers = Object.keys(contributions).length;
    console.log(`Collected contributions for ${totalUsers} unique contributor(s).`);

    const markdown = generateMarkdown(contributions);
    fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8');
    console.log(`Leaderboard written to: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  }
})();
