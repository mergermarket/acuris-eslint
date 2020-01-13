# <@acuris/eslint-config>

@acuris/eslint-config

Shared Acuris eslint configuration and code quality tooling.

# initialize your project

The simplest and preferred way to initialise your project is to run in your project folder this command:

```sh
npx @acuris/eslint-config@latest --init
```

This will start an interactive initialisation script that will setup everything you need, including packages installation.

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
