#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SUPPORTED_LANGUAGES = new Set([
  'typescript',
  'dart',
  'python',
  'java',
  'kotlin',
  'go',
  'rust',
  'swift',
  'flutter',
  'csharp',
  'php',
  'ruby',
]);

const marker = '[sdk-publish]';

function log(message) {
  console.log(marker + ' ' + message);
}

function fail(message) {
  console.error(marker + ' ERROR: ' + message);
  process.exit(1);
}

function isTrue(input) {
  if (typeof input !== 'string') {
    return false;
  }
  const normalized = input.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function quoteArg(arg) {
  return /\s/.test(arg) ? '"' + arg.replace(/"/g, '\\"') + '"' : arg;
}

function run(command, args, options = {}) {
  const cwd = options.cwd || process.cwd();
  const env = options.env || process.env;
  const commandLine = [command, ...(args || [])].map(quoteArg).join(' ');
  log('> ' + commandLine + ' (cwd=' + cwd + ')');
  const result = spawnSync(command, args || [], {
    cwd,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) {
    fail('Failed to execute command "' + command + '": ' + result.error.message);
  }
  if ((result.status ?? 1) !== 0) {
    fail('Command failed (' + result.status + '): ' + commandLine);
  }
}

function capture(command, args, cwd) {
  const result = spawnSync(command, args || [], {
    cwd: cwd || process.cwd(),
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  if (result.error || (result.status ?? 1) !== 0) {
    const stderr = (result.stderr || '').toString().trim();
    fail('Command failed while reading output: ' + command + ' ' + (args || []).join(' ') + (stderr ? '\n' + stderr : ''));
  }
  return (result.stdout || '').toString().trim();
}

function parseArgs(argv) {
  const parsed = {
    language: '',
    projectDir: process.cwd(),
    action: 'publish',
    channel: 'release',
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current === '--language') {
      parsed.language = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (current === '--project-dir') {
      parsed.projectDir = argv[i + 1] || parsed.projectDir;
      i += 1;
      continue;
    }
    if (current === '--action') {
      parsed.action = (argv[i + 1] || parsed.action).toLowerCase();
      i += 1;
      continue;
    }
    if (current === '--channel') {
      parsed.channel = (argv[i + 1] || parsed.channel).toLowerCase();
      i += 1;
      continue;
    }
    if (current === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (current === '--help' || current === '-h') {
      printHelp();
      process.exit(0);
    }
    fail('Unknown argument: ' + current);
  }

  if (!parsed.language) {
    fail('Missing required argument: --language');
  }
  if (!SUPPORTED_LANGUAGES.has(parsed.language)) {
    fail('Unsupported language: ' + parsed.language + '. Supported: ' + Array.from(SUPPORTED_LANGUAGES).join(', '));
  }
  if (!existsSync(parsed.projectDir)) {
    fail('Project directory does not exist: ' + parsed.projectDir);
  }
  const allowedActions = new Set(['check', 'build', 'publish']);
  if (!allowedActions.has(parsed.action)) {
    fail('Unsupported action: ' + parsed.action + '. Allowed: check, build, publish');
  }
  const allowedChannels = new Set(['release', 'test']);
  if (!allowedChannels.has(parsed.channel)) {
    fail('Unsupported channel: ' + parsed.channel + '. Allowed: release, test');
  }

  parsed.projectDir = path.resolve(parsed.projectDir);
  return parsed;
}

function printHelp() {
  console.log('SDKWork publish helper');
  console.log('');
  console.log('Usage:');
  console.log('  node bin/publish-core.mjs --language <lang> --project-dir <dir> [--action publish] [--channel release] [--dry-run]');
  console.log('');
  console.log('Actions: check | build | publish');
  console.log('Channel: release | test');
  console.log('');
  console.log('Common environment variables:');
  console.log('  NPM_REGISTRY_URL, NPM_TOKEN');
  console.log('  PYPI_TOKEN, PYPI_REPOSITORY_URL, TEST_PYPI_TOKEN, TEST_PYPI_REPOSITORY_URL');
  console.log('  MAVEN_PUBLISH_PROFILE, MAVEN_RELEASE_PROFILE, MAVEN_TEST_PROFILE, MAVEN_SETTINGS');
  console.log('  GRADLE_PUBLISH_TASK');
  console.log('  CARGO_REGISTRY_TOKEN');
  console.log('  NUGET_API_KEY, NUGET_TEST_API_KEY, NUGET_SOURCE');
  console.log('  PHP_RELEASE_TAG, PHP_PUSH_TAG, COMPOSER_BIN');
  console.log('  GEM_HOST_API_KEY, RUBYGEMS_API_KEY, RUBYGEMS_HOST');
  console.log('  SDKWORK_RELEASE_TAG, SDKWORK_PUSH_TAG');
}

function ensureFile(filePath, friendlyName) {
  if (!existsSync(filePath)) {
    fail((friendlyName || filePath) + ' not found at: ' + filePath);
  }
}

function loadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    fail('Invalid JSON file: ' + filePath + '\n' + error.message);
  }
}

function resolvePythonCommand() {
  const preferred = process.env.PYTHON_BIN || '';
  const candidates = preferred ? [preferred] : ['python3', 'python'];
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: false });
    if ((probe.status ?? 1) === 0) {
      return candidate;
    }
  }
  fail('Python runtime not found. Set PYTHON_BIN or install python3/python.');
}

function resolveMavenCommand(projectDir) {
  const mvnw = path.join(projectDir, 'mvnw');
  const mvnwCmd = path.join(projectDir, 'mvnw.cmd');
  if (process.platform === 'win32' && existsSync(mvnwCmd)) {
    return 'mvnw.cmd';
  }
  if (process.platform !== 'win32' && existsSync(mvnw)) {
    return './mvnw';
  }
  return process.env.MAVEN_BIN || 'mvn';
}

function resolveGradleCommand(projectDir) {
  const gradlew = path.join(projectDir, 'gradlew');
  const gradlewBat = path.join(projectDir, 'gradlew.bat');
  if (process.platform === 'win32' && existsSync(gradlewBat)) {
    return 'gradlew.bat';
  }
  if (process.platform !== 'win32' && existsSync(gradlew)) {
    return './gradlew';
  }
  return process.env.GRADLE_BIN || 'gradle';
}

function resolveComposerCommand(projectDir) {
  const preferred = process.env.COMPOSER_BIN || '';
  if (preferred) {
    return preferred;
  }

  const composerPhar = path.join(projectDir, 'composer.phar');
  if (existsSync(composerPhar)) {
    return process.platform === 'win32' ? 'php composer.phar' : 'php ./composer.phar';
  }

  return 'composer';
}

function runTypeScript(ctx) {
  const packageFile = path.join(ctx.projectDir, 'package.json');
  ensureFile(packageFile, 'package.json');
  const packageJson = loadJson(packageFile);
  const hasBuildScript = Boolean(packageJson?.scripts?.build);

  if (ctx.action === 'check') {
    run('npm', ['pack', '--dry-run'], { cwd: ctx.projectDir });
    return;
  }

  run('npm', ['install'], { cwd: ctx.projectDir });
  if (hasBuildScript) {
    run('npm', ['run', 'build'], { cwd: ctx.projectDir });
  } else {
    log('No build script found in package.json, skipping build.');
  }

  if (ctx.action === 'build') {
    return;
  }

  const registry = process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org/';
  const args = ['publish', '--access', 'public', '--registry', registry];
  if (ctx.channel === 'test') {
    args.push('--tag', 'next');
  }
  if (ctx.dryRun) {
    args.push('--dry-run');
  }
  run('npm', args, { cwd: ctx.projectDir });
}

function runDart(ctx) {
  const pubspec = path.join(ctx.projectDir, 'pubspec.yaml');
  ensureFile(pubspec, 'pubspec.yaml');

  run('dart', ['pub', 'get'], { cwd: ctx.projectDir });

  if (ctx.action === 'check' || ctx.action === 'build') {
    run('dart', ['analyze'], { cwd: ctx.projectDir });
    return;
  }

  run('dart', ['pub', 'publish', '--dry-run'], { cwd: ctx.projectDir });

  if (ctx.dryRun) {
    return;
  }

  if (ctx.channel === 'test') {
    log('Dart test channel requested, but pub.dev has no dedicated test registry. Publishing to default registry.');
  }
  run('dart', ['pub', 'publish', '--force'], { cwd: ctx.projectDir });
}

function runPython(ctx) {
  const pyproject = path.join(ctx.projectDir, 'pyproject.toml');
  ensureFile(pyproject, 'pyproject.toml');
  const python = resolvePythonCommand();
  const distDir = path.join(ctx.projectDir, 'dist');

  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }

  run(python, ['-m', 'build'], { cwd: ctx.projectDir });

  const artifacts = existsSync(distDir)
    ? readdirSync(distDir).map((name) => path.join('dist', name))
    : [];
  if (artifacts.length === 0) {
    fail('No built artifacts found under dist/.');
  }

  if (ctx.action === 'check' || ctx.action === 'build') {
    run(python, ['-m', 'twine', 'check', ...artifacts], { cwd: ctx.projectDir });
    return;
  }

  if (ctx.dryRun) {
    run(python, ['-m', 'twine', 'check', ...artifacts], { cwd: ctx.projectDir });
    return;
  }

  const releaseUrl = process.env.PYPI_REPOSITORY_URL || 'https://upload.pypi.org/legacy/';
  const testUrl = process.env.TEST_PYPI_REPOSITORY_URL || 'https://test.pypi.org/legacy/';
  const repositoryUrl = ctx.channel === 'test' ? testUrl : releaseUrl;
  const token = ctx.channel === 'test'
    ? (process.env.TEST_PYPI_TOKEN || process.env.PYPI_TOKEN || '')
    : (process.env.PYPI_TOKEN || '');
  if (!token) {
    fail('Missing PyPI token. Set PYPI_TOKEN (or TEST_PYPI_TOKEN for test channel).');
  }

  run(
    python,
    [
      '-m',
      'twine',
      'upload',
      '--repository-url',
      repositoryUrl,
      '--username',
      '__token__',
      '--password',
      token,
      '--skip-existing',
      ...artifacts,
    ],
    { cwd: ctx.projectDir }
  );
}

function runJava(ctx) {
  const pom = path.join(ctx.projectDir, 'pom.xml');
  ensureFile(pom, 'pom.xml');
  const mvn = resolveMavenCommand(ctx.projectDir);

  if (ctx.action === 'check' || ctx.action === 'build' || ctx.dryRun) {
    run(mvn, ['-B', '-DskipTests', 'clean', 'verify'], { cwd: ctx.projectDir });
    if (ctx.action !== 'publish') {
      return;
    }
    if (ctx.dryRun) {
      log('Dry run enabled: skipped Maven deploy.');
      return;
    }
  }

  const profile = process.env.MAVEN_PUBLISH_PROFILE
    || (ctx.channel === 'test' ? process.env.MAVEN_TEST_PROFILE : process.env.MAVEN_RELEASE_PROFILE)
    || '';

  const args = ['-B', '-DskipTests', 'clean', 'deploy'];
  if (profile) {
    args.push('-P', profile);
  }
  if (process.env.MAVEN_SETTINGS) {
    args.push('--settings', process.env.MAVEN_SETTINGS);
  }

  run(mvn, args, { cwd: ctx.projectDir });
}

function runKotlin(ctx) {
  const gradleFile = path.join(ctx.projectDir, 'build.gradle.kts');
  const gradleGroovyFile = path.join(ctx.projectDir, 'build.gradle');
  if (!existsSync(gradleFile) && !existsSync(gradleGroovyFile)) {
    fail('build.gradle(.kts) not found at: ' + ctx.projectDir);
  }
  const gradle = resolveGradleCommand(ctx.projectDir);

  if (ctx.action === 'check' || ctx.action === 'build' || ctx.dryRun) {
    run(gradle, ['clean', 'build', '-x', 'test'], { cwd: ctx.projectDir });
    if (ctx.action !== 'publish') {
      return;
    }
    if (ctx.dryRun) {
      log('Dry run enabled: skipped Gradle publish.');
      return;
    }
  }

  const publishTask = process.env.GRADLE_PUBLISH_TASK
    || (ctx.channel === 'test' ? 'publishToMavenLocal' : 'publish');
  run(gradle, [publishTask, '-x', 'test'], { cwd: ctx.projectDir });
}

function runGo(ctx) {
  const goMod = path.join(ctx.projectDir, 'go.mod');
  ensureFile(goMod, 'go.mod');

  run('go', ['test', './...'], { cwd: ctx.projectDir });
  run('go', ['vet', './...'], { cwd: ctx.projectDir });

  if (ctx.action === 'check' || ctx.action === 'build') {
    return;
  }

  const releaseTag = process.env.GO_RELEASE_TAG || process.env.SDKWORK_RELEASE_TAG || '';
  if (!releaseTag) {
    fail('Missing release tag. Set GO_RELEASE_TAG or SDKWORK_RELEASE_TAG, for example: v1.0.1');
  }

  if (ctx.dryRun) {
    log('Dry run: would create and optionally push git tag "' + releaseTag + '".');
    return;
  }

  const tagProbe = spawnSync('git', ['rev-parse', '--verify', releaseTag], {
    cwd: ctx.projectDir,
    stdio: 'ignore',
    shell: false,
  });
  if ((tagProbe.status ?? 1) !== 0) {
    run('git', ['tag', releaseTag], { cwd: ctx.projectDir });
  } else {
    log('Git tag already exists: ' + releaseTag);
  }

  if (isTrue(process.env.GO_PUSH_TAG || process.env.SDKWORK_PUSH_TAG || 'false')) {
    run('git', ['push', 'origin', releaseTag], { cwd: ctx.projectDir });
  } else {
    log('Tag push skipped. Set GO_PUSH_TAG=true (or SDKWORK_PUSH_TAG=true) to push.');
  }

  if (!isTrue(process.env.GO_WARM_PROXY || 'true')) {
    return;
  }

  const modulePath = capture('go', ['list', '-m'], ctx.projectDir);
  const goproxy = process.env.GOPROXY || 'https://proxy.golang.org';
  run('go', ['list', '-m', modulePath + '@' + releaseTag], {
    cwd: ctx.projectDir,
    env: { ...process.env, GOPROXY: goproxy },
  });
}

function runRust(ctx) {
  const cargoToml = path.join(ctx.projectDir, 'Cargo.toml');
  ensureFile(cargoToml, 'Cargo.toml');

  if (ctx.action === 'check') {
    run('cargo', ['check'], { cwd: ctx.projectDir });
    run('cargo', ['test', '--no-run'], { cwd: ctx.projectDir });
    return;
  }

  run('cargo', ['build', '--release'], { cwd: ctx.projectDir });

  if (ctx.action === 'build') {
    return;
  }

  if (ctx.channel === 'test') {
    log('Rust test channel requested, but cargo publish uses the configured registry. Proceeding with the default registry.');
  }

  const publishArgs = ['publish'];
  if (ctx.dryRun) {
    publishArgs.push('--dry-run');
  }
  run('cargo', publishArgs, { cwd: ctx.projectDir });
}

function runSwift(ctx) {
  const packageSwift = path.join(ctx.projectDir, 'Package.swift');
  ensureFile(packageSwift, 'Package.swift');

  run('swift', ['build'], { cwd: ctx.projectDir });

  if (ctx.action === 'check' || ctx.action === 'build') {
    return;
  }

  const releaseTag = process.env.SWIFT_RELEASE_TAG || process.env.SDKWORK_RELEASE_TAG || '';
  if (!releaseTag) {
    fail('Missing release tag. Set SWIFT_RELEASE_TAG or SDKWORK_RELEASE_TAG, for example: 1.0.1');
  }

  if (ctx.dryRun) {
    log('Dry run: would create and optionally push git tag "' + releaseTag + '".');
    return;
  }

  const tagProbe = spawnSync('git', ['rev-parse', '--verify', releaseTag], {
    cwd: ctx.projectDir,
    stdio: 'ignore',
    shell: false,
  });
  if ((tagProbe.status ?? 1) !== 0) {
    run('git', ['tag', releaseTag], { cwd: ctx.projectDir });
  } else {
    log('Git tag already exists: ' + releaseTag);
  }

  if (isTrue(process.env.SWIFT_PUSH_TAG || process.env.SDKWORK_PUSH_TAG || 'false')) {
    run('git', ['push', 'origin', releaseTag], { cwd: ctx.projectDir });
  } else {
    log('Tag push skipped. Set SWIFT_PUSH_TAG=true (or SDKWORK_PUSH_TAG=true) to push.');
  }
}

function runFlutter(ctx) {
  const pubspec = path.join(ctx.projectDir, 'pubspec.yaml');
  ensureFile(pubspec, 'pubspec.yaml');

  run('dart', ['pub', 'get'], { cwd: ctx.projectDir });

  if (ctx.action === 'check' || ctx.action === 'build') {
    run('dart', ['analyze'], { cwd: ctx.projectDir });
    return;
  }

  run('dart', ['pub', 'publish', '--dry-run'], { cwd: ctx.projectDir });

  if (ctx.dryRun) {
    return;
  }

  if (ctx.channel === 'test') {
    log('Flutter test channel requested, but pub.dev has no dedicated test registry. Publishing to default registry.');
  }
  run('dart', ['pub', 'publish', '--force'], { cwd: ctx.projectDir });
}

function findCsproj(projectDir) {
  const candidates = readdirSync(projectDir).filter((name) => name.toLowerCase().endsWith('.csproj'));
  if (candidates.length === 0) {
    return '';
  }
  return path.join(projectDir, candidates[0]);
}

function runCSharp(ctx) {
  const csproj = findCsproj(ctx.projectDir);
  if (!csproj) {
    fail('No .csproj file found in: ' + ctx.projectDir);
  }

  run('dotnet', ['restore', csproj], { cwd: ctx.projectDir });
  run('dotnet', ['build', csproj, '-c', 'Release'], { cwd: ctx.projectDir });

  if (ctx.action === 'check' || ctx.action === 'build') {
    return;
  }

  const outputDir = path.join(ctx.projectDir, 'nupkg');
  run('dotnet', ['pack', csproj, '-c', 'Release', '-o', outputDir], { cwd: ctx.projectDir });

  const packages = existsSync(outputDir)
    ? readdirSync(outputDir)
      .filter((name) => name.endsWith('.nupkg') && !name.endsWith('.snupkg'))
      .map((name) => path.join(outputDir, name))
    : [];
  if (packages.length === 0) {
    fail('No NuGet package generated under: ' + outputDir);
  }

  if (ctx.dryRun) {
    log('Dry run: built NuGet package(s): ' + packages.join(', '));
    return;
  }

  const source = process.env.NUGET_SOURCE
    || (ctx.channel === 'test'
      ? 'https://apiint.nugettest.org/v3/index.json'
      : 'https://api.nuget.org/v3/index.json');
  const apiKey = ctx.channel === 'test'
    ? (process.env.NUGET_TEST_API_KEY || process.env.NUGET_API_KEY || '')
    : (process.env.NUGET_API_KEY || '');
  if (!apiKey) {
    fail('Missing NuGet API key. Set NUGET_API_KEY (or NUGET_TEST_API_KEY for test channel).');
  }

  for (const pkg of packages) {
    run(
      'dotnet',
      ['nuget', 'push', pkg, '--source', source, '--api-key', apiKey, '--skip-duplicate'],
      { cwd: ctx.projectDir }
    );
  }
}

function runPhp(ctx) {
  const composerJson = path.join(ctx.projectDir, 'composer.json');
  ensureFile(composerJson, 'composer.json');

  const composer = resolveComposerCommand(ctx.projectDir);
  run(composer, ['validate', '--strict'], { cwd: ctx.projectDir });

  if (ctx.action === 'check' || ctx.action === 'build') {
    return;
  }

  const releaseTag = process.env.PHP_RELEASE_TAG || process.env.SDKWORK_RELEASE_TAG || '';
  if (!releaseTag) {
    fail('Missing release tag. Set PHP_RELEASE_TAG or SDKWORK_RELEASE_TAG, for example: 1.0.1');
  }

  if (ctx.dryRun) {
    log('Dry run: would create and optionally push git tag "' + releaseTag + '" for Composer/Packagist release.');
    return;
  }

  const tagProbe = spawnSync('git', ['rev-parse', '--verify', releaseTag], {
    cwd: ctx.projectDir,
    stdio: 'ignore',
    shell: false,
  });
  if ((tagProbe.status ?? 1) !== 0) {
    run('git', ['tag', releaseTag], { cwd: ctx.projectDir });
  } else {
    log('Git tag already exists: ' + releaseTag);
  }

  if (isTrue(process.env.PHP_PUSH_TAG || process.env.SDKWORK_PUSH_TAG || 'false')) {
    run('git', ['push', 'origin', releaseTag], { cwd: ctx.projectDir });
  } else {
    log('Tag push skipped. Set PHP_PUSH_TAG=true (or SDKWORK_PUSH_TAG=true) to push.');
  }
}

function runRuby(ctx) {
  const gemspecs = readdirSync(ctx.projectDir).filter((name) => name.toLowerCase().endsWith('.gemspec'));
  if (gemspecs.length === 0) {
    fail('No .gemspec file found in: ' + ctx.projectDir);
  }

  const gemspec = gemspecs[0];
  const pkgDir = path.join(ctx.projectDir, 'pkg');
  if (existsSync(pkgDir)) {
    rmSync(pkgDir, { recursive: true, force: true });
  }

  run('gem', ['build', gemspec], { cwd: ctx.projectDir });
  const builtGem = readdirSync(ctx.projectDir).find((name) => name.endsWith('.gem'));
  if (!builtGem) {
    fail('No built gem artifact found after gem build.');
  }

  if (ctx.action === 'check' || ctx.action === 'build') {
    return;
  }

  if (ctx.dryRun) {
    log('Dry run: built gem artifact "' + builtGem + '" and skipped push.');
    return;
  }

  const host = process.env.RUBYGEMS_HOST || 'https://rubygems.org';
  const apiKey = process.env.GEM_HOST_API_KEY || process.env.RUBYGEMS_API_KEY || '';
  if (!apiKey) {
    fail('Missing RubyGems API key. Set GEM_HOST_API_KEY or RUBYGEMS_API_KEY.');
  }

  run('gem', ['push', builtGem, '--host', host], {
    cwd: ctx.projectDir,
    env: { ...process.env, GEM_HOST_API_KEY: apiKey },
  });
}

function dispatch(ctx) {
  const handlers = {
    typescript: runTypeScript,
    dart: runDart,
    python: runPython,
    java: runJava,
    kotlin: runKotlin,
    go: runGo,
    rust: runRust,
    swift: runSwift,
    flutter: runFlutter,
    csharp: runCSharp,
    php: runPhp,
    ruby: runRuby,
  };

  const handler = handlers[ctx.language];
  if (!handler) {
    fail('No handler implemented for language: ' + ctx.language);
  }

  handler(ctx);
}

const context = parseArgs(process.argv.slice(2));
log('language=' + context.language + ', action=' + context.action + ', channel=' + context.channel + ', dryRun=' + String(context.dryRun));
dispatch(context);
log('Done.');
