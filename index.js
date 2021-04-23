const fs = require('fs');
const path = require('path');

const { Command } = require('commander');
const parser = require('csv-parser');

const program = new Command();
program.version('0.0.1', '-v, --version');

program
  .requiredOption('-i, --input <file>', 'input CSV file')
  .option(
    '-k, --keys <keys>',
    'keys to extract, comma-separated, all by default'
  )
  .option(
    '-o, --output <directory>',
    'output destination, will create a file per key'
  )
  .option('--no-sort', "don't sort unique values");

program.parse(process.argv);

const input = fs.createReadStream(path.resolve(program.opts().input));

class SetWithToJSONSupport extends Set {
  toJSON() {
    const asArray = Array.from(this);

    return program.opts().sort
      ? asArray.sort((a, b) => a.localeCompare(b))
      : asArray;
  }
}

const uniqueValues = {};

input
  .on('error', (error) => {
    console.error('Error while reading input file', error);
  })
  .pipe(parser({ separator: ';' }))
  .on('data', (data) => {
    const keys = program.opts().keys
      ? program.opts().keys.split(',')
      : Object.keys(data);

    keys.forEach((key) => {
      const value = data[key];

      if (typeof value === 'undefined') {
        return;
      }

      if (!uniqueValues[key]) {
        uniqueValues[key] = new SetWithToJSONSupport();
      }

      uniqueValues[key].add(value);
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
        fs.mkdir(parsedOutputPath, { resursive: true }, (err) => {
          if (err && err.code !== 'EEXIST') {
            console.error('Error creating output directory', parsedOutputPath);
            console.error(err);
          } else {
            resolve();
          }
        });
      });
    })();

    Object.entries(uniqueValues).forEach(([key, values]) => {
      const json = JSON.stringify(values, null, 2);

      const output = fs.createWriteStream(
        path.resolve(parsedOutputPath, `${key}.json`)
      );
      output.write(json);
    });
  });
