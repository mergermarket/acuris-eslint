# <@acuris/eslint-config>

@acuris/eslint-config

Shared Acuris eslint configuration and code quality tooling.

# initialize your project

The simplest and preferred way to initialise your project is to run in your project folder this command:

```sh
npx @acuris/eslint-config@latest --init
```

This will start an interactive initialisation script that will setup everything you need, including packages installation.

## if you install new packages after initializing a project (for example, jest or typescript), you may want to run `acuris-eslint --init` again to add additional dependencies.

# update @acuris/eslint-config

Once installed, you can update to the latest version (including dependencies) executing

```sh
acuris-eslint --update
```

# lint your entire project

You can lint your entire project running

```sh
acuris-eslint
```

You can fix the formatting for your entire project running

```sh
acuris-eslint --fix
```

You can also pass glob paths, folders or sinngle files to lint.

```sh
acuris-eslint hello.js myFolder
```

For mor help on the list of available options and commands, run

```sh
acuris-eslint --help
```

Note: If PATH does not resolve node binaries in node_modules/.bin, you can prepend all commands with `npx`.

# project configuration

You can add `acuris-eslint` in package.json root to pass additional options.

```ts
{
  name: 'my-package',

  // ...

  "acuris-eslint": {
    /**
     * Override patterns used to apply different eslint rules.
     */
    filePatterns: {
      /** mjs module patterns */
      mjs: string[] | { [pattern: string]: boolean },

      /** .ts, .tsx patterns */
      typescript: string[] | { [pattern: string]: boolean },

      /** .d.ts patterns */
      typescriptDefinition: string[] | { [pattern: string]: boolean },

      /** binary script patterns */
      bin: string[] | { [pattern: string]: boolean },

      /** scripts pattern, similar to bin*/
      scripts: string[] | { [pattern: string]: boolean },

      /** server side code patterns */
      server: string[] | { [pattern: string]: boolean },

      /** dist folder patterns (less stringent rules) */
      dist: string[] | { [pattern: string]: boolean },

      /** test files patterns */
      tests: string[] | { [pattern: string]: boolean }
    },

    /**
     * The path of the eslintrc file to load when running acuris-eslint command
     * Can be overridden by command line option '--config'
     */
    eslintrc: string,
    /**
     * Enables or disable eslint cache when running acuris-eslint command.
     * Can be overridden by command line option '--cache' or '--no-cache'
     */
    eslintCache: boolean,
    /**
     * Changes the path of eslint cache when running acuris-eslint command.
     * By default is `.eslintcache`
     * Can be overridden by command line option '--cache-location'
     */
    eslintCacheLocation: string,
    /**
     * The warnigns and errors output format when running acuris-eslint command.
     * By default is `stylish`.
     * Can be overridden by command line option '--format'
     */
    eslintOutputFormat: string,

    /**
     * The react version to use for react eslint plugin.
     */
    reactVersion: string,

    /**
     * A custom path for the `tsconfig.json` configuration when using typescript.
     * By default, the first tsconfig.json in the current folder or parent folders is used.
     */
    tsConfigPath: string,

    /**
     * The list of packages to disable when initializing a project or running eslint.
     * For example, ['typescript', 'react', 'eslint-plugin-jsx-a11y'] disables typescript, react and jsx-a11y.
     *
     */
    ignoredPackages: string[] | { [packageName: string]: boolean },

    /**
      * Additional node_modules paths to use when resolving eslint plugins or configurations.
      */
    nodeResolvePaths: string[] | { [path: string]: boolean },

    /**
     * Additional extensions to use when running acuris-eslint command.
     * Useful, for example, when adding a new plugin that manages a new file type.
     */
    extensions: string[] | { [extension: string]: boolean }
  }
}
```
