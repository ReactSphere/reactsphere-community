# 🤝 Contributing to ReactSphere Community

Thank you for your interest in contributing! ReactSphere Community grows stronger with every contribution — whether it's a bug fix, a new feature, improved documentation, or a helpful discussion. This guide will walk you through everything you need to know.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Ways to Contribute](#ways-to-contribute)
3. [Getting Started](#getting-started)
4. [Branching Strategy](#branching-strategy)
5. [Commit Message Conventions](#commit-message-conventions)
6. [Pull Request Process](#pull-request-process)
7. [Coding Standards](#coding-standards)
8. [Reporting Issues](#reporting-issues)
9. [Participating in Discussions](#participating-in-discussions)
10. [Reviewing Pull Requests](#reviewing-pull-requests)
11. [Mentorship Program](#mentorship-program)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Ways to Contribute

There are many ways to get involved — no contribution is too small!

| Type | How |
|---|---|
| 🐛 **Bug reports** | [Open an issue](https://github.com/ReactSphere/reactsphere-community/issues/new) with the `bug` label |
| 💡 **Feature requests** | [Start a discussion](https://github.com/ReactSphere/reactsphere-community/discussions/new) first, then open an issue |
| 📝 **Documentation** | Edit Markdown files and open a pull request |
| 💻 **Code** | Fork, branch, code, test, and open a pull request |
| 🔍 **Reviews** | Comment on [open pull requests](https://github.com/ReactSphere/reactsphere-community/pulls) |
| 🗣️ **Discussions** | Answer questions and share knowledge in [Discussions](https://github.com/ReactSphere/reactsphere-community/discussions) |

---

## Getting Started

### Prerequisites

- A GitHub account
- [Git](https://git-scm.com/) installed locally
- [Node.js](https://nodejs.org/) (LTS version recommended) if working with scripts

### Setup

1. **Fork** the repository using the GitHub UI.

2. **Clone** your fork:

   ```bash
   git clone https://github.com/<your-username>/reactsphere-community.git
   cd reactsphere-community
   ```

3. **Add the upstream remote** so you can sync with the original repo:

   ```bash
   git remote add upstream https://github.com/ReactSphere/reactsphere-community.git
   ```

4. **Install dependencies** (if applicable):

   ```bash
   npm install
   ```

5. **Create a branch** for your work (see [Branching Strategy](#branching-strategy) below).

---

## Branching Strategy

We use a **feature-branch workflow**. All changes are made in short-lived branches and merged into `main` via pull requests.

| Branch prefix | Purpose | Example |
|---|---|---|
| `feat/` | New features or enhancements | `feat/add-mentorship-page` |
| `fix/` | Bug fixes | `fix/leaderboard-rank-calc` |
| `docs/` | Documentation updates | `docs/update-readme` |
| `chore/` | Maintenance, CI, tooling | `chore/bump-node-version` |
| `refactor/` | Code refactoring without behavior change | `refactor/leaderboard-script` |

**Rules:**
- Always branch off `main`: `git checkout -b feat/my-feature main`
- Keep branches focused — one logical change per branch.
- Delete your branch after it is merged.

---

## Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or updating tests |
| `chore` | Build process, CI, dependency updates |

### Examples

```
feat(leaderboard): add weekly contribution streak badge

fix(readme): correct broken contributor badge URL

docs(contributing): add branching strategy section

chore(ci): update Node.js version in leaderboard workflow
```

**Tips:**
- Use the imperative mood: "add feature" not "added feature"
- Keep the subject line under 72 characters
- Reference issues in the footer: `Closes #42`

---

## Pull Request Process

1. **Sync your fork** with upstream before starting:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push** your branch to your fork:

   ```bash
   git push origin feat/your-feature-name
   ```

3. **Open a Pull Request** against the `main` branch of this repository.

4. **Fill in the PR template** — describe what changed and why.

5. **Wait for review** — a maintainer or community member will review your PR. Be responsive to feedback.

6. **Address review comments** — push additional commits to the same branch; do not open a new PR.

7. Once approved, a maintainer will **squash-merge** your PR.

### PR Checklist

Before submitting, please confirm:

- [ ] My branch is up to date with `main`
- [ ] My commit messages follow [Conventional Commits](#commit-message-conventions)
- [ ] I have tested my changes locally
- [ ] I have updated relevant documentation
- [ ] I have not introduced breaking changes (or noted them clearly)

---

## Coding Standards

Since this is primarily a documentation and community-tooling repository, most files are Markdown or JavaScript (Node.js scripts).

### Markdown

- Use [GitHub Flavored Markdown](https://github.github.com/gfm/).
- Use ATX-style headings (`#`, `##`, `###`).
- Add a blank line before and after headings, lists, and code blocks.
- Prefer relative links to other files in the repository.
- Use reference-style links for repeated URLs.

### JavaScript / Node.js (scripts)

- Use `const` and `let`; avoid `var`.
- Use `async/await` over raw Promise chains where practical.
- Keep scripts focused — one purpose per file.
- Add comments for non-obvious logic.
- Follow the existing style of files in `.github/scripts/`.

---

## Reporting Issues

Before opening a new issue, please:

1. **Search existing issues** to avoid duplicates.
2. **Check Discussions** — your question may already be answered.

When opening an issue, choose the appropriate template and fill it in completely. Include:

- A clear, descriptive title
- Steps to reproduce (for bugs)
- Expected vs. actual behavior (for bugs)
- Screenshots or logs if relevant
- Your environment details (OS, Node version, etc.) if relevant

Label your issue appropriately (`bug`, `enhancement`, `documentation`, `question`).

---

## Participating in Discussions

Our [GitHub Discussions](https://github.com/ReactSphere/reactsphere-community/discussions) are the heart of the community. Here's how to engage constructively:

- **Be helpful and kind.** Assume positive intent.
- **Stay on-topic.** Keep threads focused on the subject.
- **Share knowledge freely.** Link to resources, examples, and prior art.
- **Vote on ideas.** Use 👍/👎 reactions to help signal community interest.
- **Celebrate others.** Recognize good work with a 🎉 or a kind comment.

---

## Reviewing Pull Requests

Code review is a collaborative, learning-focused activity. When reviewing:

- **Be respectful and constructive.** Critique the code, not the author.
- **Explain your reasoning.** Instead of "change this," explain *why*.
- **Acknowledge good work.** Use comments like "Nice approach here!" when appropriate.
- **Use suggestions.** GitHub's suggestion feature makes it easy for authors to accept changes with one click.
- **Focus on correctness, clarity, and maintainability** — not personal style preferences.

If you are uncertain about a change, leave a comment and ask questions rather than blocking a PR unnecessarily.

---

## Mentorship Program

Are you new to open source or to React? Our volunteer mentors are here to help!

- Look for issues labeled [`good first issue`](https://github.com/ReactSphere/reactsphere-community/labels/good%20first%20issue) to find beginner-friendly tasks.
- Post in Discussions under **#help** to ask for guidance.
- Experienced contributors: consider adding the `mentor` label to issues you are willing to guide someone through.

We believe everyone has something to teach and something to learn. Welcome aboard! 🚀

---

## 🙏 Thank You

Every contribution — no matter how small — makes ReactSphere Community better for everyone. We appreciate your time and effort.

If you have questions about this guide, please [open a Discussion](https://github.com/ReactSphere/reactsphere-community/discussions/new).
