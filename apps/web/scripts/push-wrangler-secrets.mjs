#!/usr/bin/env node
// oxlint-disable import/no-nodejs-modules

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_CONFIG_FILE = 'wrangler.jsonc'
const DEV_FILE_CANDIDATES = ['.dev.vars.development']
const PROD_FILE_CANDIDATES = ['.dev.vars.production']
const NON_SECRET_KEYS = new Set([
  'NODE_ENV',
  'AXIOM_DATASET',
  'STORAGE_PROVIDER_ORDER',
  'TRYON_PROVIDER_ORDER',
])
const NON_SECRET_PREFIXES = ['LOG_', 'PUBLIC_', 'R2_', 'VITE_']

const handlers = {
  '--config': (args, next) => {
    args.config = next
    return 2
  },
  '--dev-file': (args, next) => {
    args.devFile = next
    return 2
  },
  '--dry-run': (args) => {
    args.dryRun = true
    return 1
  },
  '--env': (args, next) => {
    args.env = next
    return 2
  },
  '--help': (args) => {
    args.help = true
    return 1
  },
  '--prod-file': (args, next) => {
    args.prodFile = next
    return 2
  },
  '-h': (args) => {
    args.help = true
    return 1
  },
}

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG_FILE,
    devFile: null,
    dryRun: false,
    env: 'both',
    prodFile: null,
  }

  let i = 0
  while (i < argv.length) {
    const token = argv[i]
    const handler = handlers[token]

    if (handler) {
      i += handler(args, argv[i + 1])
    } else {
      throw new Error(`Unknown argument: ${token}`)
    }
  }

  if (!['development', 'production', 'both'].includes(args.env)) {
    throw new Error('--env must be one of: development | production | both')
  }

  return args
}

function resolveFirstExistingFile(candidates, cwd) {
  for (const candidate of candidates) {
    const absolute = resolve(cwd, candidate)
    if (existsSync(absolute)) {
      return absolute
    }
  }
  return null
}

function parseLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  const normalized = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed
  const eqIndex = normalized.indexOf('=')
  if (eqIndex <= 0) {
    return null
  }

  const key = normalized.slice(0, eqIndex).trim()
  let value = normalized.slice(eqIndex + 1)

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  if (!key || !value) {
    return null
  }

  if (NON_SECRET_KEYS.has(key) || NON_SECRET_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return null
  }

  return { key, value }
}

function parseSecretsFile(filePath) {
  const text = readFileSync(filePath, 'utf8')
  const lines = text.split(/\r?\n/)
  const secrets = []

  for (const line of lines) {
    const secret = parseLine(line)
    if (secret) {
      secrets.push(secret)
    }
  }

  return secrets
}

function pushSecret({ configFile, dryRun, env, key, value }) {
  if (dryRun) {
    return { ok: true, status: 0, stderr: '', stdout: '' }
  }

  return spawnSync(
    'npx',
    ['wrangler', 'secret', 'put', key, '--config', configFile, '--env', env],
    {
      encoding: 'utf8',
      input: `${value}\n`,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
}

function printHelp() {
  process.stdout.write(
    [
      'Push local secret files to Wrangler environments.',
      '',
      'Usage:',
      '  node ./scripts/push-wrangler-secrets.mjs [options]',
      '',
      'Options:',
      '  --env development|production|both   Target environment(s). Default: both',
      '  --dev-file <path>                   Override development secrets file',
      '  --prod-file <path>                  Override production secrets file',
      '  --config <path>                     Wrangler config path. Default: wrangler.jsonc',
      '  --dry-run                           Do not call wrangler, just print keys',
      '  --help                              Show this help',
      '',
      'Non-secret keys are ignored automatically (LOG_*, R2_*, NODE_ENV, AXIOM_DATASET, VITE_*, PUBLIC_*).',
      '',
      'Default file lookup:',
      `  development: ${DEV_FILE_CANDIDATES.join(' -> ')}`,
      `  production: ${PROD_FILE_CANDIDATES.join(' -> ')}`,
      '',
    ].join('\n'),
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const cwd = process.cwd()
  const configFile = resolve(cwd, args.config)
  const targets = []

  if (args.env === 'development' || args.env === 'both') {
    const file = args.devFile
      ? resolve(cwd, args.devFile)
      : resolveFirstExistingFile(DEV_FILE_CANDIDATES, cwd)
    if (!file) {
      process.stderr.write(
        `No development file found. Looked for: ${DEV_FILE_CANDIDATES.join(', ')}\n`,
      )
      process.exitCode = 1
      return
    }
    targets.push({ env: 'development', file })
  }

  if (args.env === 'production' || args.env === 'both') {
    const file = args.prodFile
      ? resolve(cwd, args.prodFile)
      : resolveFirstExistingFile(PROD_FILE_CANDIDATES, cwd)
    if (!file) {
      process.stderr.write(
        `No production file found. Looked for: ${PROD_FILE_CANDIDATES.join(', ')}\n`,
      )
      process.exitCode = 1
      return
    }
    targets.push({ env: 'production', file })
  }

  for (const target of targets) {
    const secrets = parseSecretsFile(target.file)
    process.stdout.write(
      `\n[secrets] ${target.env}: ${secrets.length} key(s) from ${target.file}\n`,
    )

    for (const { key, value } of secrets) {
      process.stdout.write(` - ${key}${args.dryRun ? ' (dry-run)' : ''}\n`)
      const result = pushSecret({
        configFile,
        dryRun: args.dryRun,
        env: target.env,
        key,
        value,
      })

      if (result.status !== 0) {
        process.stderr.write(
          `Failed to push secret "${key}" to ${target.env}\n${result.stderr || result.stdout}\n`,
        )
        process.exitCode = 1
        return
      }
    }
  }

  process.stdout.write('\nDone.\n')
}

try {
  main()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
