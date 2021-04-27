# csv-unique-values

A script to get unique values from columns in any CSV file.

Our use case is to run this script to populate in-app dropdowns with all possible values,
but there's plenty more you can do with it, for example if you want to remove
duplicates from a list of e-mails or phone numbers, …

## Usage

Pull in this repository locally, then run

```
Usage: node index.js [options]

Options:
  -v, --version                output the version number
  -i, --input <file>           input CSV file
  -d, --delimiter <delimiter>  delimiter used in the CSV (default: ",")
  -c, --columns <columns>      columns to extract, comma-separated
                               you can get unique values per unique values from another column by
                               chaining them together using `::`
                               (default: all columns)
  -o, --output <directory>     output destination, will create a file per column
  --no-sort                    don't sort unique values
  -h, --help                   display help for command
```

If we publish this to NPM, it'd be

```
npx @dbl-works/csv-unique-values [options]
```

## Example

For an example input file `team.csv`

```csv
Name, Country, Region
Joe, US, NA
Joelle, US, NA
John, CA, NA
Johan, DE, EU
Johanna, DE, EU
```

and running

```npx @dbl-works/csv-unique-values --input team.csv --keys country --output ~/Desktop/team-country```

will generate `country.json` with contents

```json
[
  "CA",
  "DE",
  "US"
]
```

To get all countries *per region* you can run:

```npx @dbl-works/csv-unique-values --input team.csv --keys region::country --output ~/Desktop/team-country```

and you will get:

```json
{
  "NA": [
    "CA",
    "US",
  ],
  "EU": [
    "DE"
  ]
}
```
