# jbrowse-plugin-template

> Template to quickly start a new JBrowse plugin

## Usage

You can use this template to create a new GitHub repository or a new local
project.

### Create a new GitHub repository from this template

You can click the "Use this template" button in the repository (instructions
[here](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template)):

![screenshot showing where "Use this template" button is in the GitHub repository page](https://user-images.githubusercontent.com/25592344/102671843-eb8ae380-414c-11eb-84e5-6ebf10bd89f9.png)

Or you can use the GitHub CLI:

```console
$ gh repo create jbrowse-plugin-my-project --template https://github.com/GMOD/jbrowse-plugin-template.git
```

### Create a new local project

```console
$ git clone https://github.com/GMOD/jbrowse-plugin-template.git jbrowse-plugin-my-project
$ cd jbrowse-plugin-my-project
$ rm -rf .git
$ # If you want to use Git, re-initialize it
$ git init
```

## Getting started

### Setup

Run `yarn init` (or `npm init`) and answer the prompts to fill out the
information for your plugin
- Make sure you at least enter a "name" (probably starting with
  "jbrowse-plugin-", or "@myscope/jbrowse-plugin-" if you're going to publish to
  an NPM organization)
- Other fields may be left blank
- leave the "entry point" as `dist/index.js`

Then in the `package.json` file, make the following updates:
- Change "name" in the "jbrowse-plugin" field to the name of your project (e.g.
  "MyProject")
- In the "scripts" field, replace the default name with the name of your
  project, prefixed with "JBrowsePlugin" in the "start" and "build" entries
- In the "module" field, replace `jbrowse-plugin-my-project` with the name of
  your project (leave off the `@myscope` if using a scoped package name) (you
  can double-check that the filename is correct after running the build step
  below and comparing the filename to the file in the `dist/` folder)

Now run `yarn` (or `rm yarn.lock && npm install` to use npm instead of yarn)

### Build

```console
$ yarn build ## or `npm run build`
```

### Development

To develop against JBrowse Web:

- Update `jbrowse_config.json` with the name of your plugin (same name as was
  used in "my-plugin" in `package.json`) and the correct url (easiest way to
  get the url filename is to run build the project and then look for the file
  that ends in `.umd.development.js`)
- Start a development version of JBrowse Web (see
  [here](https://github.com/GMOD/jbrowse-components/blob/master/CONTRIBUTING.md))
- In this project, run `yarn start` (or `npm run start`)
- Assuming JBrowse Web is being served on port 3000, navigate in your web
  browser to
  http://localhost:3000/?config=http://localhost:9000/jbrowse_config.json
- When you make changes to your plugin, it will automatically be re-built.
  You can then refresh JBrowse Web to see the changes.

### Publishing

Once you have developed your plugin, you can publish it to NPM. Remember to
remove `"private": true` from `package.json` before doing so.

If you are using `@jbrowse/react-linear-genome-view`, you can install the plugin
from NPM and use it there. If you are using JBrowse Web, after the plugin is
published to NPM, you can use [unpkg](https://unpkg.com/) to host plugin bundle.
A JBrowse Web config using this plugin would look like this:

```json
{
  "plugins": [
    {
      "name": "MyProject",
      "url": "https://unpkg.com/browse/jbrowse-plugin-my-project/dist/jbrowse-plugin-my-project.umd.production.min.js"
    }
  ]
}

```

You can also use a specific version in unpkg, such as
`https://unpkg.com/browse/jbrowse-plugin-my-project@1.0.1/dist/jbrowse-plugin-my-project.umd.production.min.js`


### TypeScript vs. JavaScript

This template is set up in such a way that you can use both TypeScript and
JavaScript for development. If using only JavaScript, you can change
`src/index.ts` to `src/index.js`. If using only TypeScript, you can remove
`"allowJs": true` from `tsconfig.json` and `"@babel/preset-react"` from
`.babelrc` (and from "devDependencies" in `package.json`).
