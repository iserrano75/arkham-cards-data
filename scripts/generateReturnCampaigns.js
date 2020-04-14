const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');
const jsonlint = require('jsonlint');

const getFilePaths = (folderPath) => {
  const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
  const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
  const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
  const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
  return [...filePaths, ...dirFiles];
};

getFilePaths('./return_campaigns').sort().map(file => {
  if (file.endsWith('.schema.json') || !file.endsWith('.json')) {
    return;
  }
  const json = jsonlint.parse(fs.readFileSync(file, 'utf-8').toString());
  const originalId = json.original_id;
  if (file.endsWith('campaign.json')) {
    const originalData = fs.readFileSync(
      file.replace('return_campaigns/rt', 'campaigns/'),
      'utf-8'
    ).toString();
    const originalJson = jsonlint.parse(originalData);

    const targetDir = `./build/return_campaigns/${json.id}`;
    fs.mkdirSync(targetDir, { recursive: true });

    fs.writeFileSync(`${targetDir}/campaign.json`,
      JSON.stringify({
        ...originalJson,
        ...json,
        original_id: undefined,
      }, null, 2)
    );
  } else {
    if (!json.id || !json.original_id) {
      throw new Error(`${file} is missing id/original_id`);
    }
    const newFile = file.replace('return_campaigns/rt', './campaigns/')
      .replace(json.id, json.original_id);
    console.log(newFile);
    const originalJson = jsonlint.parse(fs.readFileSync(newFile, 'utf-8').toString());
    const newStepsIds = new Set(json.steps.map(step => step.id));
    const steps = [
      ...originalJson.steps.filter(step => !newStepsIds.has(step.id)),
      ...json.steps,
    ];
    fs.writeFileSync(file.replace('return_campaigns', './build/return_campaigns'),
      JSON.stringify({
        ...originalJson,
        ...json,
        steps,
        original_id: undefined,
      }, null, 2)
    );
  }
});