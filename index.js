#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const { Command } = require('commander');
const parser = require('csv-parser');

const program = new Command();
program.version('0.0.1', '-v, --version');

program
  .requiredOption('-i, --input <file>', 'input CSV file')
  .option('-d, --delimiter <delimiter>', 'delimiter used in the CSV', ',')
  .option(
    '-c, --columns <columns>',
    'columns to extract, comma-separated, all by default'
  )
  .option(
    '-o, --output <directory>',
    'output destination, will create a file per column'
  )
  .option('--no-sort', "don't sort unique values");

program.parse(process.argv);

const input = fs.createReadStream(path.resolve(program.opts().input));

class SetWithToJSONSupport extends Set {
  toJSON() {
    const asArray = Array.from(this);

    return program.opts().sort
      ? asArray.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
      : asArray;
  }
}

const uniqueValues = {};

input
  .on('error', (error) => {
    console.error('Error while reading input file', error);
  })
  .pipe(parser({ separator: program.opts().delimiter }))
  .on('data', (row) => {
    const columns = program.opts().columns
      ? program.opts().columns.split(',')
      : Object.keys(row);

    columns.forEach((column) => {
      const groups = column.split('::');

      if (groups.length === 1) {
        const value = row[column];

        if (typeof value === 'undefined') {
          return;
        }

        if (!uniqueValues[column]) {
          uniqueValues[column] = new SetWithToJSONSupport();
        }

        uniqueValues[column].add(value);
        return;
      }

      if (!uniqueValues[column]) {
        uniqueValues[column] = {};
      }

      let target = uniqueValues[column];

      groups.forEach((group, i) => {
        const value = row[group];

        if (typeof value === 'undefined') {
          return;
        }

        if (i === groups.length - 1) {
          target.add(value);
        } else if (i === groups.length - 2) {
          if (!target[value]) {
            target[value] = new SetWithToJSONSupport();
          }

          target = target[value];
        } else {
          if (!target[value]) {
            target[value] = {};
          }

          target = target[value];
        }
      });
    });
  })
  .on('end', async () => {
    if (!program.opts().output) {
      console.log(JSON.stringify(uniqueValues, null, 2));
      return;
    }

    const parsedOutputPath = path.normalize(program.opts().output);

    await (async () => {
      return new Promise((resolve) => {
        fs.mkdir(parsedOutputPath, { recursive: true }, (err) => {
          if (err && err.code !== 'EEXIST') {
            console.error('Error creating output directory', parsedOutputPath);
            console.error(err);
          } else {
            resolve();
          }
        });
      });
    })();

    Object.entries(uniqueValues).forEach(([column, values]) => {
      const json = JSON.stringify(values, null, 2);

      const output = fs.createWriteStream(
        path.resolve(parsedOutputPath, `${column.replace(/::/gi, '-')}.json`)
      );

      output.write(json);
    });
  });
