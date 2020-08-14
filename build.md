## users
id: uuid
github: luin
date: Date

## subscriptions
accountType: "Personal"/"Organization"
accountId: string
plan: number
date: Date
// https://docs.github.com/en/rest/reference/apps#marketplace

## builds
repo
branch
commit
results: {
  mainVersion,
  stories,
  screenshots,
  changes,
  browsers,
  accepted,
  denied,
  unreviewed
}
date: Date
pull_request: string

## main
repo
version



Plans
1. Free for personal accounts
  screenshots: 50000/month
  browsers: Chrome
2. $25/months from all accounts
  screenshots: 500000/month
  browsers: Chrome, Firefox

2. $250/months from all accounts
  screenshots: 500000/month
  browsers: Chrome, Firefox