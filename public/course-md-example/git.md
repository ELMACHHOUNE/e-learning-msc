---
title: "Git & GitHub: From Zero to Pro"
description: "Master Git and GitHub from the fundamentals of version control to advanced branching, collaboration, conflict resolution, release management, and CI/CD with GitHub Actions. Build professional workflows through practical exercises, checkpoints, and a final collaborative project."
category: DevOps
durationInMonths: 3
totalSessions: 24
price: 0
---

# Module 1: Introduction to Version Control and Git Fundamentals

## Chapter 1: Understanding Version Control

### Lesson: What Is Version Control?

Version control is a system for tracking changes to files over time. It allows developers to understand how a project evolved, recover previous versions, compare modifications, and collaborate without manually creating multiple copies of the same project.

Imagine building a web application. Without version control, you might create folders such as `project-final`, `project-final-v2`, and `project-final-fixed`. This approach becomes confusing when several developers work on the same codebase. Git solves this problem by maintaining a structured history of changes.

Git is a **distributed version control system**. Every developer can have a complete local repository containing the project's history. You can create commits, inspect changes, and work on branches without an internet connection.

Common version control concepts include:

- **Repository:** A project and its version history.
- **Commit:** A saved snapshot of selected changes.
- **Branch:** An independent line of development.
- **Merge:** Combining changes from different development histories.
- **Remote:** A repository hosted elsewhere, often on GitHub.
- **Working directory:** The files you are currently editing.

Version control is useful for frontend development, backend development, mobile applications, documentation, configuration files, and many other projects.

### Lesson: Git vs. GitHub

Git and GitHub are related but different tools. Git is the version control software installed on your computer. GitHub is an online platform that hosts Git repositories and provides collaboration features.

Git can be used without GitHub. For example, you can initialize a repository, create commits, and manage branches entirely on your computer. GitHub adds remote storage, pull requests, code reviews, issues, project management, and automated workflows.

| Feature                  | Git                                | GitHub                               |
| ------------------------ | ---------------------------------- | ------------------------------------ |
| Track file changes       | Yes                                | Uses Git repositories                |
| Create commits           | Yes                                | Through its interface or Git         |
| Create branches          | Yes                                | Yes                                  |
| Host remote repositories | Not by itself                      | Yes                                  |
| Review pull requests     | No built-in GitHub-style interface | Yes                                  |
| Run CI/CD workflows      | Not by itself                      | GitHub Actions                       |
| Work offline             | Yes                                | Online features require connectivity |

A developer usually uses both tools together. Git manages the local history, while GitHub makes that history accessible to teammates and supports collaboration.

### Lesson: Understanding Git's Three Main Areas

Git organizes your work into three important areas: the working directory, the staging area, and the repository history.

The **working directory** contains the files you edit. When you modify a tracked file, Git can detect the difference between your current version and the last committed version.

The **staging area**, also called the index, contains changes selected for the next commit. Staging lets you prepare a focused snapshot instead of committing every modification in your project.

The **repository history** contains commits that have already been saved. A commit records the selected changes, metadata, and a reference to the preceding project history.

A typical workflow is:

1. Edit a file.
2. Inspect the modifications.
3. Stage the changes.
4. Create a commit.
5. Push the commit to a remote repository when you want to share it.

The staging area is particularly useful when you change several files but want to create separate commits for different features or fixes.

## Chapter 2: Installing and Configuring Git

### Lesson: Installing Git on Windows, macOS, and Linux

Git is available for all major desktop operating systems. On Windows, download the installer from the official Git website. On macOS, you can install Git through the Xcode Command Line Tools or a package manager. On Linux, use your distribution's package manager.

Official download page: https://git-scm.com/downloads

On Windows, the Git installer includes Git Bash, a terminal that provides common Unix-style commands. You can also use PowerShell or Windows Terminal.

For Ubuntu or Debian, install Git with:

```bash
sudo apt update
sudo apt install git
```

For macOS with Homebrew:

```bash
brew install git
```

For Windows, download and run the official installer, then open Git Bash or PowerShell.

Verify the installation:

```bash
git --version
```

The command prints the installed Git version. If the terminal reports that Git cannot be found, check the installation and ensure Git is available on your system's PATH.

### Lesson: Configuring Your Git Identity

Git records an author name and email address in commits. Configure these values before creating your first commit.

Set your global identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

The `--global` option applies the configuration to your user account across repositories. You can override it for an individual project by running the same commands without `--global` inside that repository.

Inspect your configuration:

```bash
git config --global --list
git config user.name
git config user.email
```

Git configuration can exist at system, global, and repository levels. Repository-specific settings take precedence over global settings, which take precedence over system settings.

If you want commits to appear on your GitHub profile, use an email address associated with your GitHub account or a GitHub-provided private email address configured for commit attribution.

### Lesson: Choosing a Terminal and Understanding Basic Commands

A terminal lets you execute Git commands and navigate your project. Windows users can work with Git Bash, PowerShell, or Windows Terminal. macOS and Linux users can use their preferred terminal applications.

Start by learning basic navigation commands.

```bash
pwd
ls
cd my-project
mkdir git-practice
```

These commands display your current directory, list files, navigate to a directory, and create a new folder. In PowerShell, `Get-Location`, `Get-ChildItem`, and `Set-Location` provide equivalent navigation functionality.

Git commands commonly follow this structure:

```bash
git <command> <options>
```

For example:

```bash
git status
git log --oneline
git help commit
```

`git status` reports the current state of the working directory and staging area. `git log --oneline` displays a compact commit history. `git help commit` opens documentation for the commit command.

Learning to read command output is as important as memorizing commands. Git usually tells you whether files are modified, staged, untracked, or ready to commit.

## Chapter 3: Creating Your First Repository

### Lesson: Initializing a Git Repository

A Git repository stores project history and repository-specific configuration. To begin tracking an existing project, navigate to its folder and run `git init`.

```bash
mkdir my-first-project
cd my-first-project
git init
```

Git creates a hidden `.git` directory containing repository metadata. Do not manually edit or delete this directory unless you understand the consequences, because it contains the information needed to manage the repository.

Create a simple file:

```bash
echo "# My First Project" > README.md
git status
```

The status output identifies `README.md` as an untracked file. Git does not automatically begin tracking every file in the directory. You must explicitly stage files before committing them.

To inspect the repository root:

```bash
git rev-parse --show-toplevel
```

Use `git init` when starting a new local repository. If you already have a remote repository with history, cloning it is generally the better approach.

### Lesson: Understanding the First Commit

A commit saves a snapshot of the staged project changes in the repository history. A useful commit message explains the purpose of the change rather than simply stating that something was changed.

Stage and commit your README:

```bash
git add README.md
git commit -m "Add project README"
```

Inspect the result:

```bash
git status
git log --oneline
```

After a successful commit, the working directory should be clean if no additional changes exist.

A commit contains a unique identifier, author information, a timestamp, a message, and references to its parent commit or commits. Git uses these relationships to represent project history.

Good commit messages are concise and specific. Prefer `Add login form validation` over `update files`. A series of focused commits is easier to review, troubleshoot, and revert than a single commit containing unrelated changes.

### Workshop: Create and Track a Personal Project

Create a small project named `git-learning-journal`. Add a README containing the project title, purpose, setup instructions, and a short learning objective.

Initialize the repository, stage the README, and create your first commit.

```bash
mkdir git-learning-journal
cd git-learning-journal
git init
echo "# Git Learning Journal" > README.md
git add README.md
git commit -m "Create learning journal README"
git status
git log --oneline
```

Extend the README with a paragraph describing what you want to learn. Inspect the modification before staging it.

```bash
git diff
git add README.md
git commit -m "Describe learning objectives"
```

**Expected outcome:** You have a local repository with at least two meaningful commits. You can inspect its status and explain the purpose of the staging area.

### Checkpoint: Git Fundamentals Quiz

Answer these questions without looking at your notes.

1. What problem does version control solve?
2. What is the difference between Git and GitHub?
3. Which command initializes a repository?
4. Why does Git have a staging area?
5. What information does a commit record?
6. What is the difference between an untracked file and a modified tracked file?
7. How can you verify that Git is installed?
8. Why should you configure your Git identity?

Practical challenge: Create a repository, add a README, make two commits, and verify that the working directory is clean. Explain the commands you used and the purpose of each commit.

# Module 2: Working with Files, Staging, and Commits

## Chapter 1: Tracking and Inspecting Changes

### Lesson: Understanding Git Status

The `git status` command is one of the most important commands in daily development. It describes the current state of your repository and suggests useful next steps.

```bash
git status
git status --short
```

The standard output is detailed and beginner-friendly. The short format is more compact and useful when inspecting a large project.

Common status categories include:

- **Untracked:** A file exists but has not been added to Git's tracking.
- **Modified:** A tracked file has changes that are not necessarily staged.
- **Staged:** Changes are selected for the next commit.
- **Deleted:** A tracked file has been removed from the working directory.
- **Unmerged:** A merge conflict needs to be resolved.

For example, if you edit `README.md` and create `app.js`, Git can report the README as modified and the JavaScript file as untracked.

Run `git status` before staging, before committing, and after completing a Git operation. This habit prevents many common mistakes.

### Lesson: Staging Files with Git Add

The `git add` command stages changes for the next commit. It can stage a new file, modifications to an existing file, or a deletion.

```bash
git add README.md
git add app.js
git add .
git status
```

`git add .` stages changes within the current directory and its descendants. Use it carefully, especially in projects containing generated files, temporary files, or sensitive information.

To stage all changes to tracked files and stage new files throughout the repository, you can use:

```bash
git add -A
```

Staging is not the same as committing. It prepares the next snapshot, and you can still inspect or modify the staged content before saving it in the repository history.

A professional workflow favors focused staging. If you change documentation and fix a bug at the same time, consider staging the relevant changes separately so the commit history remains understandable.

### Lesson: Inspecting Changes with Git Diff

The `git diff` command helps you understand exactly what has changed. By default, it compares the working directory with the staging area, showing unstaged changes.

```bash
git diff
```

To inspect changes already staged for the next commit:

```bash
git diff --staged
```

To compare two commits:

```bash
git diff <commit-a> <commit-b>
```

Git displays removed lines with a minus sign and added lines with a plus sign. The surrounding context helps you understand where the modification occurred.

For example, if you replace a hard-coded title with a variable, `git diff` shows the old line and the new line. Review these changes before committing to catch accidental deletions, debugging code, and unrelated modifications.

You can also compare a specific file:

```bash
git diff -- README.md
```

A diff is one of the most useful tools for code reviews because it reveals the actual change rather than relying on a commit message alone.

## Chapter 2: Creating Meaningful Commits

### Lesson: Writing Professional Commit Messages

A good commit message communicates the intention of a change. A reviewer should understand the commit's purpose without needing to inspect every file immediately.

A common convention uses an imperative subject line, such as `Add user registration endpoint` or `Fix navbar on mobile screens`.

One popular format is Conventional Commits:

```text
feat: add user registration
fix: handle missing API response
docs: update installation instructions
refactor: simplify authentication service
test: cover password validation
chore: update development dependencies
```

Common prefixes include `feat` for a feature, `fix` for a bug fix, `docs` for documentation, `test` for tests, `refactor` for internal restructuring, and `chore` for maintenance.

Conventional Commits is a convention rather than a requirement imposed by Git. Teams can adapt it to their needs.

Create commits that represent logical units of work. Avoid messages such as `stuff`, `final changes`, or `work`. Small, clear commits make it easier to understand project history and identify regressions.

### Lesson: Creating and Reviewing Commits

To create a commit, stage the intended changes and run `git commit`.

```bash
git add README.md
git commit -m "Improve project documentation"
```

To inspect recent history:

```bash
git log
git log --oneline
git log --oneline --graph --decorate
```

The graphical log helps you understand branch structure and see where commits belong.

To inspect a specific commit:

```bash
git show <commit-hash>
```

The command displays the commit metadata and the changes it introduced. You can also inspect a particular file at a commit using a revision expression:

```bash
git show <commit-hash>:README.md
```

Replace `<commit-hash>` with a real commit identifier from your repository. The colon syntax reads the version of the file stored in that commit.

Reviewing history helps you understand when a feature was introduced, which files changed, and how the code evolved over time.

### Lesson: Staging Part of a File

Sometimes one file contains several unrelated modifications. You may want to commit only some of them. Git supports interactive staging, which allows you to select individual change blocks called hunks.

```bash
git add -p
```

Git presents each hunk and asks whether you want to stage it. Depending on the prompt, you can accept, reject, split, or inspect the hunk.

This is useful when you fix a bug and add a new feature in the same file but want separate commits. It can also help remove unrelated formatting changes from a focused patch.

After interactive staging, inspect the staged and unstaged differences:

```bash
git diff --staged
git diff
git status
```

The staged diff should contain only the changes intended for the next commit. The unstaged diff should contain any changes you deliberately left out.

Partial staging requires careful review, because the selected hunks may depend on each other. Test the resulting change before committing if the edits are logically connected.

## Chapter 3: Ignoring Files and Managing Project Content

### Lesson: Creating a Git Ignore File

Some files should not be committed, including dependency directories, generated output, local configuration, and environment files containing secrets. Git uses a `.gitignore` file to identify untracked files that should be ignored.

A typical JavaScript project might use:

```gitignore
node_modules/
dist/
build/
coverage/
.env
.env.*
!.env.example
.DS_Store
```

Each pattern has a specific meaning. A trailing slash matches a directory, while `!` can re-include a path that was previously excluded. Review patterns carefully to ensure required source files are not accidentally ignored.

A `.gitignore` file only prevents matching untracked files from being added through ordinary Git workflows. It does not automatically stop tracking files already committed.

If a file is already tracked, adding it to `.gitignore` is not sufficient. You must remove it from the index while retaining the local file if that is your intention.

### Lesson: Removing, Renaming, and Moving Files

Git can track file deletion and renaming as part of normal project changes. You can delete a file using your file manager or terminal and then stage the deletion.

```bash
git rm old-file.txt
git commit -m "Remove obsolete file"
```

`git rm` removes a tracked file from the working directory and stages its removal. To stop tracking a file while keeping the local copy, use:

```bash
git rm --cached .env
```

This is useful if a file was accidentally added to the repository but should remain available locally. Add it to `.gitignore` afterward.

Rename or move a tracked file with:

```bash
git mv old-name.txt new-name.txt
git status
```

Git detects renames by comparing file content and history; it does not store renames as a separate fundamental object type. The displayed rename is inferred from the changes.

If a secret has already been committed, removing it in a later commit does not erase it from the earlier history. Revoke or rotate the secret immediately and follow the appropriate repository-history cleanup process.

### Workshop: Build a Clean Repository

Create a small Node.js project with a README, an application entry point, and a `.gitignore` file. Add a placeholder `.env.example` file containing only sample variable names, not real credentials.

```bash
mkdir clean-node-project
cd clean-node-project
git init
```

Create a `.gitignore` file:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
```

Create a README and an application file, then stage and commit the intended files.

```bash
git add README.md app.js .gitignore .env.example
git diff --staged
git commit -m "Set up clean Node.js project"
git status
```

Verify that your real `.env` file is not tracked if one exists. If you accidentally staged a file before committing, unstage it without deleting the working copy:

```bash
git restore --staged <file>
```

**Expected outcome:** A clean repository structure, a meaningful first commit, and an explanation of why secrets and generated dependencies should not be committed.

### Checkpoint: Staging and Commits Assessment

Complete the following tasks:

1. Create a file and identify its initial Git status.
2. Modify the file and inspect the difference.
3. Stage the file and inspect the staged diff.
4. Create a commit with a meaningful message.
5. Stage only part of a file using interactive staging.
6. Create a `.gitignore` file for a JavaScript project.
7. Explain the difference between `git rm` and `git rm --cached`.
8. Explain why adding a secret to `.gitignore` does not remove it from existing history.

Your submission should include the command sequence, the output of `git status`, and the latest commit history.

# Module 3: Branching, Merging, and Conflict Resolution

## Chapter 1: Understanding Branches

### Lesson: What Is a Git Branch?

A branch is a movable reference to a commit. Branches let developers work on features, fixes, and experiments without making every change directly on the main development line.

For example, a team might use `main` for stable code and create `feature/user-profile` for a new profile page. Once the feature is reviewed and tested, the team can integrate it into the main branch.

Create and inspect branches:

```bash
git branch
git branch feature/user-profile
git branch
```

The first command lists local branches. The second creates a branch without switching to it.

A branch is lightweight because it is a reference to a commit, not a complete duplicate of the repository. Branching is therefore a core part of efficient Git workflows.

Use descriptive branch names such as `feature/user-profile`, `fix/login-validation`, or `docs/setup-guide`. A consistent naming convention helps teammates understand the purpose of each branch.

### Lesson: Switching Between Branches

Use `git switch` to move between branches.

```bash
git switch feature/user-profile
```

You can create and switch to a new branch in one command:

```bash
git switch -c feature/user-profile
```

When you switch branches, Git updates the working directory to match the selected branch's commit, subject to the handling of local changes. Git may prevent a switch if it would overwrite conflicting uncommitted changes.

Before switching, inspect your repository:

```bash
git status
git branch --show-current
```

Committed changes remain available in the history of their branch. Uncommitted changes may move with you when Git can do so safely, but you should not rely on that behavior for complex changes.

A good habit is to finish or commit a logical unit of work before changing branches. If work is incomplete, consider using a temporary commit or `git stash`.

### Lesson: Building a Feature on a Separate Branch

Feature branches isolate development and make code review easier. Start from the branch that should serve as the feature's base, often the latest `main`.

```bash
git switch main
git switch -c feature/add-about-page
```

Create or modify the required files. Inspect and commit the changes:

```bash
git status
git diff
git add .
git diff --staged
git commit -m "Add about page"
```

The feature commit now belongs to the feature branch. If you switch back to `main`, the committed feature will not automatically appear there until you integrate the branch.

```bash
git switch main
git log --oneline --all --graph
```

The graphical history helps show that the feature branch has moved forward independently.

Feature branches are useful for both solo and team projects. They make it easier to test alternatives, review a focused change, and discard an experiment without affecting stable work.

## Chapter 2: Merging Branches

### Lesson: Understanding Git Merge

Merging integrates changes from one branch into another. To merge a feature into `main`, switch to `main` and merge the feature branch.

```bash
git switch main
git merge feature/add-about-page
```

Git may perform a **fast-forward merge** when the target branch has not diverged from the feature branch. In that case, Git can simply move the target branch reference forward.

If both branches contain independent commits, Git may create a merge commit that records the integration of both histories.

Inspect the result:

```bash
git log --oneline --graph --decorate --all
git status
```

A merge does not always create a new commit. The exact behavior depends on the relationship between the branches and the merge options.

Merge frequently, in small logical units, and run relevant tests after integration. This reduces the size of potential conflicts and makes problems easier to identify.

### Lesson: Understanding Merge Conflicts

A merge conflict occurs when Git cannot automatically combine changes. A common example is when two branches modify the same lines of a file in incompatible ways.

Git marks conflicted regions with markers similar to these:

```text
<<<<<<< HEAD
Welcome to the application.
=======
Welcome to our web platform.
>>>>>>> feature/update-welcome
```

The section above `=======` represents the current branch's version. The section below it represents the incoming branch's version. The labels identify the conflicting sides, although the exact marker text depends on the operation and configuration.

The conflict markers are temporary instructions for you to resolve. Edit the file so it contains the intended final content, and remove all conflict markers.

Never assume that one side is automatically correct. Read the surrounding code and understand the intent of both changes before deciding how to combine them.

### Lesson: Resolving and Completing a Merge Conflict

When Git reports a merge conflict, inspect the affected files.

```bash
git status
```

Open each conflicted file and edit the conflicting sections. After resolving the content, stage the files:

```bash
git add <resolved-file>
git diff --staged
```

Complete the merge:

```bash
git commit
```

Git usually prepares a merge commit message for you. Depending on the merge and Git version, the merge may be completed automatically after the resolved files are staged, or Git may prompt you to create the merge commit.

If you decide not to continue a merge that is still in progress, you can usually return to the pre-merge state with:

```bash
git merge --abort
```

Use this command only while a merge is in progress. It is not a general undo command for completed merges or unrelated changes.

After resolving conflicts, inspect the final diff, run tests, and confirm that the repository is clean.

## Chapter 3: Rebase and Branch History

### Lesson: Understanding Git Rebase

Rebase moves or replays commits onto a different base commit. It is often used to update a feature branch with newer commits from `main`.

```bash
git switch feature/add-about-page
git fetch origin
git rebase origin/main
```

Git replays the feature branch's commits onto the fetched main branch history. This can produce a more linear commit history than merging.

During a rebase conflict, edit the conflicting files, stage the resolutions, and continue:

```bash
git add <resolved-file>
git rebase --continue
```

To stop the rebase and return to its pre-rebase state:

```bash
git rebase --abort
```

Rebase creates new commit identities for the replayed commits because their history has changed. Do not casually rebase commits that other people already depend on, because doing so can complicate collaboration.

A useful rule is to rebase your own unpublished feature work when appropriate, but coordinate carefully before rewriting shared history.

### Lesson: Choosing Between Merge and Rebase

Merge and rebase both integrate development histories, but they represent history differently.

| Consideration                            | Merge           | Rebase                  |
| ---------------------------------------- | --------------- | ----------------------- |
| Preserves existing commit identities     | Yes             | No for replayed commits |
| Can create a merge commit                | Yes             | Not normally            |
| Produces linear history                  | Not necessarily | Usually                 |
| Appropriate for shared published history | Often           | Requires caution        |
| Can require conflict resolution          | Yes             | Yes                     |

A merge preserves the existing branch structure and records integration. A rebase replays commits onto another base, which can make the resulting history easier to follow.

Teams may use merge commits, squash merging, rebasing, or a combination of these approaches. Follow the repository's contribution guidelines rather than choosing a strategy independently.

Both approaches require you to test the final result. A clean history is useful, but correctness and understandable collaboration matter more than making every graph perfectly linear.

### Workshop: Feature Branch and Conflict Lab

Create a repository with a README containing a welcome message. Commit the file on `main`.

Create a feature branch and change the welcome message. Commit the change. Then switch back to `main`, change the same line differently, and commit that change.

```bash
git switch main
git switch -c feature/welcome-message
```

After committing the feature version, return to `main` and make the competing edit. Then merge the feature branch.

```bash
git switch main
git merge feature/welcome-message
```

If Git reports a conflict, inspect the file, choose or combine the desired text, remove the conflict markers, stage the resolved file, and complete the merge.

```bash
git status
git add README.md
git diff --staged
git commit
git log --oneline --graph --all
```

**Expected outcome:** You can create a feature branch, integrate it, explain a merge conflict, and verify the resulting history.

### Checkpoint: Branching and Merging Quiz

1. What is a branch in Git?
2. How do you create and switch to a new branch?
3. What is a fast-forward merge?
4. When might Git create a merge commit?
5. What causes a merge conflict?
6. How do you identify conflicted files?
7. How do you finish resolving a conflict?
8. What is the difference between merge and rebase?
9. Why is rebasing published shared commits risky?
10. When should you run tests after a merge or rebase?

Practical challenge: Create two branches that edit the same line, reproduce a conflict, resolve it, and explain the resulting commit graph.

# Module 4: GitHub, Remotes, and Collaborative Workflows

## Chapter 1: Getting Started with GitHub

### Lesson: Creating a GitHub Account and Repository

GitHub hosts Git repositories and adds tools for collaboration, documentation, issue tracking, and automation. Create an account at https://github.com and review your profile settings.

A repository can be public or private. Public repositories are visible to others, while private repositories restrict access to authorized users. Both options require care when handling credentials and sensitive information.

When creating a new GitHub repository, you can optionally add a README, a `.gitignore`, or a license. If you already have a local repository with commits, creating an empty remote repository often makes the initial connection simpler.

Before publishing a project, inspect its contents and history. Never upload passwords, access tokens, private keys, production credentials, or confidential data. Public visibility makes accidental exposure especially serious, but private repositories also require secure handling.

GitHub is a hosting and collaboration platform, not a replacement for understanding Git. You should know how to inspect and manage your repository locally before relying on its web interface.

### Lesson: Connecting a Local Repository to GitHub

A remote is a named reference to another repository. The conventional name for the primary remote is `origin`.

Create an empty repository on GitHub, then connect your existing local project using the repository URL provided by GitHub.

```bash
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git remote -v
```

Replace `USERNAME` and `REPOSITORY` with your actual GitHub username and repository name.

If your default branch is named `main`, you can ensure the local branch has that name:

```bash
git branch -M main
```

Push the branch and establish its upstream tracking relationship:

```bash
git push -u origin main
```

The `-u` option configures the upstream branch, allowing future pushes and pulls to use the tracking relationship more conveniently.

If Git reports that `origin` already exists, inspect the current configuration before changing it. Use `git remote set-url origin <url>` only when you intend to update the existing remote.

### Lesson: Understanding Push, Fetch, and Pull

A push sends local commits to a remote repository. A fetch downloads remote references and objects without automatically integrating them into your current branch. A pull fetches remote changes and then integrates them according to the configured strategy.

```bash
git push
git fetch origin
git pull
```

`git fetch origin` is particularly useful because it lets you inspect remote changes before deciding how to integrate them.

After fetching, compare your current branch with the remote-tracking branch:

```bash
git log --oneline --graph --decorate --all
git diff HEAD origin/main
```

The comparison is valid when `origin/main` exists and represents the remote branch you want to inspect.

A pull may merge or rebase depending on the options and configuration. Understand your team's workflow before using commands that automatically integrate changes.

If a push is rejected because the remote has commits you do not have locally, fetch and inspect the remote history before integrating it. Do not immediately overwrite the remote branch.

## Chapter 2: Authentication and Repository Access

### Lesson: HTTPS and SSH Authentication

GitHub supports authentication methods such as HTTPS with supported credential helpers or GitHub CLI authentication, and SSH keys. Your authentication method determines how Git proves that you have permission to access a repository.

For HTTPS, GitHub does not accept your account password as a Git password for normal Git operations. Use a supported authentication method, such as the GitHub CLI or an appropriately configured credential manager.

Official authentication guidance: https://docs.github.com/en/authentication

SSH authentication requires an SSH key pair. The public key is added to your GitHub account, while the private key stays on your device and must never be shared.

Check whether SSH keys already exist:

```bash
ls -al ~/.ssh
```

To test a configured GitHub SSH connection:

```bash
ssh -T git@github.com
```

Follow GitHub's official setup instructions if you need to create a key, configure the SSH agent, or add the public key to your account.

Use only the authentication method appropriate for your device and organization. Never paste private keys, access tokens, or passwords into a repository, issue, or chat.

### Lesson: Cloning Existing Repositories

Cloning creates a local copy of a remote repository, including its committed history and configured remote reference.

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
git status
git remote -v
```

Replace the placeholder URL with the real repository URL. You can also clone using an SSH URL if your SSH authentication is configured.

To clone into a custom directory:

```bash
git clone https://github.com/USERNAME/REPOSITORY.git my-local-copy
```

Cloning is the standard starting point when contributing to an existing project. After cloning, inspect the README, branch structure, contribution guidelines, and development instructions.

Before making changes, create a feature branch rather than editing the shared main branch directly. This allows you to work independently and prepare a reviewable change.

### Lesson: Forking Repositories and Upstream Remotes

A fork is a GitHub-hosted copy of another repository under your own account or organization. Forking is commonly used when you want to contribute to a project but do not have permission to push directly to its repository.

Clone your fork, then add the original project as an upstream remote when appropriate.

```bash
git clone https://github.com/YOUR-USERNAME/PROJECT.git
cd PROJECT
git remote add upstream https://github.com/ORIGINAL-OWNER/PROJECT.git
git remote -v
```

Here, `origin` normally points to your fork, while `upstream` points to the original repository.

To update your local view of the original repository:

```bash
git fetch upstream
git log --oneline --graph --all
```

If your contribution workflow requires it, integrate the latest upstream changes into your working branch before opening or updating a pull request.

Always follow the original project's contribution instructions. Some projects require issue references, tests, specific commit conventions, or particular branch naming rules.

## Chapter 3: Pull Requests and Code Reviews

### Lesson: Understanding Pull Requests

A pull request, commonly called a PR, proposes changes from one branch into another on GitHub. It provides a place for discussion, automated checks, code review, and approval before changes are merged.

A typical pull request workflow includes:

1. Create a feature branch.
2. Implement and commit the changes.
3. Push the branch to GitHub.
4. Open a pull request.
5. Explain the purpose and impact of the change.
6. Respond to feedback and update the branch.
7. Pass required checks and obtain approvals.
8. Merge according to the project's policy.

A pull request should have a clear title and a description of what changed, why it was necessary, and how it was tested. Include screenshots for visual changes when useful.

A good pull request is focused. Large, unrelated changes are harder to review and increase the chance of overlooking bugs.

### Lesson: Reviewing Code and Giving Feedback

Code review checks correctness, readability, maintainability, security, performance, and alignment with project requirements.

Reviewers should inspect the actual diff, not just the description. Look for incorrect assumptions, missing error handling, untested cases, exposed secrets, duplicated logic, and changes that break existing behavior.

Constructive feedback explains the concern and suggests a practical improvement. For example, instead of saying "This is bad," identify the specific problem and explain its impact.

GitHub supports general comments, line-specific comments, and review submissions. Depending on repository settings and permissions, reviewers can approve a change, request changes, or leave comments without a formal decision.

Reviewers should distinguish between blocking issues and optional suggestions. Authors should respond professionally, clarify design choices when necessary, and make additional commits that address agreed-upon feedback.

### Lesson: Understanding Pull Request Merge Strategies

GitHub commonly offers three merge approaches, subject to repository settings.

**Merge commit:** Combines the branch into the target branch and preserves the branch's commit history.

**Squash and merge:** Combines the pull request's commits into a single commit on the target branch. This can keep the main history compact.

**Rebase and merge:** Replays the pull request's commits onto the target branch without creating a traditional merge commit.

Each method has trade-offs. A squash merge can be convenient when a feature branch contains many small intermediate commits. A merge commit can preserve the explicit history of a collaboration. Rebase and merge can maintain a linear history while retaining separate commits.

The team should choose a strategy based on its development practices, traceability requirements, and contribution guidelines.

Before merging, verify that required tests pass, reviews are complete, conflicts are resolved, and the change is ready for integration.

## Chapter 4: Collaborating with Teammates

### Lesson: Protecting the Main Branch

Branch protection rules and repository rulesets help maintain quality on important branches. They can require pull requests, reviews, passing status checks, and other conditions before changes are merged.

A typical team workflow prevents direct pushes to `main` and requires developers to submit changes through pull requests. This encourages review and helps prevent accidental integration of incomplete work.

Administrators can configure rules in the repository settings, subject to organization policies and available GitHub features.

Rules may require a certain number of approvals, dismiss stale approvals after new changes, require code-owner reviews, or require status checks to pass.

Protection is not a substitute for good development practices. Teams still need useful tests, clear ownership, secure access control, and a process for handling urgent fixes.

### Lesson: Keeping Your Feature Branch Updated

While you work on a feature, other developers may merge changes into `main`. Update your branch regularly to reduce integration surprises.

A merge-based approach:

```bash
git fetch origin
git switch feature/my-feature
git merge origin/main
```

A rebase-based approach for unpublished work:

```bash
git fetch origin
git switch feature/my-feature
git rebase origin/main
```

Choose one strategy according to your team's workflow. If the branch has already been published and collaborators rely on its history, coordinate before rebasing and rewriting commits.

After integrating the latest changes, resolve conflicts if needed, run tests, and push your updates. If a rebase changes commits already published to the feature branch, a normal push may be rejected; use a coordinated and safe workflow rather than blindly forcing an update.

Frequent synchronization makes code review easier and helps uncover incompatible changes earlier.

### Workshop: Collaborative Pull Request Workflow

Create a GitHub repository and invite a teammate if available. One person should create a feature branch, add a useful improvement to the README, and push the branch.

```bash
git switch -c feature/improve-readme
git add README.md
git commit -m "Improve project documentation"
git push -u origin feature/improve-readme
```

Open a pull request on GitHub. Include a description, the motivation for the change, and a testing or verification note.

Ask a teammate to inspect the diff and leave a constructive review comment. Update the branch if feedback requires a change, then request another review if appropriate.

Merge the pull request according to the repository's policy. Finally, synchronize the local repository:

```bash
git switch main
git pull origin main
git log --oneline --graph --all
```

**Expected outcome:** You can explain a pull request, review a change, respond to feedback, and synchronize your local repository with GitHub.

### Checkpoint: GitHub Collaboration Assessment

1. What is the difference between a remote and a local repository?
2. What do `git push`, `git fetch`, and `git pull` do?
3. What is the difference between a fork and a clone?
4. Why might you add an `upstream` remote?
5. What is a pull request?
6. Why should important branches use protection rules?
7. What are the main differences between merge commit, squash merge, and rebase and merge?
8. How should a developer respond to code review feedback?
9. Why should secrets never be committed?
10. How do you update a feature branch with the latest main branch changes?

Practical challenge: Open a pull request, obtain a review, make a requested improvement, and document the final merge process.

# Module 5: Undoing Mistakes and Managing Repository History

## Chapter 1: Safely Undoing Changes

### Lesson: Discarding Unstaged Changes with Git Restore

During development, you may modify a file and decide that you no longer want those changes. Git provides several ways to restore content, but the correct command depends on whether the changes are unstaged, staged, or committed.

To discard unstaged changes in a tracked file:

```bash
git restore README.md
```

This restores the file to the version in the index, usually the last staged version. Any unstaged modifications to that file are lost.

Before running this command, inspect the changes:

```bash
git diff
git status
```

If you want to restore a file to the current commit rather than to staged content, make sure you understand the relationship between the index and `HEAD` before proceeding.

Do not use `git restore` on work you might need later without creating a backup or preserving the changes. Git commands that discard working-directory changes may not be easy to reverse.

### Lesson: Unstaging Files

If you stage a file by mistake, you can remove it from the staging area without deleting your local changes.

```bash
git restore --staged README.md
```

The file remains in your working directory. Its changes are simply removed from the next commit's proposed snapshot.

Check the result:

```bash
git status
git diff
```

For a broader operation, `git restore --staged .` unstages all staged paths in the current directory scope. Use it only when that is what you intend.

Unstaging is especially useful when `git add .` includes files that should be committed separately or excluded from the repository.

A safe habit is to inspect `git diff --staged` before every commit. If the staged changes are not what you intended, unstage or adjust them before proceeding.

### Lesson: Understanding Git Reset

`git reset` moves the current branch reference and, depending on the mode, may also change the index or working directory.

A soft reset moves the current branch reference while keeping changes staged:

```bash
git reset --soft HEAD~1
```

A mixed reset, which is the default mode, moves the reference and resets the index while keeping the changes in the working directory:

```bash
git reset HEAD~1
```

A hard reset also changes the working directory:

```bash
git reset --hard HEAD~1
```

The hard reset can discard tracked working-directory changes and remove commits from the current branch's visible history. Do not run it casually, especially when the work has not been backed up.

`HEAD~1` refers to the first parent of the current commit. The correct revision depends on the history you intend to modify.

Before using reset, inspect the history and working-tree status. For shared or published commits, `git revert` is often the safer choice because it creates a new commit that reverses the intended change.

## Chapter 2: Reverting and Recovering History

### Lesson: Undoing a Commit with Git Revert

`git revert` creates a new commit that reverses the changes introduced by an earlier commit. It is generally appropriate when the commit has already been pushed to a shared branch.

```bash
git log --oneline
git revert <commit-hash>
```

Replace `<commit-hash>` with the commit you want to reverse. Git applies the inverse change and usually opens an editor for the new commit message.

If the original change conflicts with later modifications, Git may require conflict resolution. Resolve the files, stage the resolutions, and complete the revert according to Git's instructions.

Revert does not erase the original commit. The history shows both the original change and the commit that reverses it, which preserves a transparent audit trail.

If you need to reverse a merge commit, the operation requires choosing a mainline parent with the appropriate `-m` option. Understand the merge topology before doing this, because the choice affects which changes are reversed.

### Lesson: Recovering Commits with Git Reflog

The reflog records updates to local references such as `HEAD`. It can help you locate commits after a branch was reset, a branch reference moved, or a rebase changed the visible history.

```bash
git reflog
```

The output shows recent reference movements and their associated commit identifiers. If you find the commit you want to recover, inspect it before taking action.

You can create a recovery branch pointing to a known commit:

```bash
git branch recovery-branch <commit-hash>
```

This preserves a convenient reference to the commit while you investigate the repository.

The reflog is local and is not a permanent backup. Entries can expire, and unreachable objects may eventually be removed by garbage collection. Do not assume that reflog can recover every deleted file or secret.

For important work, use regular commits, backups, and remote repositories. Recovery tools are valuable, but they should not replace deliberate version control practices.

### Lesson: Comparing and Inspecting Historical Versions

Git allows you to inspect how files and commits differ across time.

```bash
git log --oneline -- README.md
git blame README.md
git show <commit-hash>
git diff <commit-a> <commit-b>
```

The path-limited log shows commits affecting a particular file. `git blame` identifies the commit associated with each line in the current version of a file, which can help investigate when a change was introduced.

Blame is a diagnostic tool, not a way to assign fault. Refactoring, file movement, and collaborative edits can make the displayed attribution less straightforward than it appears.

You can inspect an older file without changing your working directory:

```bash
git show <commit-hash>:README.md
```

Use history to answer practical questions: Which change introduced a bug? What did the file look like before a refactor? Which commit added a particular behavior?

## Chapter 3: Stashing Incomplete Work

### Lesson: Saving Temporary Changes with Git Stash

Sometimes you need to switch branches but are not ready to commit your current work. `git stash` temporarily stores selected working-directory changes so you can return to a clean working tree.

```bash
git stash push -m "WIP: profile page"
git status
```

By default, stash includes tracked-file changes in the working directory and index. New untracked files are not included unless you request them.

To include untracked files:

```bash
git stash push -u -m "WIP: include new files"
```

Use stash for short-lived interruptions, such as switching to another branch to investigate a bug. It is not a substitute for a meaningful commit or a backup system.

Before stashing, check the current state and make sure you understand which files will be stored. Sensitive files should not be copied into shared or external locations without appropriate safeguards.

### Lesson: Applying and Managing Stashes

List available stashes:

```bash
git stash list
```

Apply the most recent stash without removing it from the stash list:

```bash
git stash apply
```

Apply a specific stash using its reference:

```bash
git stash apply stash@{0}
```

To apply the most recent stash and remove it from the stash list if successful:

```bash
git stash pop
```

Applying or popping a stash can produce conflicts if the current files have changed. Resolve any conflicts and inspect the final result before committing.

You can inspect a stash's changes:

```bash
git stash show -p stash@{0}
```

Do not delete a stash until you have confirmed that its changes are safely restored or otherwise preserved. Stashes are local and should not be treated as a shared collaboration mechanism.

## Chapter 4: Tags, Releases, and Repository Maintenance

### Lesson: Creating Git Tags

A tag identifies a specific point in the repository history. Tags are commonly used to mark software versions such as `v1.0.0` or `v2.1.0`.

A lightweight tag is a simple reference to a commit:

```bash
git tag v1.0.0
```

An annotated tag stores additional metadata, including a message and tagger information:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
```

Annotated tags are generally preferred for releases because they provide descriptive metadata.

List tags:

```bash
git tag
git show v1.0.0
```

A tag points to a particular commit, so create it only after verifying that the selected commit represents the version you intend to release.

Tags are not automatically pushed merely because you push a branch. You can publish a specific tag or all tags explicitly.

### Lesson: Publishing Tags and Creating Releases

Push a particular tag to the remote:

```bash
git push origin v1.0.0
```

To push all local tags:

```bash
git push origin --tags
```

Use the second command carefully, especially when working with many experimental tags. Verify the intended tags before publishing them.

GitHub releases provide a user-friendly presentation of a version. A release is commonly associated with a Git tag and can include release notes, downloadable assets, and a summary of important changes.

A good release description includes the major features, important fixes, known limitations, and upgrade instructions when needed. For libraries and applications, users should be able to understand whether the release contains breaking changes.

Use semantic versioning when it fits the project: `MAJOR.MINOR.PATCH`. Broadly, major versions indicate incompatible API changes, minor versions introduce backward-compatible functionality, and patch versions contain backward-compatible fixes. Always document your project's versioning policy.

### Workshop: Recover from a Mistake

Create a repository with a README and an application file. Commit the initial version, then make a second commit that introduces a deliberate documentation or code change.

Practice unstaging a file and restoring an unstaged change in a disposable repository. Then create another commit and use `git revert` to reverse it.

```bash
git log --oneline
git revert <commit-hash>
git log --oneline
```

Next, create a temporary branch, make a commit, and use the reflog to inspect recent reference movements. If you need to demonstrate recovery, create a recovery branch from a known commit.

Finally, create an annotated release tag:

```bash
git tag -a v1.0.0 -m "First stable learning release"
git show v1.0.0
```

**Expected outcome:** You can distinguish between restoring files, unstaging changes, resetting history, reverting commits, using reflog, and creating release tags.

### Checkpoint: Git Recovery and Releases Quiz

1. What is the difference between `git restore` and `git revert`?
2. What happens with `git reset --soft`?
3. Why can `git reset --hard` be dangerous?
4. When is `git revert` a better choice than reset?
5. What information does `git reflog` provide?
6. How do you stash changes that include untracked files?
7. What is the difference between a lightweight and an annotated tag?
8. How do you push a tag to GitHub?
9. What is the relationship between a Git tag and a GitHub release?
10. Why should secrets be rotated even after a commit containing them is reverted?

Practical challenge: Revert a commit safely, recover a reference in a disposable repository, and publish a version tag.

# Module 6: Advanced Git Workflows, GitHub Issues, and Automation

## Chapter 1: Advanced History and Repository Techniques

### Lesson: Understanding HEAD and Revision References

`HEAD` identifies the current checkout position, usually the latest commit on the current branch. Git provides revision syntax that lets you refer to earlier commits without copying their full identifiers.

Common references include:

- `HEAD`: The current checkout.
- `HEAD~1`: The first parent of the current commit.
- `HEAD~3`: Three first-parent steps back.
- `HEAD^`: The first parent of the current commit.
- `branch-name`: The commit referenced by a branch.
- `origin/main`: The local remote-tracking reference for the remote's main branch.

Inspect a revision with:

```bash
git show HEAD
git show HEAD~1
git log --oneline --graph --all
```

In histories containing merge commits, parent relationships matter. `HEAD~2` follows the first-parent chain twice, while `HEAD^2` refers to the second parent of a merge commit when one exists.

Understanding these references makes it easier to compare commits, select a reset target, inspect historical files, and understand Git commands in professional workflows.

Always verify the selected commit before running commands that rewrite history or discard work.

### Lesson: Interactive Rebase and Squashing Commits

Interactive rebase allows you to review and reorganize a series of commits. It is useful for cleaning up unpublished feature work before sharing it.

```bash
git rebase -i HEAD~3
```

Git opens an editor with a list of commits. The available actions commonly include `pick`, `reword`, `edit`, `squash`, and `fixup`.

- `pick` keeps a commit.
- `reword` changes its message.
- `edit` pauses to allow modification of a commit.
- `squash` combines a commit with the previous one and allows message editing.
- `fixup` combines a commit with the previous one while discarding the fixup commit's message.

The exact list and available options depend on Git's version and configuration.

Interactive rebase can make a feature branch easier to review by combining temporary correction commits and improving commit messages. However, it rewrites commit history and changes commit identifiers.

Use it mainly for your own unpublished work. If the commits are already shared, coordinate with collaborators and follow the project's policy before rewriting history.

### Lesson: Cherry-Picking Commits

Cherry-picking applies the changes introduced by an existing commit onto the current branch by creating a new commit.

```bash
git switch release-fix
git cherry-pick <commit-hash>
```

This is useful when a specific bug fix needs to be applied to another branch without merging all the work from the original branch.

Cherry-picking does not move the original commit to the new branch. It creates a new commit with equivalent changes when the operation succeeds, so the two commits normally have different identities.

If conflicts occur, resolve the files and stage the resolutions. Then continue:

```bash
git add <resolved-file>
git cherry-pick --continue
```

To cancel an in-progress cherry-pick:

```bash
git cherry-pick --abort
```

Use cherry-picking carefully when commits depend on other changes. A fix may not work correctly if the destination branch lacks supporting code or configuration.

## Chapter 2: Issues, Projects, and Team Planning

### Lesson: Managing Work with GitHub Issues

GitHub Issues help teams track bugs, enhancements, tasks, and questions. An issue should describe the problem or desired outcome clearly enough that someone can understand what needs to be done.

A useful bug report often includes:

- A concise title.
- Steps to reproduce the problem.
- Expected behavior.
- Actual behavior.
- Relevant logs or screenshots.
- Environment details, where appropriate.

Feature requests should explain the user problem and the expected result rather than prescribing an implementation without context.

Labels help categorize issues by type, priority, area, or status. Assignees clarify responsibility, and milestones can group work toward a release.

Avoid including credentials, personal information, or confidential data in public issues. Use a private reporting process for security vulnerabilities.

### Lesson: Connecting Issues and Pull Requests

Issues and pull requests can reference each other, improving traceability between a problem and its implementation.

For example, a pull request description can contain:

```text
Closes #42
```

When the pull request is merged into the repository's default branch, GitHub can automatically close the referenced issue. Other keywords, such as `Fixes` and `Resolves`, can also be used according to GitHub's supported syntax.

Commit messages can include issue references to help reviewers understand the context of a change.

A useful development cycle is to create an issue, plan the solution, implement it on a feature branch, open a pull request, and close the issue when the work is merged.

This creates a clear relationship between requirements, implementation, and delivery. It is particularly useful when several developers are working on the same project.

### Lesson: Using GitHub Projects and Milestones

GitHub Projects supports planning and tracking work across issues and pull requests. Depending on the project configuration, you can use tables, boards, views, fields, and automation to organize the team's workload.

A simple workflow might include `Todo`, `In Progress`, `In Review`, and `Done`. Each issue or pull request should move through the workflow as work progresses.

Milestones group issues and pull requests associated with a particular goal, such as preparing a version release or completing a sprint.

Use planning tools to clarify priorities and ownership, not to create unnecessary administration. Small teams may need only a few labels and a straightforward board, while larger teams may require more structured workflows.

A clear project board helps team members understand what is being worked on, what is blocked, and what is ready for review.

## Chapter 3: GitHub Actions and Continuous Integration

### Lesson: Understanding CI and CD

Continuous integration, or CI, is the practice of frequently integrating code changes and validating them through automated checks. These checks may include linting, unit tests, type checking, security scanning, and builds.

Continuous delivery or deployment extends automation toward preparing or releasing software. Continuous delivery keeps software ready for release, while continuous deployment automatically releases qualifying changes to production.

GitHub Actions is a workflow automation platform integrated with GitHub. It can run workflows in response to events such as pushes, pull requests, scheduled events, or manual triggers.

A workflow is defined in a YAML file under `.github/workflows/`. A workflow contains jobs, and each job contains steps that run commands or reusable actions.

CI does not guarantee bug-free software. It provides repeatable checks that help identify problems early and supports consistent development practices.

### Lesson: Creating Your First GitHub Actions Workflow

Create the following file in your repository:

`.github/workflows/ci.yml`

```yaml
name: Basic CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Display repository information
        run: |
          echo "Repository: $GITHUB_REPOSITORY"
          echo "Branch or reference: $GITHUB_REF"
          echo "Commit: $GITHUB_SHA"

      - name: List project files
        run: ls -la
```

The `on` section defines when the workflow runs. The `jobs` section declares a job named `verify`, and `runs-on` selects a hosted Ubuntu runner.

The checkout action downloads the repository content into the runner's workspace. The subsequent steps execute shell commands in that environment.

This starter workflow demonstrates automation, but it does not test application correctness. A real project should add appropriate build, lint, and test commands.

The workflow requires GitHub Actions to be enabled and repository settings to permit the selected workflow and actions.

### Lesson: Running Automated Tests in a Node.js Project

For a Node.js project, a CI workflow can install dependencies, run linting, and execute tests. The commands must match the scripts defined in `package.json`.

For example, a project might define:

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run",
    "build": "vite build"
  }
}
```

If the project uses these scripts and a supported Node.js version, a workflow could look like this:

```yaml
name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
```

This example assumes the repository contains a compatible lockfile, the named scripts, and the necessary dependencies. If the project uses a different framework or package manager, adapt the workflow accordingly.

Pull request checks can help prevent broken changes from being merged when branch rules require those checks. Keep the workflow minimal at first, then add coverage, multiple Node.js versions, or other checks as needed.

### Lesson: Managing Secrets and Workflow Permissions

CI workflows sometimes need credentials to access private services or deploy an application. Store sensitive values in GitHub Actions secrets or appropriate environment-level secret stores instead of hard-coding them into YAML files.

A secret can be referenced in a workflow expression:

```yaml
env:
  API_TOKEN: ${{ secrets.API_TOKEN }}
```

This is only an example of referencing a configured secret. The secret must be created in the appropriate repository, organization, or environment settings, and the application must use it securely.

Do not print secrets in logs, write them into build artifacts, or expose them to untrusted pull request code. Masking helps reduce accidental disclosure but is not a complete security boundary.

Use least-privilege workflow permissions. A workflow that only reads repository content generally should not receive unnecessary write permissions.

Be especially cautious with workflows triggered by pull requests from forks, deployment credentials, third-party actions, and privileged events. Pin actions according to your organization's security policy, and review action maintainers and permissions before adopting them.

## Chapter 4: GitHub Collaboration at Scale

### Lesson: Code Owners and Required Reviews

A `CODEOWNERS` file can identify teams or individuals responsible for reviewing changes to particular parts of a repository. GitHub can use these rules to request reviews when matching files are changed.

For example, a repository may assign frontend files to a frontend team and workflow configuration to a DevOps team.

Code ownership is useful in larger projects because reviewers can focus on the areas they understand best. It also makes responsibilities more explicit.

Combine ownership rules with branch protection or repository rulesets when you want certain approvals to be required before merging.

Keep ownership rules up to date. An outdated file can request reviews from people who no longer maintain the code or fail to include the correct specialists.

### Lesson: Using Release Branches and Hotfixes

Some teams release directly from `main`, while others maintain release branches. A release branch can be useful when a version needs stabilization while new features continue in the main development line.

A hotfix branch is created to address an urgent issue in a released version. After testing, the fix is integrated into the appropriate release branch and also brought into the main development line when necessary.

The exact workflow depends on the project's release policy. Avoid creating many long-lived branches without a clear purpose, because they increase the effort required to synchronize changes.

Use pull requests, tests, release notes, and tags to document the process. For production systems, also define rollback procedures and establish who can approve or execute a release.

### Workshop: Build a CI-Enabled GitHub Repository

Create or reuse a small Node.js project with a README, application code, and tests. Ensure the project has the scripts needed by its workflow.

Add a CI workflow under `.github/workflows/ci.yml`. Begin with repository checkout and basic verification, then add dependency installation, linting, testing, and building if your project supports them.

Commit the workflow on a feature branch and open a pull request.

```bash
git switch -c feature/add-ci
git add .github/workflows/ci.yml
git commit -m "Add continuous integration workflow"
git push -u origin feature/add-ci
```

Open the pull request and inspect the workflow checks in GitHub. If a check fails, read the logs and determine whether the issue comes from the workflow configuration, environment, dependencies, or application code.

Update the workflow or project as necessary. Confirm that required checks pass before merging.

**Expected outcome:** You can create a workflow, understand its triggers and jobs, inspect failed runs, and explain why automated checks are useful in code review.

### Checkpoint: Advanced Git and Automation Assessment

1. What does `HEAD~1` represent?
2. What is interactive rebase used for?
3. When is cherry-picking appropriate?
4. How do issues, pull requests, and milestones work together?
5. What is continuous integration?
6. Where are GitHub Actions workflows stored?
7. What is the difference between a workflow, a job, and a step?
8. Why should CI workflows use least-privilege permissions?
9. How should credentials be handled in GitHub Actions?
10. What purpose does a `CODEOWNERS` file serve?
11. Why might a team use release branches?
12. How should a developer investigate a failed CI run?

Practical challenge: Add CI to a project, open a pull request, resolve a failing check, and document the successful workflow run.

# Module 7: Professional Git Workflow and Final Project

## Chapter 1: Planning and Structuring a Professional Repository

### Lesson: Designing a Repository for Maintainability

A professional repository should help developers understand what the project does, how to run it, how to test it, and how to contribute.

A typical web application repository might contain:

```text
my-web-project/
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
├── tests/
├── public/
├── .gitignore
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

The structure depends on the framework and project size. Do not create empty folders or unnecessary documentation merely to match an example.

The README should explain the purpose, features, prerequisites, installation, development commands, testing, and configuration. The `.env.example` file should document required environment variable names using safe placeholder values.

A `CONTRIBUTING.md` file can explain branch naming, commit conventions, testing expectations, and the pull request process. A license explains the terms under which others may use the project; choose a license deliberately rather than assuming that public visibility grants unrestricted permission.

### Lesson: Choosing a Team Branching Strategy

A branching strategy defines how work moves from development to release. Common approaches include short-lived feature branches, trunk-based development, and Git Flow-style long-lived branches.

Short-lived feature branches work well when developers open small pull requests frequently. Trunk-based development emphasizes integrating small changes often, supported by automated tests and other safeguards.

Git Flow-style approaches can suit projects with formal release cycles, but they add branching and synchronization complexity. The best strategy depends on release frequency, team size, testing quality, and deployment requirements.

Regardless of strategy, establish clear expectations for branch names, commit messages, reviews, test coverage, conflict resolution, and release tagging.

The purpose of a branching strategy is not to create more branches. It is to make collaboration predictable and protect the quality of the codebase.

### Lesson: Writing Useful Documentation and Contribution Guidelines

Documentation is part of the product. A repository should provide enough information for a new developer to understand and run it without relying entirely on its author.

Include installation instructions, required software versions, environment setup, commands for development and testing, and common troubleshooting notes.

Contribution guidelines should explain how to report bugs, propose changes, create branches, run tests, and open pull requests. They should also describe any commit conventions and review requirements.

Keep documentation aligned with the actual implementation. If a command changes, update the README and contribution guide in the same pull request whenever possible.

For a public project, clear documentation reduces repeated questions and helps external contributors participate effectively.

## Chapter 2: Security and Reliability in Git Workflows

### Lesson: Preventing Secret Exposure

Secrets include passwords, API tokens, private keys, database credentials, and production connection strings. Committing a secret can expose it to anyone with access to the repository and potentially to copied history or external systems.

Use environment variables or an appropriate secret-management service for local development and deployment. Commit only a safe `.env.example` file containing placeholder values.

A `.gitignore` file can prevent untracked environment files from being added accidentally, but it does not protect secrets already tracked or committed.

If a secret is exposed, immediately revoke or rotate it, assess what systems it could access, and review relevant logs. Remove it from repository history when appropriate, but remember that history rewriting does not guarantee every copy has disappeared.

Use secret scanning and security checks where available. Treat prevention, detection, revocation, and incident response as separate parts of a secure workflow.

### Lesson: Using Signed Commits and Verifying Changes

Signed commits can provide evidence that a commit was created using a signing key associated with a developer or automation identity. Git supports signing with several methods, including GPG and SSH, depending on configuration.

Signing is especially relevant for teams with compliance or provenance requirements. A signature is useful only when verification and trust are configured appropriately; it does not prove that the code is correct or safe.

Code reviews, tests, dependency checks, and access controls remain essential. Review a commit's author, message, diff, and relevant test results before integrating it into an important branch.

Teams should document signing requirements and help developers configure their signing keys securely. Private signing keys must remain private, just like other credentials.

### Lesson: Using Git Hooks

Git hooks are scripts that run at particular points in Git operations. They can support local checks such as formatting, linting, or commit-message validation.

Hooks live in the repository's Git hooks directory, often `.git/hooks` by default. Many hooks are provided as sample files that must be enabled or configured before they run.

A pre-commit hook might run a formatter or lint check. A commit-message hook might validate a project's commit convention.

Local hooks improve feedback speed but are not sufficient enforcement by themselves because developers can bypass or lack the same local configuration. Critical requirements should also run in CI and be enforced through repository settings where possible.

Keep hooks fast and focused. Expensive checks are usually better suited to a dedicated CI workflow.

## Chapter 3: Final Hands-on Project Workshop

### Workshop: Build a Professional Team Repository

Create a small but complete web application repository that demonstrates the Git and GitHub skills covered throughout the course. You may use a simple task manager, learning journal, weather dashboard, or another project approved by your instructor.

The application should include meaningful functionality, a README, a `.gitignore`, an `.env.example` if configuration is required, and automated checks appropriate for the project. Choose a scope that can be implemented, tested, and reviewed within the available course time.

Create a GitHub repository and organize the work into issues. Define a short task list covering the initial setup, core functionality, documentation, testing, and CI configuration.

Use feature branches for individual tasks and create focused commits. For example:

```bash
git switch -c feature/task-list
git add src tests
git commit -m "feat: add task list functionality"
git push -u origin feature/task-list
```

The directory names are illustrative. Adjust the paths and commands to match your application.

Open pull requests for the features, describe the changes, and review the diffs. If working in a team, assign tasks and review another contributor's work. Resolve conflicts through deliberate editing and testing rather than blindly choosing one side.

Add a GitHub Actions workflow to run the project's available checks. Fix failures before merging. Use issues and pull request references to connect implementation work to the planned tasks.

When the application is stable, create a version tag and prepare release notes. Verify the final repository history and ensure that no secrets, generated dependencies, or unnecessary build artifacts have been committed.

Your final submission should include the repository URL, project description, setup instructions, evidence of CI execution, a summary of pull requests, and a short explanation of the branching and release strategy.

### Lesson: Final Project Review and Technical Presentation

Prepare a brief presentation explaining the problem your application solves, its main features, and the decisions you made during development.

Demonstrate the repository history and explain how your commits communicate changes. Show the branches or pull requests that were used to develop the features and describe how code review improved the result.

Open the GitHub Actions workflow and explain what triggers it, which checks it performs, and how the team responds to a failure. If your project has no automated tests, identify this limitation and explain what tests you would add next.

Discuss one mistake or integration problem you encountered and how you resolved it. You might demonstrate restoring an unstaged change, reverting a commit, resolving a merge conflict, or recovering a reference in a disposable repository.

Finally, explain how the project could be maintained after the course. Consider documentation, issue tracking, dependency updates, security practices, and future releases.

The goal is not simply to show a working application. It is to demonstrate that you can manage the project's history, collaborate professionally, and deliver changes through a reliable workflow.

### Checkpoint: Final Git and GitHub Assessment

Complete this assessment independently or as part of a team.

**Part 1: Git fundamentals**

1. Explain the difference between the working directory, staging area, and repository history.
2. Create a repository and make at least three meaningful commits.
3. Inspect unstaged and staged differences.
4. Explain the purpose of `.gitignore`.

**Part 2: Branching and collaboration**

5. Create a feature branch and merge its changes into the main branch through a pull request.
6. Demonstrate a merge conflict and explain how you resolved it.
7. Explain when you would choose merge, rebase, or cherry-pick.
8. Describe how issues and pull requests improve traceability.

**Part 3: Recovery and release management**

9. Unstage a file without deleting its local changes.
10. Revert an appropriate commit in a safe test repository.
11. Explain how reflog can help recover a lost branch reference.
12. Create an annotated version tag and explain how it relates to a GitHub release.

**Part 4: Automation and security**

13. Add a GitHub Actions workflow that runs appropriate project checks.
14. Diagnose and fix a failing workflow run.
15. Explain how you would protect credentials and configure least-privilege workflow permissions.

**Part 5: Professional delivery**

16. Present a working project with a useful README and clear setup instructions.
17. Demonstrate your commit history, pull requests, and CI checks.
18. Explain one technical decision, one challenge, and one improvement you would make next.

Submit the repository link and a concise report documenting the implementation, collaboration workflow, automated checks, and release process.

## Chapter 4: Professional Git Workflow Reference

### Lesson: Daily Git Workflow Checklist

A reliable daily workflow reduces accidental changes and makes your work easier for others to review.

Start by synchronizing with the project's agreed base branch. Create a focused feature branch, make small changes, and inspect the result before staging.

```bash
git status
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c feature/clear-task-name
```

This example assumes your team uses `main` as the base branch and that a fast-forward update is possible. If your team uses another integration strategy, follow its documented workflow.

As you work, stage only the intended files, inspect the staged diff, and commit with a clear message.

```bash
git status
git diff
git add <file-or-path>
git diff --staged
git commit -m "feat: describe the change"
```

Push the feature branch, open a pull request, respond to reviews, and ensure required checks pass before merging.

After merging, synchronize your local main branch and remove obsolete feature branches according to your team's policy.

### Lesson: Essential Git Command Reference

The following commands summarize frequently used operations. Replace placeholders with actual file names, branch names, URLs, or commit identifiers.

| Goal                       | Command                           |
| -------------------------- | --------------------------------- |
| Check repository status    | `git status`                      |
| Initialize a repository    | `git init`                        |
| Clone a repository         | `git clone <url>`                 |
| Stage a file               | `git add <file>`                  |
| Inspect unstaged changes   | `git diff`                        |
| Inspect staged changes     | `git diff --staged`               |
| Create a commit            | `git commit -m "message"`         |
| View history               | `git log --oneline --graph --all` |
| Create a branch            | `git branch <name>`               |
| Switch branches            | `git switch <name>`               |
| Create and switch branches | `git switch -c <name>`            |
| Merge a branch             | `git merge <name>`                |
| Fetch remote changes       | `git fetch origin`                |
| Pull remote changes        | `git pull`                        |
| Push a branch              | `git push -u origin <branch>`     |
| List remotes               | `git remote -v`                   |
| Unstage a file             | `git restore --staged <file>`     |
| Restore unstaged changes   | `git restore <file>`              |
| Revert a commit            | `git revert <commit>`             |
| List stashes               | `git stash list`                  |
| Create an annotated tag    | `git tag -a <tag> -m "message"`   |
| Push a tag                 | `git push origin <tag>`           |

Do not memorize commands without understanding their effects. In particular, commands that discard changes, rewrite history, or overwrite remote references require extra caution.

### Lesson: Continuing Your Git and GitHub Learning Journey

After completing the course, deepen your knowledge by practicing with real repositories and reading the official documentation.

Useful resources include:

- Git documentation: https://git-scm.com/doc
- Pro Git book: https://git-scm.com/book/en/v2
- GitHub Skills: https://skills.github.com/
- GitHub documentation: https://docs.github.com/
- GitHub Actions documentation: https://docs.github.com/en/actions

Choose a public project with beginner-friendly contribution guidelines, read its documentation, and investigate its issue tracker before making a contribution. Start with a small documentation improvement or a well-defined bug fix.

As your experience grows, explore advanced topics such as submodules, worktrees, bisecting regressions, repository maintenance, release automation, and more sophisticated CI/CD pipelines.

The most important long-term skill is understanding the state of your repository before acting. Inspect changes, preserve important work, communicate clearly, and make each commit or pull request easy to understand.
