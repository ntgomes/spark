let filename = process.argv[2];
var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream(filename),
});

lineReader.on('line', function (line) {
  if (line.includes('All files         |')) {
    let cov = line.split('|')[4].trim();
    console.log(cov);
    return;
  }
});
