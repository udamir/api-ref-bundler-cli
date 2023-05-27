#!/usr/bin/env node
import { bundle } from "api-ref-bundler"
import { program } from "commander"
import { promises as fs } from "fs"
import path from "path"
import yaml from "js-yaml"

const { version } = require('../package.json')

const resolver = async (sourcePath: string): Promise<object> => {
  const file = await fs.readFile(path.join(process.cwd(), sourcePath), "utf8")
  return yaml.load(file) as object
}

const dumpApi = async (data: any, format: "yaml" | "json"): Promise<string> => {
  if (format === "yaml") {
    return yaml.dump(data, { 
      noRefs: true,
      skipInvalid: true
    })
  } else if (format === "json") {
    return JSON.stringify(data, null, 2)
  }
  return ""
}

const bundler = async (filename: string, dest: string = "", format: "yaml" | "json" = "json") => {
  const result = await bundle(filename, resolver, { 
    hooks: { 
      onError: (msg) => {
        throw new Error(msg)
      } 
    }
  })
  const name = filename.split("/").slice(-1).join("").replace(/.(json|yaml|yml)$/gi, "") + "-bundle." + format
  const dump = await dumpApi(result, format)
  await fs.writeFile(path.join(process.cwd(), dest, name), dump, { encoding: "utf-8" })

  return path.join(dest, name)
}

export function cli(args: any) {
  program 
    .version(version, '-v, --version', 'Output the current version')
    .argument('<source>', 'OpenApi document')
    .description('Open')

  program
    .option('-d, --dest [dest]', 'Output destination');
  program
    .option('-f, --format [format]', 'Output format: "json" or "yaml"');

  program.parse(args)

  const options = program.opts()
  const { dest, format } = options

  const source = program.args[0]

  if (source) {
    bundler(source, dest, format).then((path) => {
      console.log("Bundle build:", path)
    }).catch((error) => {
      console.error(error)
    })
  }
}
