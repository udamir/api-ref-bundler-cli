#!/usr/bin/env node
import { ApiRefBundler } from "api-ref-bundler"
import { program } from "commander"
import { promises as fs } from "fs"
import path from "path"
import yaml from "js-yaml"

const { version } = require('../package.json')

const resolver = async (sourcePath: string): Promise<object> => {
  const file = await fs.readFile(path.join(process.cwd(), sourcePath), "utf8")
  return yaml.load(file) as object
}

const bundler = async (filename: string, dest: string = "", format: "yaml" | "json" = "json") => {

  const refparser = new ApiRefBundler(filename, resolver)
  const result = await refparser.run()
  if (refparser.errors.length) {
    throw new Error(refparser.errors[0])
  }
  const name = filename.split("/").slice(-1).join("").replace(/.(json|yaml|yml)$/gi, "") + "-bundle." + format
  if (format === "yaml") {
    await fs.writeFile(path.join(process.cwd(), dest, name), yaml.dump(result, { noRefs: true, skipInvalid: true }), { encoding: "utf-8" })
  } else {
    await fs.writeFile(path.join(process.cwd(), dest, name), JSON.stringify(result, null, 2), { encoding: "utf-8" })
  }
  return path.join(dest, name)
}

export function cli(args: any) {
  program 
    .version(version)
    .argument('<source>', 'OpenApi document')
    .alias('v')
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
